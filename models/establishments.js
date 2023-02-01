const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  required,
  uniqueMessage,
  requiredStringData,
  uniqueNumberData,
  booleanData,
  schemaOptions,
  validateText,
  validateLetterAToZ,
  validateLetterAToD,
  validateRun,
} = require("../constants");

const { normalStringData, objectIdData } = require("../helpers");
const { Schema } = mongoose;

const number = uniqueNumberData;
const name = normalStringData(requiredStringData, validateText);
const active = booleanData;
const grade = objectIdData(Schema, "grade", required);
const character = normalStringData(requiredStringData, validateLetterAToZ);
const nameStudent = normalStringData(requiredStringData, validateText);
const run = normalStringData(requiredStringData, validateRun);
const survey = objectIdData(Schema, "survey", required);
const alternative = normalStringData(requiredStringData, validateLetterAToD);
const surveys = { type: [{ survey, alternative }], default: [] };
const students = { type: [{ name: nameStudent, run, surveys }], required };
const letters = { type: [{ character, students }], required };
const courses = { type: [{ grade, letters }], default: [] };
const attributes = { number, name, active, courses };
const establishmentSchema = new Schema(attributes, schemaOptions);

establishmentSchema.methods.toJSON = function () {
  const establishment = this.toObject();
  establishment.courses.forEach((c) => delete c._id);
  delete establishment._id;
  delete establishment.__v;
  return establishment;
};

establishmentSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("establishment", establishmentSchema);
