const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  uniqueMessage,
  uniqueStringData,
  schemaOptions,
  validLevels,
} = require("../constants");

const { enumStringData } = require("../helpers");

const level = enumStringData(uniqueStringData, validLevels);
const attributes = { level };
const gradeSchema = new mongoose.Schema(attributes, schemaOptions);

gradeSchema.methods.toJSON = function () {
  const grade = this.toObject();
  delete grade._id;
  delete grade.__v;
  return grade;
};

gradeSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("grade", gradeSchema);
