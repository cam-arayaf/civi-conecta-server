const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  enumMessage,
  uniqueMessage,
  requiredStringData,
  uniqueStringData,
  booleanData,
  schemaOptions,
} = require("../constants");

const {
  normalStringData,
  enumStringData,
  objectIdData,
  arrayObjectIdData,
} = require("../helpers");

const { Schema } = mongoose;

const validateName = {
  validator: (value) => /^[a-zA-Z ]{3,100}$/.test(value),
  message: (props) =>
    `${props.path} must only have letters between A to Z and have between 3 to 100 characters`,
};

const validateEmail = {
  validator: (value) =>
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value),
  message: (props) =>
    `${props.path} must have a correct format of email addresses`,
};

const validatePassword = {
  validator: (value) =>
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/.test(
      value
    ),
  message: (props) =>
    `${props.path} is required and must have at least one lowercase letter, one uppercase letter, one numeric digit, one special character and be between 8 and 15 characters`,
};

const validRoles = {
  values: ["Administrator", "User"],
  message: `${enumMessage} role`,
};

const email = normalStringData(uniqueStringData, validateEmail);
const name = normalStringData(requiredStringData, validateName);
const password = normalStringData(requiredStringData, validatePassword);
const role = enumStringData(requiredStringData, validRoles);
const active = booleanData;
const establishment = objectIdData(Schema, "establishment", required);
const grades = arrayObjectIdData(Schema, "grade", required);
const workplaces = { type: [{ establishment, grades }], required: false };
const attributes = { email, name, password, role, active, workplaces };
const userSchema = new Schema(attributes, schemaOptions);

userSchema.pre("save", function (next) {
  const { password, role, workplaces } = this;
  const isModifiedPassword = this.isModified("password");
  if (isModifiedPassword) this.password = bcrypt.hashSync(password, 10);
  const isUserRole = role === "User";
  const hasWorkplaces = !!workplaces && !!workplaces.length;
  if (isUserRole && !hasWorkplaces) next("No workplaces available");
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const password = this.get("password");
  if (!password) next();
  const { validator, message } = validatePassword;
  if (!validator(password)) next(message({ path: "password" }));
  const query = this.getQuery();
  const body = { password: bcrypt.hashSync(password, 10) };
  const options = { new: true, runValidators: false };
  const callback = (error) => error && next(error);
  this.updateOne(query, body, options, callback);
  next();
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user._id;
  delete user.__v;
  return user;
};

userSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("user", userSchema);
