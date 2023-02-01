const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const {
  uniqueMessage,
  requiredStringData,
  uniqueNumberData,
  schemaOptions,
  validateText,
} = require("../constants");

const { normalStringData } = require("../helpers");

const number = uniqueNumberData;
const title = normalStringData(requiredStringData, validateText);
const attributes = { number, title };
const topicSchema = new mongoose.Schema(attributes, schemaOptions);

topicSchema.methods.toJSON = function () {
  const topic = this.toObject();
  delete topic._id;
  delete topic.__v;
  return topic;
};

topicSchema.plugin(uniqueValidator, uniqueMessage);

module.exports = mongoose.model("topic", topicSchema);
