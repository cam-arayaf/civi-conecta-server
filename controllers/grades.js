const Grades = require("../models/grades");
const Events = require("../models/events");
const Exceptions = require("../models/exceptions");
const Units = require("../models/units");
const Establishments = require("../models/establishments");

const {
  errorResponse,
  nullCatch,
  getAssociatedEntitiesMessage,
} = require("../helpers");

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
  const queryEveExcUni = { grade: grade._id };
  const eve = await Events.findOne(queryEveExcUni).exec().catch(nullCatch);
  const errEveMsg = getAssociatedEntitiesMessage("grade", "events");
  if (eve) return errorResponse(resp, 400, errEveMsg);
  const exc = await Exceptions.findOne(queryEveExcUni).exec().catch(nullCatch);
  const errExcMsg = getAssociatedEntitiesMessage("grade", "exceptions");
  if (exc) return errorResponse(resp, 400, errExcMsg);
  const uni = await Units.findOne(queryEveExcUni).exec().catch(nullCatch);
  const errUniMsg = getAssociatedEntitiesMessage("grade", "units");
  if (uni) return errorResponse(resp, 400, errUniMsg);
  const est = await Establishments.findOne({}).exec().catch(nullCatch);
  const estFn = (e) => e.courses.some((c) => `${c.grade}` === `${grade._id}`);
  const estFind = est.find(estFn);
  const errEst = getAssociatedEntitiesMessage("grade", "establishments");
  if (estFind) return errorResponse(resp, 400, errEst);

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
  const queryEveExcUni = { grade: grade._id };
  const eve = await Events.findOne(queryEveExcUni).exec().catch(nullCatch);
  const errEveMsg = getAssociatedEntitiesMessage("grade", "events");
  if (eve) return errorResponse(resp, 400, errEveMsg);
  const exc = await Exceptions.findOne(queryEveExcUni).exec().catch(nullCatch);
  const errExcMsg = getAssociatedEntitiesMessage("grade", "exceptions");
  if (exc) return errorResponse(resp, 400, errExcMsg);
  const uni = await Units.findOne(queryEveExcUni).exec().catch(nullCatch);
  const errUniMsg = getAssociatedEntitiesMessage("grade", "units");
  if (uni) return errorResponse(resp, 400, errUniMsg);
  const est = await Establishments.findOne({}).exec().catch(nullCatch);
  const estFn = (e) => e.courses.some((c) => `${c.grade}` === `${grade._id}`);
  const estFind = est.find(estFn);
  const errEst = getAssociatedEntitiesMessage("grade", "establishments");
  if (estFind) return errorResponse(resp, 400, errEst);

  Grades.findOneAndDelete(queryGrade, (error, grade) => {
    if (error) return errorResponse(resp, 500, error);
    resp.json({ ok: true, grade });
  });
};

module.exports = { getGrades, createGrade, updateGrade, deleteGrade };
