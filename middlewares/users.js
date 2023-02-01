const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Establishments = require("../models/establishments");
const Users = require("../models/users");
const Topics = require("../models/topics");
const Surveys = require("../models/surveys");

const {
  errorResponse,
  nullCatch,
  getBaseUrl,
  getExpirationTokenText,
  isValidRun,
  getFormattedRun,
} = require("../helpers");

const getInitialWorkplaces = (workplaces) =>
  !!workplaces && Array.isArray(workplaces) && !!workplaces.length
    ? workplaces.filter(
        (w) =>
          !!w.establishment &&
          typeof w.establishment === "number" &&
          !!w.courses &&
          Array.isArray(w.courses) &&
          !!w.courses.length &&
          w.courses.some(
            (c) =>
              !!c.grade &&
              typeof c.grade === "string" &&
              !!c.grade.trim().length &&
              !!c.letters &&
              Array.isArray(c.letters) &&
              !!c.letters.length &&
              c.letters.some(
                (l) => !!l && typeof l === "string" && !!l.trim().length
              )
          )
      )
    : [];

const getValidEstablishments = async (workplaces) =>
  await Establishments.find({
    active: true,
    number: {
      $in: workplaces.map(({ establishment }) => establishment),
    },
  })
    .populate({ path: "courses.grade" })
    .exec()
    .catch(nullCatch);

const getUser = async (email) =>
  await Users.findOne({ email }).exec().catch(nullCatch);

const getSurveys = (user, establishment, grade, character, surveys = []) =>
  !user.workplaces.forEach(
    (w) =>
      `${w.establishment}` === `${establishment}` &&
      w.courses.forEach(
        (c) =>
          `${c.grade}` === `${grade}` &&
          c.letters.forEach(
            (l) =>
              `${l.character}` === `${character}` &&
              Object.assign(surveys, l.surveys)
          )
      )
  ) && surveys;

const getFullWorkplaces = (
  user,
  establishments,
  workplaces,
  minimalEstablishments = [],
  minimalWorkplaces = []
) => {
  establishments.forEach((e) =>
    e.courses.forEach((c) =>
      c.letters.forEach((l) =>
        minimalEstablishments.push({
          establishment: e.number,
          grade: c.grade.level,
          letter: l.character,
        })
      )
    )
  );

  workplaces.forEach((w) =>
    w.courses.forEach((c) =>
      c.letters.forEach((l) =>
        minimalWorkplaces.push({
          establishment: w.establishment,
          grade: c.grade,
          letter: l,
        })
      )
    )
  );

  const specificWorkplaces = minimalEstablishments.filter((me) =>
    minimalWorkplaces.some(
      (mw) =>
        mw.establishment === me.establishment &&
        mw.grade === me.grade &&
        mw.letter === me.letter
    )
  );

  const fullWorkplaces = specificWorkplaces.length
    ? establishments.filter((e) =>
        specificWorkplaces.some((sw) => sw.establishment === e.number)
      )
    : [];

  fullWorkplaces.forEach((e, ei) =>
    e.courses.forEach((c, ci) =>
      specificWorkplaces.some(
        (sw) => sw.establishment === e.number && sw.grade === c.grade.level
      )
        ? c.letters.forEach(
            (l, li) =>
              !specificWorkplaces.some(
                (sw) =>
                  sw.establishment === e.number &&
                  sw.grade === c.grade.level &&
                  sw.letter === l.character
              ) && fullWorkplaces[ei].courses[ci].letters.splice(li, 1)
          )
        : fullWorkplaces[ei].courses.splice(ci, 1)
    )
  );

  return fullWorkplaces.map((w) => ({
    establishment: w._id,
    courses: w.courses.map((c) => ({
      grade: c.grade._id,
      letters: c.letters.map((l) => ({
        character: l._id,
        surveys: user ? getSurveys(user, w._id, c.grade._id, l._id) : [],
      })),
    })),
  }));
};

