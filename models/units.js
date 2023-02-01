const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  uniqueMessage,
  requiredStringData,
  requiredNumberData,
  schemaOptions,
  validateText,
} = require("../constants");

const { normalStringData, objectIdData } = require("../helpers");
const { Schema } = mongoose;

const number = requiredNumberData;
const title = normalStringData(requiredStringData, validateText);
const description = normalStringData(requiredStringData, validateText);
const grade = objectIdData(Schema, "grade", required);
const topic = objectIdData(Schema, "topic", required);
const attributes = { number, title, description, grade, topic };
const unitSchema = new Schema(attributes, schemaOptions);

unitSchema.methods.toJSON = function () {
  const unit = this.toObject();
  delete unit._id;
  delete unit.__v;
  return unit;
};

unitSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("unit", unitSchema);
