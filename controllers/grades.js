const Grades = require("../models/grades");
const Units = require("../models/units");
const { errorResponse, nullCatch } = require("../helpers");

const getGrades = async (req, resp) => {
  Grades.find({})
    .sort({ level: 1 })
    .exec((error, grades) => {
      if (error) return errorResponse(resp, 500, error);
      resp.json({ ok: true, total: grades.length, grades });
    });
};

const createGrade = (req, resp) => {
  new Grades({ level: req.body.level }).save((error, grade) => {
    if (error) return errorResponse(resp, 500, error);
    resp.json({ ok: true, grade });
  });
};

const updateGrade = async (req, resp) => {
  const { query, body } = req;
  const queryGrade = { level: query.level };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "Grade not found");
  const queryUnit = { grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (unit) return errorResponse(resp, 400, "This grade has associated units");

  Grades.findOneAndUpdate(
    queryGrade,
    { level: body.level },
    { new: true, runValidators: true, context: "query" },
    (error, grade) => {
      if (error) return errorResponse(resp, 500, error);
      resp.json({ ok: true, grade });
    }
  );
};

const deleteGrade = async (req, resp) => {
  const queryGrade = { level: req.query.level };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "Grade not found");
  const queryUnit = { grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (unit) return errorResponse(resp, 400, "This grade has associated units");

  Grades.findOneAndDelete(queryGrade, (error, grade) => {
    if (error) return errorResponse(resp, 500, error);
    resp.json({ ok: true, grade });
  });
};

module.exports = { getGrades, createGrade, updateGrade, deleteGrade };
