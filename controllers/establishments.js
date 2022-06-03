const Establishments = require("../models/establishments");
const Grades = require("../models/grades");
const { errorResponse, nullCatch } = require("../helpers");

const getEstablishments = async (req, resp) => {
  Establishments.find({})
    .sort({ active: -1, number: 1 })
    .populate({ path: "grades", select: "-_id -__v" })
    .exec((error, establishments) => {
      if (error) return errorResponse(resp, 500, error);
      resp.json({ ok: true, total: establishments.length, establishments });
    });
};

const createEstablishment = async (req, resp) => {
  const { number, name, grades: gradesToFind } = req.body;
  const queryGrades = { level: { $in: gradesToFind } };
  const grades = await Grades.find(queryGrades).exec().catch(nullCatch);
  if (!grades.length) return errorResponse(resp, 400, "No grades available");
  const gradesId = grades.map(({ _id }) => _id);

  new Establishments({ number, name, grades: gradesId }).save(
    async (error, establishment) => {
      if (error) return errorResponse(resp, 500, error);
      const popGrades = { path: "grades", select: "-_id -__v" };
      const newEst = await establishment.populate(popGrades).execPopulate();
      resp.json({ ok: true, establishment: newEst });
    }
  );
};

const updateEstablishment = async (req, resp) => {
  const { query, body } = req;
  const { name, grades: gradesToFind } = body;
  const queryGrades = { level: { $in: gradesToFind } };
  const grades = await Grades.find(queryGrades).exec().catch(nullCatch);
  if (!grades.length) return errorResponse(resp, 400, "No grades available");
  const gradesId = grades.map(({ _id }) => _id);

  Establishments.findOneAndUpdate(
    { number: query.number },
    { name, grades: gradesId },
    { new: true, runValidators: true, context: "query" },
    async (error, establishment) => {
      if (error) return errorResponse(resp, 500, error);
      const errorMessage = "Establishment not found";
      if (!establishment) return errorResponse(resp, 400, errorMessage);
      const popGrades = { path: "grades", select: "-_id -__v" };
      const newEst = await establishment.populate(popGrades).execPopulate();
      resp.json({ ok: true, establishment: newEst });
    }
  );
};

const inactivateEstablishment = (req, resp) => {
  Establishments.findOneAndUpdate(
    { number: req.query.number },
    { active: false },
    { new: true },
    async (error, establishment) => {
      if (error) return errorResponse(resp, 500, error);
      const errorMessage = "Establishment not found";
      if (!establishment) return errorResponse(resp, 400, errorMessage);
      const popGrades = { path: "grades", select: "-_id -__v" };
      const newEst = await establishment.populate(popGrades).execPopulate();
      resp.json({ ok: true, establishment: newEst });
    }
  );
};

const reactivateEstablishment = (req, resp) => {
  Establishments.findOneAndUpdate(
    { number: req.query.number },
    { active: true },
    { new: true },
    async (error, establishment) => {
      if (error) return errorResponse(resp, 500, error);
      const errorMessage = "Establishment not found";
      if (!establishment) return errorResponse(resp, 400, errorMessage);
      const popGrades = { path: "grades", select: "-_id -__v" };
      const newEst = await establishment.populate(popGrades).execPopulate();
      resp.json({ ok: true, establishment: newEst });
    }
  );
};

module.exports = {
  getEstablishments,
  createEstablishment,
  updateEstablishment,
  inactivateEstablishment,
  reactivateEstablishment,
};
