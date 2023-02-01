const Grades = require("../models/grades");
const Units = require("../models/units");
const Classes = require("../models/classes");
const Exceptions = require("../models/exceptions");
const Events = require("../models/events");
const { errorResponse, nullCatch } = require("../helpers");

const checkIfClassExists = async (req, resp, next) => {
  const { query } = req;
  const { class: classToFind, unit: unitToFind, grade: gradeToFind } = query;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryUnit = { number: unitToFind, grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (!unit) return errorResponse(resp, 400, "No unit available");
  const queryClass = { number: classToFind, unit: unit._id };
  const classF = await Classes.findOne(queryClass).exec().catch(nullCatch);
  if (!classF) return errorResponse(resp, 400, "No class available");
  req.pathFind = `./grades/${gradeToFind}/units/${unitToFind}/classes/${classToFind}`;
  next();
};

const checkIfExceptionExists = async (req, resp, next) => {
  const { exception: exceptionToFind, grade: gradeToFind } = req.query;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryExc = { number: exceptionToFind, grade: grade._id };
  const exception = await Exceptions.findOne(queryExc).exec().catch(nullCatch);
  if (!exception) return errorResponse(resp, 400, "No exception available");
  req.pathFind = `./grades/${gradeToFind}/exceptions/${exceptionToFind}`;
  next();
};

const checkIfEventExists = async (req, resp, next) => {
  const { event: eventToFind, grade: gradeToFind } = req.query;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryEvent = { number: eventToFind, grade: grade._id };
  const event = await Events.findOne(queryEvent).exec().catch(nullCatch);
  if (!event) return errorResponse(resp, 400, "No event available");
  req.pathFind = `./grades/${gradeToFind}/events/${eventToFind}`;
  next();
};

module.exports = {
  checkIfClassExists,
  checkIfExceptionExists,
  checkIfEventExists,
};