const setUserRoleData = async (req, resp, next) => {
  const { body, query } = req;
  const { workplaces } = body;
  const { email } = query;
  const noWorkplacesMessage = "No workplaces available";
  const initWorkplaces = getInitialWorkplaces(workplaces);
  const hasInitWorkplaces = !!initWorkplaces.length;
  if (!hasInitWorkplaces) return errorResponse(resp, 400, noWorkplacesMessage);
  const establishments = await getValidEstablishments(initWorkplaces);
  const hasEstablishments = !!establishments.length;
  if (!hasEstablishments) return errorResponse(resp, 400, noWorkplacesMessage);
  const user = email ? await getUser(email) : null;
  if (!!email && !user) return errorResponse(resp, 400, "User not found");
  const fWorkplaces = getFullWorkplaces(user, establishments, initWorkplaces);
  const hasFWorkplaces = !!fWorkplaces.length;
  if (!hasFWorkplaces) return errorResponse(resp, 400, noWorkplacesMessage);
  req.body.workplaces = fWorkplaces;
  req.body.role = "User";
  next();
};

const setUserAdminData = (req, resp, next) => {
  req.body.workplaces = [];
  req.body.role = "Administrator";
  next();
};

const setEmailNameLinkUserForRecoveryPassword = (req, resp, next) => {
  const { email } = req.query;

  Users.findOne({ email, active: true }, async (error, user) => {
    if (error) return errorResponse(resp, error);
    if (!user) return errorResponse(resp, 400, "User not found");
    const { email: emailUser, name, active } = user;
    const newUser = { email: emailUser, name, active };
    const tokenExpiration = process.env.TOKEN_EXPIRATION_RECOVERY_PASSWORD;
    const seed = process.env.SEED_RECOVERY_PASSWORD;
    const expiration = { expiresIn: tokenExpiration };
    const token = jwt.sign({ user: newUser }, seed, expiration);
    const defaultLink = `${getBaseUrl(req)}/checkRecoveryPasswordUrl`;
    const linkWithoutToken = process.env.RECOVERY_PASSWORD_URL || defaultLink;
    const link = `${linkWithoutToken}?token=${token}`;
    req.user = {};
    req.user.email = emailUser;
    req.user.name = name;
    req.user.link = link;
    next();
  });
};

const setSubjectAndTransporterForRecoveryPassword = async (req, resp, next) => {
  const testAccount = await nodemailer.createTestAccount();
  const { user, pass } = testAccount;

  const createTransportObj = {
    host: process.env.HOST_TRANSPORTER.trim() || undefined,
    port: process.env.PORT_TRANSPORTER.trim() || undefined,
    secure: process.env.SECURE_TRANSPORTER.trim() || undefined,
    service: process.env.SERVICE_TRANSPORTER.trim() || user,
    auth: {
      user: process.env.USERNAME_TRANSPORTER.trim() || user,
      pass: process.env.PASSWORD_TRANSPORTER.trim() || pass,
    },
  };

  req.administrator = {};

  req.administrator.subjectEmail =
    process.env.SUBJECT_EMAIL_RECOVERY_PASSWORD.trim();

  req.administrator.nameTransporter =
    process.env.NAME_TRANSPORTER_RECOVERY_PASSWORD.trim();

  req.administrator.userTransporter = createTransportObj.auth.user;
  req.transporter = nodemailer.createTransport(createTransportObj);
  next();
};

const sendEmailAdministratorForRecoveryPassword = (req, resp, next) => {
  const { administrator, transporter, user } = req;
  const { nameTransporter, userTransporter, subjectEmail } = administrator;
  const { email, name } = user;

  const administratorMailHtml = `
    <p>Hola <strong>${nameTransporter}</strong>,</p>
    <p>El usuario <strong>${name}: ${email}</strong> ha requerido recuperar su contraseña.</p>
    <p>Recuerda, “Si no puedes amarte a ti mismo, ¿cómo podrías amar a alguien más?”.</p>
  `;

  const sendMailToAdministratorObj = {
    from: `"${nameTransporter}" <${userTransporter}>`,
    to: userTransporter,
    subject: subjectEmail,
    html: administratorMailHtml,
  };

  transporter.sendMail(sendMailToAdministratorObj, (error, info) => {
    if (error) return errorResponse(resp, 500, error);
    const url = nodemailer.getTestMessageUrl(info);
    if (!!url) console.log("URL Administrator:", url);
    next();
  });
};

