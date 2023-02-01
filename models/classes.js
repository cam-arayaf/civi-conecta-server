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
const objetives = normalStringData(requiredStringData, validateText);
const unit = objectIdData(Schema, "unit", required);
const attributesObjOne = { number, title, description, objetives };
const attributesObjTwo = { planning: planningSchema, unit };
const attributesObj = { ...attributesObjOne, ...attributesObjTwo };
const classSchema = new Schema(attributesObj, schemaOptions);

classSchema.methods.toJSON = function () {
  const classS = this.toObject();
  delete classS._id;
  delete classS.__v;
  delete classS.planning._id;
  classS.planning.materials.forEach((m) => delete m._id);
  return classS;
};

classSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("class", classSchema);
