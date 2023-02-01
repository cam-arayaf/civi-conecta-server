const Establishments = require("../models/establishments");
const Grades = require("../models/grades");
const Users = require("../models/users");
const { errorResponse, nullCatch } = require("../helpers");

const getTeachers = (
  establishment,
  grade,
  character,
  teachers,
  newTeachers = []
) =>
  !teachers.forEach((t) =>
    t.workplaces.forEach(
      (w) =>
        `${w.establishment}` === `${establishment}` &&
        w.courses.forEach(
          (c) =>
            `${c.grade}` === `${grade}` &&
            c.letters.forEach(
              (l) =>
                `${l.character}` === `${character}` &&
                newTeachers.push({
                  name: t.name,
                  email: t.email,
                  active: t.active,
                })
            )
        )
    )
  ) && newTeachers;

const getCourses = async (establishment, courses) => {
  const queryUsers = { role: "User" };
  const teachers = await Users.find(queryUsers).exec().catch(nullCatch);
  const queryGrades = { _id: { $in: courses.map(({ grade }) => grade) } };
  const grades = await Grades.find(queryGrades).exec().catch(nullCatch);

  return grades
    .map((g) => g._doc)
    .map((g) => ({
      letters: courses
        .find((c) => `${c.grade}` === `${g._id}`)
        .letters.map((l) => ({
          character: l.character,
          teachers: getTeachers(establishment, g._id, l._id, teachers),
          students: l.students.map((s) => ({
            name: s.name,
            run: s.run,
            surveys: s.surveys.map((s) => ({
              ...s.survey._doc,
              alternatives: s.survey.alternatives
                .map(({ letter, description, value }) => ({
                  letter,
                  description,
                  value,
                }))
                .sort((a, b) =>
                  a.letter > b.letter ? 1 : a.letter < b.letter ? -1 : 0
                ),
              alternative: s.alternative,
            })),
          })),
        })),
      level: g.level,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
};

const getEstablishmentWithCourses = (establishment, courses) => {
  delete establishment._doc._id;
  delete establishment._doc.__v;
  return { ...establishment._doc, courses };
};

const getEstablishmentsWithCourses = async (establishments) => {
  const newEstablishments = await Promise.all(
    establishments.map(async (establishment) => {
      const { _doc } = establishment;
      const courses = await getCourses(_doc._id, _doc.courses);
      return getEstablishmentWithCourses(establishment, courses);
    })
  );

  return newEstablishments;
};

const getEstablishments = async (req, resp) => {
  Establishments.find({})
    .populate({
      path: "courses.letters.students.surveys.survey",
      select: "-_id -__v",
      populate: { path: "topic", select: "-_id -__v" },
    })
    .sort({ active: -1, number: 1 })
    .exec(async (error, establishments) => {
      if (error) return errorResponse(resp, 500, error);
      const newEst = await getEstablishmentsWithCourses(establishments);
      resp.json({ ok: true, total: newEst.length, establishments: newEst });
    });
};

const createEstablishment = async (req, resp) => {
  const { number, name } = req.body;

  new Establishments({ number, name }).save(async (error, establishment) => {
    if (error) return errorResponse(resp, 500, error);
    resp.json({ ok: true, establishment });
  });
};

const updateNameEstablishment = async (req, resp) => {
  const { query, body } = req;

  Establishments.findOneAndUpdate(
    { number: query.number },
    { name: body.name },
    { new: true, runValidators: true, context: "query" },
    async (error, est) => {
      if (error) return errorResponse(resp, 500, error);
      if (!est) return errorResponse(resp, 400, "Establishment not found");
      const pathSur = "courses.letters.students.surveys.survey";
      const seleSur = "-_id -__v";
      const popuTop = { path: "topic", select: "-_id -__v" };
      const popuSur = { path: pathSur, select: seleSur, populate: popuTop };
      const popuEst = await est.populate(popuSur);
      const { _doc } = popuEst;
      const courses = await getCourses(_doc._id, _doc.courses);
      const newEst = getEstablishmentWithCourses(popuEst, courses);
      resp.json({ ok: true, establishment: newEst });
    }
  );
};

const updateActiveEstablishment = (req, resp) => {
  const { body, query } = req;

  Establishments.findOneAndUpdate(
    { number: query.number },
    { active: body.active || false },
    { new: true },
    async (error, est) => {
      if (error) return errorResponse(resp, 500, error);
      if (!est) return errorResponse(resp, 400, "Establishment not found");
      const pathSur = "courses.letters.students.surveys.survey";
      const seleSur = "-_id -__v";
      const popuTop = { path: "topic", select: "-_id -__v" };
      const popuSur = { path: pathSur, select: seleSur, populate: popuTop };
      const popuEst = await est.populate(popuSur);
      const { _doc } = popuEst;
      const courses = await getCourses(_doc._id, _doc.courses);
      const newEst = getEstablishmentWithCourses(popuEst, courses);
      resp.json({ ok: true, establishment: newEst });
    }
  );
};

const updateCoursesEstablishment = async (req, resp) => {
  const { body, query } = req;

  Establishments.findOneAndUpdate(
    { number: query.number },
    { courses: body.courses },
    { new: true, runValidators: true, context: "query" },
    async (error, est) => {
      if (error) return errorResponse(resp, 500, error);
      if (!est) return errorResponse(resp, 400, "Establishment not found");
      const pathSur = "courses.letters.students.surveys.survey";
      const seleSur = "-_id -__v";
      const popuTop = { path: "topic", select: "-_id -__v" };
      const popuSur = { path: pathSur, select: seleSur, populate: popuTop };
      const popuEst = await est.populate(popuSur);
      const { _doc } = popuEst;
      const courses = await getCourses(_doc._id, _doc.courses);
      const newEst = getEstablishmentWithCourses(popuEst, courses);
      resp.json({ ok: true, establishment: newEst });
    }
  );
};

module.exports = {
  getEstablishments,
  createEstablishment,
  updateNameEstablishment,
  updateActiveEstablishment,
  updateCoursesEstablishment,
};
