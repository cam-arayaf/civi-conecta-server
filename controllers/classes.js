const ftp = require("basic-ftp");
const Grades = require("../models/grades");
const Units = require("../models/units");
const Classes = require("../models/classes");

const {
  errorResponse,
  getFileUrl,
  getFtpConnectionOptions,
  nullCatch,
} = require("../helpers");

const getTotalFilesByClass = async (gradeLevel, unitNumber, classNumber) => {
  const pathFind = `./grades/${gradeLevel}/units/${unitNumber}/classes/${classNumber}`;
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

const getFinalFilesByClass = async (
  req,
  gradeLevel,
  unitNumber,
  classNumber
) => {
  const totalFilesByClass = await getTotalFilesByClass(
    gradeLevel,
    unitNumber,
    classNumber
  );

  return totalFilesByClass.map((fileName) => ({
    fileName,
    getPath: getFileUrl(
      req,
      `/getFileByClassUnitAndGrade?class=${classNumber}&unit=${unitNumber}&grade=${gradeLevel}&file=${fileName}`
    ),
    deletePath: getFileUrl(
      req,
      `/deleteFileByClassUnitAndGrade?class=${classNumber}&unit=${unitNumber}&grade=${gradeLevel}&file=${fileName}`
    ),
  }));
};

const getGradeAndUnitAndClass = ({
  number: classNumber,
  unit: {
    number: unitNumber,
    grade: { level: gradeLevel },
  },
}) => ({ gradeLevel, unitNumber, classNumber });

const addFilesToClass = async (req, classObj) => {
  const { gradeLevel, unitNumber, classNumber } =
    getGradeAndUnitAndClass(classObj);

  const files = await getFinalFilesByClass(
    req,
    gradeLevel,
    unitNumber,
    classNumber
  );

  classObj._doc.files = files;
};

const addFilesToClasses = async (req, classesArr) =>
  await Promise.all(
    classesArr.map(async (classObj) => await addFilesToClass(req, classObj))
  );

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
  const select = "-_id -__v";
  const popGrade = { path: "grade", select };
  const popTopic = { path: "topic", select };
  const populate = [popGrade, popTopic];
  const popUnit = { path: "unit", select, populate };

  Classes.find(queryClass)
    .sort({ number: 1 })
    .populate(popUnit)
    .exec(async (error, classes) => {
      if (error) return errorResponse(resp, 500, error);
      await addFilesToClasses(req, classes);
      resp.json({ ok: true, total: classes.length, classes });
    });
};

const createClass = async (req, resp) => {
  const {
    number,
    title,
    description,
    objetives,
    planning,
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
  const select = "-_id -__v";
  const popGrade = { path: "grade", select };
  const popTopic = { path: "topic", select };
  const populate = [popGrade, popTopic];
  const popUnit = { path: "unit", select, populate };

  const prevClass = await Classes.findOne(queryClass)
    .populate(popUnit)
    .exec()
    .catch(nullCatch);

  if (prevClass) return errorResponse(resp, 400, "Class already exists");

  const body = {
    number,
    title,
    description,
    objetives,
    planning,
    unit: unit._id,
  };

  new Classes(body).save(async (error, newClass) => {
    if (error) return errorResponse(resp, 500, error);
    const createdClass = await newClass.populate(popUnit);
    await addFilesToClass(req, createdClass);
    resp.json({ ok: true, class: createdClass });
  });
};

const updateClass = async (req, resp) => {
  const { number, unit: unitToFind, grade: gradeToFind } = req.query;
  const { title, description, objetives, planning } = req.body;
  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryUnit = { number: unitToFind, grade: grade._id };
  const unit = await Units.findOne(queryUnit).exec().catch(nullCatch);
  if (!unit) return errorResponse(resp, 400, "No unit available");
  const queryClass = { number, unit: unit._id };
  const bodyClass = { title, description, objetives, planning };
  const optionsClass = { new: true, runValidators: true, context: "query" };
  const select = "-_id -__v";
  const popGrade = { path: "grade", select };
  const popTopic = { path: "topic", select };
  const populate = [popGrade, popTopic];
  const popUnit = { path: "unit", select, populate };

  Classes.findOneAndUpdate(queryClass, bodyClass, optionsClass)
    .populate(popUnit)
    .exec(async (error, updatedClass) => {
      if (error) return errorResponse(resp, 500, error);
      if (!updatedClass) return errorResponse(resp, 400, "No class available");
      await addFilesToClass(req, updatedClass);
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
  const select = "-_id -__v";
  const popGrade = { path: "grade", select };
  const popTopic = { path: "topic", select };
  const populate = [popGrade, popTopic];
  const popUnit = { path: "unit", select, populate };

  Classes.findOneAndDelete(queryClass)
    .populate(popUnit)
    .exec(async (error, deletedClass) => {
      if (error) return errorResponse(resp, 500, error);
      if (!deletedClass) return errorResponse(resp, 400, "No class available");
      await addFilesToClass(req, deletedClass);
      resp.json({ ok: true, class: deletedClass });
    });
};

module.exports = {
  getClassesByUnitAndGrade,
  createClass,
  updateClass,
  deleteClass,
};
