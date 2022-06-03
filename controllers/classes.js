const Grades = require("../models/grades");
const Units = require("../models/units");
const Classes = require("../models/classes");

const {
  errorResponse,
  addBaseUrlToFile,
  addBaseUrlToFiles,
  nullCatch,
} = require("../helpers");

const getClassesByUnitAndGrade = async (req, resp) => {
  const { query } = req;
  const { unit: unitToFind, grade: gradeToFind } = query;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryUnit = { number: unitToFind, grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (!unit) return errorResponse(resp, 400, "No unit available");
  const queryClass = { unit: unit._id };
  const popGrade = { path: "grade", select: "-_id -__v" };
  const popUnit = { path: "unit", select: "-_id -__v", populate: popGrade };

  Classes.find(queryClass)
    .sort({ number: 1 })
    .populate(popUnit)
    .exec((error, classes) => {
      if (error) return errorResponse(resp, 500, error);
      addBaseUrlToFiles(req, classes);
      resp.json({ ok: true, total: classes.length, classes });
    });
};

const createClass = async (req, resp) => {
  const {
    number,
    title,
    description,
    objetives,
    unit: unitToFind,
    grade: gradeToFind,
  } = req.body;

  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryUnit = { number: unitToFind, grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (!unit) return errorResponse(resp, 400, "No unit available");
  const queryClass = { number, unit: unit._id };
  const popGrade = { path: "grade", select: "_id" };
  const popUnit = { path: "unit", select: "_id", populate: popGrade };

  const prevClass = await Classes.findOne(queryClass)
    .populate(popUnit)
    .exec()
    .catch(nullCatch);

  if (prevClass) return errorResponse(resp, 400, "Class already exists");
  const body = { number, title, description, objetives, unit: unit._id };

  new Classes(body).save(async (error, newClass) => {
    if (error) return errorResponse(resp, 500, error);
    const select = "-_id -__v";
    const popGradeClass = { path: "grade", select };
    const popUnitClass = { path: "unit", select, populate: popGradeClass };
    const createdClass = await newClass.populate(popUnitClass).execPopulate();
    addBaseUrlToFile(req, createdClass);
    resp.json({ ok: true, class: createdClass });
  });
};

const updateClass = async (req, resp) => {
  const { number, unit: unitToFind, grade: gradeToFind } = req.query;
  const { title, description, objetives } = req.body;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryUnit = { number: unitToFind, grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (!unit) return errorResponse(resp, 400, "No unit available");
  const queryClass = { number, unit: unit._id };
  const bodyClass = { title, description, objetives };
  const optionsClass = { new: true, runValidators: true, context: "query" };
  const popGrade = { path: "grade", select: "-_id -__v" };
  const popUnit = { path: "unit", select: "-_id -__v", populate: popGrade };

  Classes.findOneAndUpdate(queryClass, bodyClass, optionsClass)
    .populate(popUnit)
    .exec((error, updatedClass) => {
      if (error) return errorResponse(resp, 500, error);
      if (!updatedClass) return errorResponse(resp, 400, "No class available");
      addBaseUrlToFile(req, updatedClass);
      resp.json({ ok: true, class: updatedClass });
    });
};

const deleteClass = async (req, resp) => {
  const { number, unit: unitToFind, grade: gradeToFind } = req.query;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryUnit = { number: unitToFind, grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (!unit) return errorResponse(resp, 400, "No unit available");
  const queryClass = { number, unit: unit._id };
  const popGrade = { path: "grade", select: "-_id -__v" };
  const popUnit = { path: "unit", select: "-_id -__v", populate: popGrade };

  Classes.findOneAndDelete(queryClass)
    .populate(popUnit)
    .exec((error, deletedClass) => {
      if (error) return errorResponse(resp, 500, error);
      if (!deletedClass) return errorResponse(resp, 400, "No class available");
      addBaseUrlToFile(req, deletedClass);
      resp.json({ ok: true, class: deletedClass });
    });
};

module.exports = {
  getClassesByUnitAndGrade,
  createClass,
  updateClass,
  deleteClass,
};
