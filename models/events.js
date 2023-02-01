const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const planningSchema = require("./planning");

const {
  required,
  uniqueMessage,
  requiredStringData,
  requiredNumberData,
  requiredDateData,
  schemaOptions,
  validateText,
} = require("../constants");

const { normalStringData, objectIdData } = require("../helpers");
const { Schema } = mongoose;

const number = requiredNumberData;
const title = normalStringData(requiredStringData, validateText);
const description = normalStringData(requiredStringData, validateText);
const grade = objectIdData(Schema, "grade", required);
const date = requiredDateData;
const attributesObjOne = { number, title, description };
const attributesObjTwo = { planning: planningSchema, grade, date };
const attributesObj = { ...attributesObjOne, ...attributesObjTwo };
const eventSchema = new Schema(attributesObj, schemaOptions);

eventSchema.methods.toJSON = function () {
  const event = this.toObject();
  delete event._id;
  delete event.__v;
  delete event.planning._id;
  event.planning.materials.forEach((m) => delete m._id);
  return event;
};

eventSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("event", eventSchema);
