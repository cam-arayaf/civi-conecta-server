const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  uniqueMessage,
  defaultArrayStringData,
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

const validateDescObj = {
  validator: (value) => /^.{6,}$/.test(value),
  message: (props) => `${props.path} must be at least 6 characters`,
};

const number = requiredNumberData;
const title = normalStringData(requiredStringData, validateTitle);
const description = normalStringData(requiredStringData, validateDescObj);
const objetives = normalStringData(requiredStringData, validateDescObj);
const unit = objectIdData(Schema, "unit", required);
const files = defaultArrayStringData;
const attributes = { number, title, description, objetives, unit, files };
const classSchema = new Schema(attributes, schemaOptions);

classSchema.methods.toJSON = function () {
  const classS = this.toObject();
  delete classS._id;
  delete classS.__v;
  return classS;
};

classSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("class", classSchema);
