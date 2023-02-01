const Grades = require("../models/grades");
const Establishments = require("../models/establishments");
const { errorResponse, nullCatch, getFormattedRun } = require("../helpers");

const isValidCourses = (courses) =>
  !!courses && Array.isArray(courses) && !!courses.length;

const getInitialCourses = (
  courses,
  grades = [],
  gradesWithQuantity = [],
  gradesWithLetters = [],
  gradesWithLettersAndQuantity = [],
  runs = [],
  runsWithQuantity = []
) => {
  const filteredCourses = courses.filter(
    (c) =>
      !!c.grade &&
      typeof c.grade === "string" &&
      !!c.grade.trim().length &&
      !!c.letters &&
      Array.isArray(c.letters) &&
      !!c.letters.length &&
      c.letters.some(
        (l) =>
          !!l.character &&
          typeof l.character === "string" &&
          !!l.character.trim().length &&
          !!l.students &&
          Array.isArray(l.students) &&
          l.students.some(
            (s) =>
              !!s.name &&
              typeof s.name === "string" &&
              !!s.name.trim().length &&
              !!s.run &&
              typeof s.run === "string" &&
              !!s.run.trim().length
          )
      )
  );

  filteredCourses.forEach(({ grade }) => grades.push(grade.toUpperCase()));

  grades.forEach((grade) =>
    gradesWithQuantity.some((g) => g.grade === grade)
      ? gradesWithQuantity.forEach(
          (g) =>
            g.grade === grade && Object.assign(g, { quantity: g.quantity + 1 })
        )
      : gradesWithQuantity.push({ grade, quantity: 1 })
  );

  const hasDuplicateGrades = gradesWithQuantity.some((g) => g.quantity > 1);

  filteredCourses.forEach(({ grade, letters }) =>
    letters.forEach(({ character }) =>
      gradesWithLetters.push(`${grade}${character}`.toUpperCase())
    )
  );

  gradesWithLetters.forEach((gradeWithLetter) =>
    gradesWithLettersAndQuantity.some(
      (g) => g.gradeWithLetter === gradeWithLetter
    )
      ? gradesWithLettersAndQuantity.forEach(
          (g) =>
            g.gradeWithLetter === gradeWithLetter &&
            Object.assign(g, { quantity: g.quantity + 1 })
        )
      : gradesWithLettersAndQuantity.push({ gradeWithLetter, quantity: 1 })
  );

  const hasDuplicateGradesWithLetters = gradesWithLettersAndQuantity.some(
    (g) => g.quantity > 1
  );

  filteredCourses.forEach(({ letters }) =>
    letters.forEach(({ students }) =>
      students.forEach(({ run }) => runs.push(getFormattedRun(run)))
    )
  );

  runs.forEach((run) =>
    runsWithQuantity.some((r) => r.run === run)
      ? runsWithQuantity.forEach(
          (r) => r.run === run && Object.assign(r, { quantity: r.quantity + 1 })
        )
      : runsWithQuantity.push({ run, quantity: 1 })
  );

  const hasDuplicateRuns = runsWithQuantity.some((r) => r.quantity > 1);

  return hasDuplicateGrades || hasDuplicateGradesWithLetters || hasDuplicateRuns
    ? []
    : filteredCourses;
};

const getValidGrades = async (courses) =>
  await Grades.find({ level: { $in: courses.map(({ grade }) => grade) } })
    .exec()
    .catch(nullCatch);

const getSurveys = (establishment, level, character, run, surveys = []) =>
  !establishment.courses.forEach(
    (c) =>
      c.grade.level === level &&
      c.letters.forEach(
        (l) =>
          l.character === character &&
          l.students.forEach(
            (s) => s.run === run && Object.assign(surveys, s.surveys)
          )
      )
  ) && surveys;

const getFullCourses = (establishment, grades, courses) =>
  grades
    .map((g) => ({
      grade: g._id,
      letters: courses
        .find((c) => c.grade === g.level)
        .letters.map((l) => ({
          character: l.character.toUpperCase(),
          students: l.students.map((s) => ({
            name: s.name,
            run: getFormattedRun(s.run),
            surveys: getSurveys(
              establishment,
              g.level,
              l.character.toUpperCase(),
              getFormattedRun(s.run)
            ),
          })),
        })),
    }))
    .filter((g) => !!g.letters.length);

const getAllStudents = (establishments, students = []) =>
  !establishments.forEach((establishment) =>
    establishment.courses.forEach((course) =>
      course.letters.forEach((letter) =>
        letter.students.forEach((student) =>
          students.push({
            run: getFormattedRun(student.run),
            name: student.name,
            grade: course.grade.level || course.grade,
            letter: letter.character,
            establishmentNumber: establishment.number,
            establishmentName: establishment.number,
          })
        )
      )
    )
  ) && students;

const getDuplicateStudents = async (students, establishment) => {
  const establishments = await Establishments.find({
    number: { $ne: establishment },
    "courses.letters.students.run": { $in: students.map(({ run }) => run) },
  })
    .populate({ path: "courses.grade" })
    .exec()
    .catch(nullCatch);

  const duplicateStudents = getAllStudents(establishments).filter((cs) =>
    students.some((ns) => ns.run === cs.run)
  );

  return { total: duplicateStudents.length, students: duplicateStudents };
};

const getEstablishment = async (number) =>
  await Establishments.findOne({ number })
    .populate({ path: "courses.grade" })
    .exec()
    .catch(nullCatch);

const setEstablishmentData = async (req, resp, next) => {
  const { body, query } = req;
  const { courses } = body;
  const { number } = query;
  const establishment = await getEstablishment(number);
  const errorEstablishment = "Establishment not found";
  if (!establishment) return errorResponse(resp, 400, errorEstablishment);
  const validCourses = isValidCourses(courses);
  const initialCourses = getInitialCourses(courses);
  const hasCourses = validCourses && !!initialCourses.length;
  const noCoursesMessage = "No courses available";
  if (!hasCourses) return errorResponse(resp, 400, noCoursesMessage);
  const grades = await getValidGrades(initialCourses);
  const hasGrades = !!grades.length;
  if (!hasGrades) return errorResponse(resp, 400, noCoursesMessage);
  const fullCourses = getFullCourses(establishment, grades, initialCourses);
  const hasFullCourses = !!fullCourses.length;
  if (!hasFullCourses) return errorResponse(resp, 400, noCoursesMessage);
  const name = `establishmentNumber${number}`;
  const newStudents = getAllStudents([{ number, name, courses }]);
  const duplicateStudents = await getDuplicateStudents(newStudents, number);
  const error = { message: "There are duplicate students", duplicateStudents };
  if (!!duplicateStudents.total) return errorResponse(resp, 400, error);
  req.body.courses = fullCourses;
  next();
};

module.exports = { setEstablishmentData };
