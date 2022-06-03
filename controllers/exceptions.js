const Grades = require("../models/grades");
const Exceptions = require("../models/exceptions");

const {
  errorResponse,
  addBaseUrlToFile,
  addBaseUrlToFiles,
  nullCatch,
} = require("../helpers");

const getExceptionsByGrade = async (req, resp) => {
  const queryGrade = { level: req.query.grade };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");

  Exceptions.find({ grade: grade._id })
    .sort({ number: 1 })
    .populate({ path: "grade", select: "-_id -__v" })
    .exec((error, exceptions) => {
      if (error) return errorResponse(resp, 500, error);
      addBaseUrlToFiles(req, exceptions);
      resp.json({ ok: true, total: exceptions.length, exceptions });
    });
};

const createException = async (req, resp) => {
  const { number, title, description, grade: gradeToFind } = req.body;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryExc = { number, grade: grade._id };
  const prevExc = await Exceptions.findOne(queryExc).exec().catch(nullCatch);
  if (prevExc) return errorResponse(resp, 400, "Exception already exists");

  new Exceptions({ number, title, description, grade: grade._id }).save(
    async (error, exception) => {
      if (error) return errorResponse(resp, 500, error);
      const popGrade = { path: "grade", select: "-_id -__v" };
      const newException = await exception.populate(popGrade).execPopulate();
      addBaseUrlToFile(req, newException);
      resp.json({ ok: true, exception: newException });
    }
  );
};

const updateException = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;
  const { title, description } = req.body;
  const queryGrade = { level: levelToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available in filter");

  Exceptions.findOneAndUpdate(
    { number, grade: grade._id },
    { title, description },
    { new: true, runValidators: true, context: "query" },
    async (error, exception) => {
      if (error) return errorResponse(resp, 500, error);
      if (!exception) return errorResponse(resp, 400, "Exception not found");
      const popGrade = { path: "grade", select: "-_id -__v" };
      const newException = await exception.populate(popGrade).execPopulate();
      addBaseUrlToFile(req, newException);
      resp.json({ ok: true, exception: newException });
    }
  );
};

const deleteException = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;
  const queryGrade = { level: levelToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");

  Exceptions.findOneAndDelete(
    { number, grade: grade._id },
    async (error, exception) => {
      if (error) return errorResponse(resp, 500, error);
      if (!exception) return errorResponse(resp, 400, "Exception not found");
      const popGrade = { path: "grade", select: "-_id -__v" };
      const newException = await exception.populate(popGrade).execPopulate();
      addBaseUrlToFile(req, newException);
      resp.json({ ok: true, exception: newException });
    }
  );
};

module.exports = {
  getExceptionsByGrade,
  createException,
  updateException,
  deleteException,
};
