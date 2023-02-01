const fs = require("fs");
const ftp = require("basic-ftp");
const Grades = require("../models/grades");
const Exceptions = require("../models/exceptions");

const {
  errorResponse,
  getFileUrl,
  getFtpConnectionOptions,
  nullCatch,
} = require("../helpers");

const getTotalFilesByException = async (gradeLevel, exceptionNumber) => {
  const pathFind = `./grades/${gradeLevel}/exceptions/${exceptionNumber}`;
  const client = new ftp.Client();

  try {
    await client.access(getFtpConnectionOptions());
    const list = await client.list(pathFind);
    client.close();
    return list.map((f) => f.name).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  } catch (error) {
    client.close();
    return [];
  }
};

const getFinalFilesByException = async (req, gradeLevel, exceptionNumber) => {
  const totalFilesByException = await getTotalFilesByException(
    gradeLevel,
    exceptionNumber
  );

  return totalFilesByException.map((fileName) => ({
    fileName,
    getPath: getFileUrl(
      req,
      `/getFileByExceptionAndGrade?exception=${exceptionNumber}&grade=${gradeLevel}&file=${fileName}`
    ),
    deletePath: getFileUrl(
      req,
      `/deleteFileByExceptionAndGrade?exception=${exceptionNumber}&grade=${gradeLevel}&file=${fileName}`
    ),
  }));
};

const getGradeAndException = ({
  number: exceptionNumber,
  grade: { level: gradeLevel },
}) => ({ gradeLevel, exceptionNumber });

const addFilesToException = async (req, exceptionObj) => {
  const { gradeLevel, exceptionNumber } = getGradeAndException(exceptionObj);

  const files = await getFinalFilesByException(
    req,
    gradeLevel,
    exceptionNumber
  );

  exceptionObj._doc.files = files;
};

const addFilesToExceptions = async (req, exceptionsArr) =>
  await Promise.all(
    exceptionsArr.map(
      async (exceptionObj) => await addFilesToException(req, exceptionObj)
    )
  );

const getExceptionsByGrade = async (req, resp) => {
  const queryGrade = { level: req.query.grade };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");

  Exceptions.find({ grade: grade._id })
    .sort({ number: 1 })
    .populate({ path: "grade", select: "-_id -__v" })
    .exec(async (error, exceptions) => {
      if (error) return errorResponse(resp, 500, error);
      await addFilesToExceptions(req, exceptions);
      resp.json({ ok: true, total: exceptions.length, exceptions });
    });
};

const createException = async (req, resp) => {
  const { number, title, description, planning, grade: gradeToFind } = req.body;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryExc = { number, grade: grade._id };
  const prevExc = await Exceptions.findOne(queryExc).exec().catch(nullCatch);
  if (prevExc) return errorResponse(resp, 400, "Exception already exists");

  new Exceptions({
    number,
    title,
    description,
    planning,
    grade: grade._id,
  }).save(async (error, exception) => {
    if (error) return errorResponse(resp, 500, error);
    const popGrade = { path: "grade", select: "-_id -__v" };
    const newException = await exception.populate(popGrade);
    await addFilesToException(req, newException);
    resp.json({ ok: true, exception: newException });
  });
};

const updateException = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;
  const { title, description, planning } = req.body;
  const queryGrade = { level: levelToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available in filter");

  Exceptions.findOneAndUpdate(
    { number, grade: grade._id },
    { title, description, planning },
    { new: true, runValidators: true, context: "query" },
    async (error, exception) => {
      if (error) return errorResponse(resp, 500, error);
      if (!exception) return errorResponse(resp, 400, "Exception not found");
      const popGrade = { path: "grade", select: "-_id -__v" };
      const newException = await exception.populate(popGrade);
      await addFilesToException(req, newException);
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
      const newException = await exception.populate(popGrade);
      await addFilesToException(req, newException);
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
