const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const planningSchema = require("./planning");

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
const attributesObjOne = { number, title, description };
const attributesObjTwo = { planning: planningSchema, grade };
const attributesObj = { ...attributesObjOne, ...attributesObjTwo };
const exceptionSchema = new Schema(attributesObj, schemaOptions);

exceptionSchema.methods.toJSON = function () {
  const exception = this.toObject();
  delete exception._id;
  delete exception.__v;
  delete exception.planning._id;
  exception.planning.materials.forEach((m) => delete m._id);
  return exception;
};

exceptionSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("exception", exceptionSchema);
