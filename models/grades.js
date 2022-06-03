const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  enumMessage,
  uniqueMessage,
  uniqueStringData,
  schemaOptions,
} = require("../constants");

const { enumStringData } = require("../helpers");

const validLevels = {
  values: ["5º", "6º", "7º", "8º"],
  message: `${enumMessage} level`,
};

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
