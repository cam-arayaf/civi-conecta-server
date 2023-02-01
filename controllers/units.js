const Grades = require("../models/grades");
const Topics = require("../models/topics");
const Units = require("../models/units");
const Classes = require("../models/classes");
// const Users = require("../models/users");
// const Establishments = require("../models/establishments");
const { errorResponse, nullCatch } = require("../helpers");

// const getSortedUnits = async (
//   resp,
//   user,
//   units,
//   letter,
//   grade,
//   establishment
// ) => {
//   const foundGrade = await Grades.findOne({ level: grade })
//     .exec()
//     .catch(nullCatch);

//   if (!foundGrade) return; // errorResponse(resp, 400, "No grade available");

//   const foundEstablishment = await Establishments.findOne({
//     number: establishment,
//     active: true,
//     "courses.grade": foundGrade._id,
//     "courses.letters.character": letter,
//   })
//     .exec()
//     .catch(nullCatch);

//   if (!foundEstablishment) return; // errorResponse(resp, 400, "No establishment available");

//   const foundLetter = {};

//   foundEstablishment.courses.forEach(
//     (c) =>
//       `${c.grade}` === `${foundGrade._id}` &&
//       c.letters.forEach(
//         (l) => l.character === letter && Object.assign(foundLetter, l._doc)
//       )
//   );

//   const foundUser = await Users.findOne({
//     email: user.email,
//     active: true,
//     "workplaces.establishment": foundEstablishment._id,
//     "workplaces.courses.grade": foundGrade._id,
//     "workplaces.courses.letters.character": foundLetter._id,
//   })
//     .exec()
//     .catch(nullCatch);

//   if (!foundUser) return; // errorResponse(resp, 400, "No user available");

//   foundUser.workplaces.forEach(
//     (w) =>
//       `${w.establishment}` === `${foundEstablishment._id}` &&
//       w.courses.forEach(
//         (c) =>
//           `${c.grade}` === `${foundGrade._id}` &&
//           c.letters.forEach(
//             (l) =>
//               `${l.character}` === `${foundLetter._id}` &&
//               Object.assign(foundLetter, {
//                 teacher: {
//                   name: foundUser.name,
//                   email: foundUser.email,
//                   surveys: l.surveys,
//                 },
//               })
//           )
//       )
//   );

//   console.log("foundLetter", foundLetter);

//   const foundTopics = await Topics.find().exec().catch(nullCatch);
//   if (!foundTopics.length) return; // errorResponse(resp, 400, "No topics available");

//   console.log("foundTopics", foundTopics.map((t) => t._id));
// };

// const getSortedUnitsByLetterGradeAndEstablishment = () => {};

const getUnitsByGrade = async (req, resp) => {
  const grade = await Grades.findOne({ level: req.query.grade })
    .exec()
    .catch(nullCatch);

  if (!grade) return errorResponse(resp, 400, "No grade available");
  // await getSortedUnits(resp, { email: "user1@gmail.com" }, [], "B", "5º", "1");

  Units.find({ grade: grade._id })
    .sort({ number: 1 })
    .populate({ path: "grade", select: "-_id -__v" })
    .populate({ path: "topic", select: "-_id -__v" })
    .exec((error, units) => {
      if (error) return errorResponse(resp, 500, error);
      resp.json({ ok: true, total: units.length, units });
    });
};

const createUnit = async (req, resp) => {
  const {
    number,
    title,
    description,
    grade: gradeToFind,
    topic: topicToFind,
  } = req.body;

  const grade = await Grades.findOne({ level: gradeToFind })
    .exec()
    .catch(nullCatch);

  if (!grade) return errorResponse(resp, 400, "No grade available");

  const topic = await Topics.findOne({ number: topicToFind })
    .exec()
    .catch(nullCatch);

  if (!topic) return errorResponse(resp, 400, "No topic available");

  const prevUnit = await Units.findOne({ number, grade: grade._id })
    .exec()
    .catch(nullCatch);

  if (prevUnit) return errorResponse(resp, 400, "Unit already exists");

  const body = {
    number,
    title,
    description,
    grade: grade._id,
    topic: topic._id,
  };

  new Units(body).save(async (error, unit) => {
    if (error) return errorResponse(resp, 500, error);
    const popGra = { path: "grade", select: "-_id -__v" };
    const popTop = { path: "topic", select: "-_id -__v" };
    const newUnit = await unit.populate([popGra, popTop]);
    resp.json({ ok: true, unit: newUnit });
  });
};

const updateUnit = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;
  const { title, description, topic: topicToFind } = req.body;

  const grade = await Grades.findOne({ level: levelToFind })
    .exec()
    .catch(nullCatch);

  if (!grade) return errorResponse(resp, 400, "No grade available");

  const topic = await Topics.findOne({ number: topicToFind })
    .exec()
    .catch(nullCatch);

  if (!topic) return errorResponse(resp, 400, "No topic available");

  const queryAttr = { number, grade: grade._id };
  const bodyAttr = { title, description, topic: topic._id };
  const options = { new: true, runValidators: true, context: "query" };

  Units.findOneAndUpdate(queryAttr, bodyAttr, options, async (error, unit) => {
    if (error) return errorResponse(resp, 500, error);
    if (!unit) return errorResponse(resp, 400, "Unit not found");
    const popGra = { path: "grade", select: "-_id -__v" };
    const popTop = { path: "topic", select: "-_id -__v" };
    const newUnit = await unit.populate([popGra, popTop]);
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
    const popGra = { path: "grade", select: "-_id -__v" };
    const popTop = { path: "topic", select: "-_id -__v" };
    const newUnit = await unit.populate([popGra, popTop]);
    resp.json({ ok: true, unit: newUnit });
  });
};

module.exports = { getUnitsByGrade, createUnit, updateUnit, deleteUnit };
