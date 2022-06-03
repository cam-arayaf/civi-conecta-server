const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  uniqueMessage,
  requiredStringData,
  uniqueNumberData,
  booleanData,
  schemaOptions,
} = require("../constants");

const { normalStringData, arrayObjectIdData } = require("../helpers");
const { Schema } = mongoose;

const validateName = {
  validator: (value) => /^.{6,100}$/.test(value),
  message: (props) => `${props.path} must be between 6 to 100 characters`,
};

const number = uniqueNumberData;
const name = normalStringData(requiredStringData, validateName);
const active = booleanData;
const grades = arrayObjectIdData(Schema, "grade", required);
const attributes = { number, name, active, grades };
const establishmentSchema = new Schema(attributes, schemaOptions);

establishmentSchema.methods.toJSON = function () {
  const establishment = this.toObject();
  delete establishment._id;
  delete establishment.__v;
  return establishment;
};

establishmentSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("establishment", establishmentSchema);
