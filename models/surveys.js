const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  uniqueMessage,
  requiredStringData,
  requiredNumberData,
  requiredNumberDataZeroFour,
  schemaOptions,
  validateText,
  validateLetterAToD,
  validTypes,
} = require("../constants");

const {
  normalStringData,
  enumStringData,
  objectIdData,
} = require("../helpers");

const { Schema } = mongoose;

const number = requiredNumberData;
const type = enumStringData(requiredStringData, validTypes);
const topic = objectIdData(Schema, "topic", required);
const question = normalStringData(requiredStringData, validateText);
const letter = normalStringData(requiredStringData, validateLetterAToD);
const description = normalStringData(requiredStringData, validateText);
const value = requiredNumberDataZeroFour;
const alternatives = { type: [{ letter, description, value }], required };
const attributes = { number, type, topic, question, alternatives };
const surveySchema = new Schema(attributes, schemaOptions);

surveySchema.methods.toJSON = function () {
  const survey = this.toObject();
  survey.alternatives.forEach((a) => delete a._id);
  delete survey._id;
  delete survey.__v;
  return survey;
};

surveySchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("survey", surveySchema);
