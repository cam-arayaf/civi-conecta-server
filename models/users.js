const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  uniqueMessage,
  requiredStringData,
  uniqueStringData,
  booleanData,
  schemaOptions,
  validateText,
  validateEmail,
  validatePassword,
  validRoles,
  validateLetterAToD,
} = require("../constants");

const {
  normalStringData,
  enumStringData,
  objectIdData,
} = require("../helpers");

const { Schema } = mongoose;

const email = normalStringData(uniqueStringData, validateEmail);
const name = normalStringData(requiredStringData, validateText);
const password = normalStringData(requiredStringData, validatePassword);
const encryptedPassword = booleanData;
const role = enumStringData(requiredStringData, validRoles);
const active = booleanData;
const establishmentRef = "establishment";
const establishment = objectIdData(Schema, establishmentRef, required);
const gradeRef = "establishment.courses.grade";
const grade = objectIdData(Schema, gradeRef, required);
const characterRef = "establishment.courses.letters.character";
const character = objectIdData(Schema, characterRef, required);
const survey = objectIdData(Schema, "survey", required);
const alternative = normalStringData(requiredStringData, validateLetterAToD);
const surveys = { type: [{ survey, alternative }], default: [] };
const letters = { type: [{ character, surveys }], required };
const courses = { type: [{ grade, letters }], required: true };
const workplaces = { type: [{ establishment, courses }], required: false };
const attributesOne = { email, name, password, encryptedPassword };
const attributesTwo = { role, active, workplaces };
const attributes = { ...attributesOne, ...attributesTwo };
const userSchema = new Schema(attributes, schemaOptions);

userSchema.pre("save", async function (next) {
  const isUserRole = this.role === "User";
  const isModifiedPassword = this.isModified("password");
  const mustEncryptPassword = !isUserRole && isModifiedPassword;
  this.encryptedPassword = !isUserRole;
  if (mustEncryptPassword) this.password = bcrypt.hashSync(this.password, 10);
  next();
});

userSchema.pre("findOneAndUpdate", function (next) {
  const password = this.get("password");
  if (!password) next();
  const { validator, message } = validatePassword;
  if (!validator(password)) next(message({ path: "password" }));
  const query = this.getQuery();
  const newPassword = bcrypt.hashSync(password, 10);
  const body = { password: newPassword, encryptedPassword: true };
  const options = { new: true, runValidators: false };
  const callback = (error) => error && next(error);
  this.updateOne(query, body, options, callback);
  next();
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  user.workplaces.forEach((w) => delete w._id);
  delete user.password;
  delete user._id;
  delete user.__v;
  return user;
};

userSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("user", userSchema);
