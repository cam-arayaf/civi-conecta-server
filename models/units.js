const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  uniqueMessage,
  requiredStringData,
  requiredNumberData,
  schemaOptions,
} = require("../constants");

const { normalStringData, objectIdData } = require("../helpers");
const { Schema } = mongoose;

const validateTitle = {
  validator: (value) => /^.{6,100}$/.test(value),
  message: (props) => `${props.path} must be between 6 to 100 characters`,
};

const validateDesc = {
  validator: (value) => /^.{6,}$/.test(value),
  message: (props) => `${props.path} must be at least 6 characters`,
};

const number = requiredNumberData;
const title = normalStringData(requiredStringData, validateTitle);
const description = normalStringData(requiredStringData, validateDesc);
const grade = objectIdData(Schema, "grade", required);
const attributes = { number, title, description, grade };
const unitSchema = new Schema(attributes, schemaOptions);

unitSchema.methods.toJSON = function () {
  const unit = this.toObject();
  delete unit._id;
  delete unit.__v;
  return unit;
};

unitSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("unit", unitSchema);
