const mongoose = require("mongoose");
const { required, requiredStringData, validateText } = require("../constants");
const { normalStringData } = require("../helpers");
const { Schema } = mongoose;

const topic = normalStringData(requiredStringData, validateText);
const startActivity = normalStringData(requiredStringData, validateText);
const mainActivity = normalStringData(requiredStringData, validateText);
const endActivity = normalStringData(requiredStringData, validateText);
const teaStuStr = normalStringData(requiredStringData, validateText);
const teaStuArr = { type: [teaStuStr], required };
const teacher = teaStuArr;
const student = teaStuArr;
const materials = { type: [{ teacher, student }], required };
const planningObjOne = { topic, materials };
const planningObjTwo = { startActivity, mainActivity, endActivity };
const planningObj = { ...planningObjOne, ...planningObjTwo };
const planningSchema = new Schema(planningObj);

planningSchema.methods.toJSON = function () {
  const planningS = this.toObject();
  delete planningS._id;
  delete planningS.__v;
  planningS.materials.forEach((m) => delete m._id);
  return planningS;
};

module.exports = planningSchema;