const sendEmailUserForRecoveryPassword = (req, resp, next) => {
  const { administrator, transporter, user } = req;
  const { nameTransporter, userTransporter, subjectEmail } = administrator;
  const { email, name, link } = user;
  const tokenExpiration = process.env.TOKEN_EXPIRATION_RECOVERY_PASSWORD;

  const userMailHtml = `
    <p>Hola <strong>${name}</strong>,</p>
    <p>Para recuperar tu contraseña haz click en el siguiente <a href="${link}" target="_blank"><strong>enlace</strong></a>.</p>
    <p>Este enlace caducará en ${getExpirationTokenText(tokenExpiration)}.</p>
    <p>En caso de que no hayas realizado esta solicitud o ya no necesites recuperar tu contraseña, simplemente omite este correo electrónico.</p>
    <p>Que tengas un buen día.</p>
  `;

  const sendMailToUserObj = {
    from: `"${nameTransporter}" <${userTransporter}>`,
    to: email,
    subject: subjectEmail,
    html: userMailHtml,
  };

  transporter.sendMail(sendMailToUserObj, (error, info) => {
    if (error) return errorResponse(resp, 500, error);
    const url = nodemailer.getTestMessageUrl(info);
    if (!!url) console.log("URL User:", url);
    next();
  });
};

