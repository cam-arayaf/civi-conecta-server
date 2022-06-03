const Grades = require("../models/grades");
const Units = require("../models/units");
const Classes = require("../models/classes");
const { errorResponse, nullCatch } = require("../helpers");

const getUnitsByGrade = async (req, resp) => {
  const grade = await Grades.findOne({ level: req.query.grade })
    .exec()
    .catch(nullCatch);

  if (!grade) return errorResponse(resp, 400, "No grade available");

  Units.find({ grade: grade._id })
    .sort({ number: 1 })
    .populate({ path: "grade", select: "-_id -__v" })
    .exec((error, units) => {
      if (error) return errorResponse(resp, 500, error);
      resp.json({ ok: true, total: units.length, units });
    });
};

const createUnit = async (req, resp) => {
  const { number, title, description, grade: gradeToFind } = req.body;

  const grade = await Grades.findOne({ level: gradeToFind })
    .exec()
    .catch(nullCatch);

  if (!grade) return errorResponse(resp, 400, "No grade available");

  const prevUnit = await Units.findOne({ number, grade: grade._id })
    .exec()
    .catch(nullCatch);

  if (prevUnit) return errorResponse(resp, 400, "Unit already exists");
  const body = { number, title, description, grade: grade._id };

  new Units(body).save(async (error, unit) => {
    if (error) return errorResponse(resp, 500, error);
    const popGrade = { path: "grade", select: "-_id -__v" };
    const newUnit = await unit.populate(popGrade).execPopulate();
    resp.json({ ok: true, unit: newUnit });
  });
};

const updateUnit = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;
  const { title, description } = req.body;

  const grade = await Grades.findOne({ level: levelToFind })
    .exec()
    .catch(nullCatch);

  if (!grade) return errorResponse(resp, 400, "No grade available in filter");

  const queryAttr = { number, grade: grade._id };
  const bodyAttr = { title, description };
  const options = { new: true, runValidators: true, context: "query" };

  Units.findOneAndUpdate(queryAttr, bodyAttr, options, async (error, unit) => {
    if (error) return errorResponse(resp, 500, error);
    if (!unit) return errorResponse(resp, 400, "Unit not found");
    const popGrade = { path: "grade", select: "-_id -__v" };
    const newUnit = await unit.populate(popGrade).execPopulate();
    resp.json({ ok: true, unit: newUnit });
  });
};

const deleteUnit = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;

  const grade = await Grades.findOne({ level: levelToFind })
    .exec()
    .catch(nullCatch);

  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryUnit = { number, grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (!unit) return errorResponse(resp, 400, "Unit not found");
  const queryClass = { unit: unit._id };
  const classFind = await Classes.findOne(queryClass).exec().catch(nullCatch);
  const associatedClassesMessage = "This unit has associated classes";
  if (classFind) return errorResponse(resp, 400, associatedClassesMessage);

  Units.findOneAndDelete(queryUnit, async (error, unit) => {
    if (error) return errorResponse(resp, 500, error);
    const popGrade = { path: "grade", select: "-_id -__v" };
    const newUnit = await unit.populate(popGrade).execPopulate();
    resp.json({ ok: true, unit: newUnit });
  });
};

module.exports = { getUnitsByGrade, createUnit, updateUnit, deleteUnit };
