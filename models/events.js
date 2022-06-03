const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  uniqueMessage,
  defaultArrayStringData,
  requiredStringData,
  uniqueNumberData,
  requiredDateData,
  schemaOptions,
} = require("../constants");

const { normalStringData } = require("../helpers");
const { Schema } = mongoose;

const validateTitle = {
  validator: (value) => /^.{6,100}$/.test(value),
  message: (props) => `${props.path} must be between 6 to 100 characters`,
};

const validateDesc = {
  validator: (value) => /^.{6,}$/.test(value),
  message: (props) => `${props.path} must be at least 6 characters`,
};

const number = uniqueNumberData;
const title = normalStringData(requiredStringData, validateTitle);
const description = normalStringData(requiredStringData, validateDesc);
const date = requiredDateData;
const files = defaultArrayStringData;
const attributes = { number, title, description, date, files };
const eventSchema = new Schema(attributes, schemaOptions);

eventSchema.methods.toJSON = function () {
  const event = this.toObject();
  delete event._id;
  delete event.__v;
  return event;
};

eventSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("event", eventSchema);