const setEmailNameLinkUserForSurveyStudents = (req, resp, next) => {
  Users.findOne(
    { email: req.user.email, active: true },
    async (error, user) => {
      if (error) return errorResponse(resp, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      const { email, name, active } = user;
      const newUser = { email, name, active };
      const tokenExpiration = process.env.TOKEN_EXPIRATION_SURVEY_STUDENTS;
      const seed = process.env.SEED_SURVEY_STUDENTS;
      const expiration = { expiresIn: tokenExpiration };
      const token = jwt.sign({ user: newUser }, seed, expiration);
      const defaultLink = `${getBaseUrl(req)}/checkSurveyStudentsUrl`;
      const linkWithoutToken = process.env.SURVEY_STUDENTS_URL || defaultLink;
      const link = `${linkWithoutToken}?token=${token}`;
      req.user = {};
      req.user.email = email;
      req.user.name = name;
      req.user.link = link;
      req.user.linkExpiration = getExpirationTokenText(tokenExpiration);
      next();
    }
  );
};

const setSubjectAndTransporterForSurveyStudents = async (req, resp, next) => {
  const testAccount = await nodemailer.createTestAccount();
  const { user, pass } = testAccount;

  const createTransportObj = {
    host: process.env.HOST_TRANSPORTER.trim() || undefined,
    port: process.env.PORT_TRANSPORTER.trim() || undefined,
    secure: process.env.SECURE_TRANSPORTER.trim() || undefined,
    service: process.env.SERVICE_TRANSPORTER.trim() || user,
    auth: {
      user: process.env.USERNAME_TRANSPORTER.trim() || user,
      pass: process.env.PASSWORD_TRANSPORTER.trim() || pass,
    },
  };

  req.administrator = {};

  req.administrator.subjectEmail =
    process.env.SUBJECT_EMAIL_SURVEY_STUDENTS.trim();

  req.administrator.nameTransporter =
    process.env.NAME_TRANSPORTER_SURVEY_STUDENTS.trim();

  req.administrator.userTransporter = createTransportObj.auth.user;
  req.transporter = nodemailer.createTransport(createTransportObj);
  next();
};

const sendEmailAdministratorForSurveyStudents = (req, resp, next) => {
  const { administrator, transporter, user } = req;
  const { nameTransporter, userTransporter, subjectEmail } = administrator;
  const { email, name } = user;

  const administratorMailHtml = `
    <p>Hola <strong>${nameTransporter}</strong>,</p>
    <p>El usuario <strong>${name}: ${email}</strong> ha solicitado un enlace de encuesta para sus estudiantes.</p>
    <p>Que nadie opaque tu brillo.</p>
  `;

  const sendMailToAdministratorObj = {
    from: `"${nameTransporter}" <${userTransporter}>`,
    to: userTransporter,
    subject: subjectEmail,
    html: administratorMailHtml,
  };

  transporter.sendMail(sendMailToAdministratorObj, (error, info) => {
    if (error) return errorResponse(resp, 500, error);
    const url = nodemailer.getTestMessageUrl(info);
    if (!!url) console.log("URL Administrator:", url);
    next();
  });
};

const sendEmailUserForSurveyStudents = (req, resp, next) => {
  const { administrator, transporter, user } = req;
  const { nameTransporter, userTransporter, subjectEmail } = administrator;
  const { email, name, link, linkExpiration } = user;

  const userMailHtml = `
    <p>Hola <strong>${name}</strong>,</p>
    <p>Por favor comparte este <a href="${link}" target="_blank"><strong>enlace</strong></a> con tus estudiantes para que puedan acceder a la encuesta de inicio.</p>
    <p>Este enlace expirará en ${linkExpiration}.</p>
    <p>Que tengas un buen día.</p>
  `;

  const sendMailToUserObj = {
    from: `"${nameTransporter}" <${userTransporter}>`,
    to: email,
    subject: subjectEmail,
    html: userMailHtml,
  };

  transporter.sendMail(sendMailToUserObj, (error, info) => {
    if (error) return errorResponse(resp, 500, error);
    const url = nodemailer.getTestMessageUrl(info);
    if (!!url) console.log("URL User:", url);
    next();
  });
};

const checkIfTeacherIsInsideEstablishment = async (req, resp, next) => {
  const { establishment, grade, letter } = req.body;
  const { email, name } = req.user;

  const user = await Users.findOne({
    email,
    active: true,
  })
    .populate({
      path: "workplaces.establishment",
      populate: { path: "courses.grade" },
    })
    .exec()
    .catch(nullCatch);

  if (!user) return errorResponse(resp, 500, "Teacher not found");
  const data = {};

  user.workplaces.forEach(
    (w) =>
      w.establishment.number === establishment &&
      Object.assign(data, {
        establishmentId: w.establishment._id,
        establishmentNumber: w.establishment.number,
        establishmentName: w.establishment.name,
      }) &&
      w.establishment.courses.forEach(
        (c) =>
          c.grade.level === grade &&
          Object.assign(data, {
            gradeId: c.grade._id,
            gradeLevel: c.grade.level,
          }) &&
          c.letters.forEach(
            (l) =>
              l.character === letter &&
              Object.assign(data, {
                letterId: l._id,
                letterCharacter: l.character,
              })
          )
      )
  );

  const errorEstab = "Establishment not found";
  const errorGrade = "Grade not found";
  const errorLetter = "Letter not found";
  if (!data.establishmentId) return errorResponse(resp, 500, errorEstab);
  if (!data.gradeId) return errorResponse(resp, 500, errorGrade);
  if (!data.letterId) return errorResponse(resp, 500, errorLetter);

  const { courses } = user.workplaces.find(
    (w) => w.establishment._id === data.establishmentId
  );

  const { letters } =
    courses.find((c) => `${c.grade}` === `${data.gradeId}`) || {};

  if (!letters) return errorResponse(resp, 500, errorGrade);

  const hasLetter = letters.some(
    (l) => `${l.character}` === `${data.letterId}`
  );

  if (!hasLetter) return errorResponse(resp, 500, errorLetter);

  req.establishment = data;
  req.teacher = { email, name };
  next();
};

const checkIfStudentIsInsideEstablishment = async (req, resp, next) => {
  const { run } = req.body;
  if (!isValidRun(run)) return errorResponse(resp, 500, "Run is invalid");
  const formattedRun = getFormattedRun(run);

  const user = await Users.findOne({ email: req.user.email, active: true })
    .exec()
    .catch(nullCatch);

  if (!user) return errorResponse(resp, 500, "Teacher not found");

  const est = await Establishments.findOne({
    _id: { $in: user.workplaces.map((w) => w.establishment) },
    active: true,
    "courses.letters.students.run": formattedRun,
  })
    .populate({ path: "courses.grade" })
    .exec()
    .catch(nullCatch);

  if (!est) return errorResponse(resp, 500, "Student not found");

  const { number, name, courses } = est;
  const establishment = { number, name };
  const student = {};

  courses.forEach((c) =>
    c.letters.forEach((l) =>
      l.students.forEach(
        (s) =>
          s.run === formattedRun &&
          Object.assign(establishment, {
            grade: c.grade.level,
            letter: l.character,
          }) &&
          Object.assign(student, {
            name: s.name,
            run: s.run,
          })
      )
    )
  );

  req.establishment = establishment;
  req.student = student;
  next();
};

const isValidSurveys = (surveys, newSurveys = []) =>
  !!surveys &&
  Array.isArray(surveys) &&
  surveys.length === 16 &&
  surveys.filter(
    (s) =>
      !!s.number &&
      typeof s.number === "number" &&
      [1, 2, 3, 4].includes(s.number) &&
      !!s.topic &&
      typeof s.topic === "number" &&
      [1, 2, 3, 4].includes(s.topic) &&
      !!s.alternative &&
      typeof s.alternative === "string" &&
      s.alternative.trim().length === 1 &&
      ["a", "b", "c", "d"].includes(s.alternative.toLowerCase()) &&
      !newSurveys.some(
        (ns) => ns.number === s.number && ns.topic === s.topic
      ) &&
      !!newSurveys.push(s)
  ).length === 16;

const formatSurvey = async (survey, type) => {
  const { number, topic, alternative } = survey;
  const top = await Topics.findOne({ number: topic }).exec().catch(nullCatch);
  const que = { number, type, topic: top?._id || "" };
  const pop = { path: "topic", select: "-_id -__v" };
  const sur = await Surveys.findOne(que).populate(pop).exec().catch(nullCatch);
  const selectedAlternative = sur ? alternative.toUpperCase() : "";
  const newSurvey = sur?._doc || null;
  const attr = (letter, description, value) => ({ letter, description, value });
  const callback = (obj) => attr(obj.letter, obj.description, obj.value);
  const fn = (a, b) => (a.letter > b.letter ? 1 : a.letter < b.letter ? -1 : 0);
  const alternatives = newSurvey?.alternatives.map(callback).sort(fn);
  const finalSurvey = newSurvey ? { ...newSurvey, alternatives } : null;
  delete finalSurvey?.__v;
  return { ...finalSurvey, selectedAlternative };
};

const formatSurveys = async (surveys, type) => {
  const callback = async (survey) => await formatSurvey(survey, type);
  const newSurveys = await Promise.all(surveys.map(callback));
  const filteredSurveys = newSurveys.filter((s) => !!s.selectedAlternative);
  return filteredSurveys.length === 16 ? filteredSurveys : [];
};

const setSurveys = async (req, resp, next, type) => {
  const { surveys } = req.body;
  const errorFormat = "Surveys have an incorrect format";
  if (!isValidSurveys(surveys)) return errorResponse(resp, 400, errorFormat);
  const formattedSurveys = await formatSurveys(surveys, type);
  const errorNotFound = "There are surveys or topics not found";
  if (!formattedSurveys.length) return errorResponse(resp, 400, errorNotFound);
  req.surveys = formattedSurveys;
  next();
};

const setSurveysTeacher = async (req, resp, next) =>
  setSurveys(req, resp, next, "Teacher");

const setSurveysStudent = async (req, resp, next) =>
  setSurveys(req, resp, next, "Student");

module.exports = {
  setUserRoleData,
  setUserAdminData,
  setEmailNameLinkUserForRecoveryPassword,
  setSubjectAndTransporterForRecoveryPassword,
  sendEmailAdministratorForRecoveryPassword,
  sendEmailUserForRecoveryPassword,
  setEmailNameLinkUserForSurveyStudents,
  setSubjectAndTransporterForSurveyStudents,
  sendEmailAdministratorForSurveyStudents,
  sendEmailUserForSurveyStudents,
  checkIfTeacherIsInsideEstablishment,
  checkIfStudentIsInsideEstablishment,
  setSurveysTeacher,
  setSurveysStudent,
};
