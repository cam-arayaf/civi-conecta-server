const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Establishments = require("../models/establishments");
const Users = require("../models/users");

const {
  errorResponse,
  nullCatch,
  getBaseUrl,
  getExpirationTokenText,
  getRandomPassword,
} = require("../helpers");

const getSurveysFromGradeAndCharacter = (
  workplaces,
  establishment,
  grade,
  character,
  surveys = []
) =>
  !workplaces.forEach(
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
  ) &&
  surveys.map((s) => ({
    ...s.survey._doc,
    alternatives: s.survey.alternatives
      .map(({ letter, description, value }) => ({
        letter,
        description,
        value,
      }))
      .sort((a, b) => (a.letter > b.letter ? 1 : a.letter < b.letter ? -1 : 0)),
    alternative: s.alternative,
  }));

const getWorkplaces = async (
  workplaces,
  minimalEstablishments = [],
  minimalWorkplaces = []
) => {
  const establishments = await Establishments.find({
    _id: { $in: workplaces.map(({ establishment }) => establishment) },
  })
    .populate([
      { path: "courses.grade" },
      {
        path: "courses.letters.students.surveys.survey",
        select: "-_id -__v",
        populate: { path: "topic", select: "-_id -__v" },
      },
    ])
    .exec()
    .catch(nullCatch);

  establishments.forEach((e) =>
    e.courses.forEach((c) =>
      c.letters.forEach((l) =>
        minimalEstablishments.push({
          establishment: e._id,
          grade: c.grade._id,
          letter: l._id,
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
          letter: l.character,
        })
      )
    )
  );

  const specificWorkplaces = minimalEstablishments.filter((me) =>
    minimalWorkplaces.some(
      (mw) =>
        `${mw.establishment}` === `${me.establishment}` &&
        `${mw.grade}` === `${me.grade}` &&
        `${mw.letter}` === `${me.letter}`
    )
  );

  const fullWorkplaces = specificWorkplaces.length
    ? establishments.filter((e) =>
        specificWorkplaces.some((sw) => sw.establishment === e._id)
      )
    : [];

  fullWorkplaces.forEach((e, ei) =>
    e.courses.forEach((c, ci) =>
      specificWorkplaces.some(
        (sw) => sw.establishment === e._id && sw.grade === c.grade._id
      )
        ? c.letters.forEach(
            (l, li) =>
              !specificWorkplaces.some(
                (sw) =>
                  sw.establishment === e._id &&
                  sw.grade === c.grade._id &&
                  sw.letter === l._id
              ) && fullWorkplaces[ei].courses[ci].letters.splice(li, 1)
          )
        : fullWorkplaces[ei].courses.splice(ci, 1)
    )
  );

  const finalWorkplacesWithoutId = fullWorkplaces.map((e) => ({
    active: e.active,
    number: e.number,
    name: e.name,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    courses: e.courses.map((c) => ({
      grade: {
        level: c.grade.level,
        createdAt: c.grade.createdAt,
        updatedAt: c.grade.updatedAt,
      },
      letters: c.letters.map((l) => ({
        character: l.character,
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
        surveys: getSurveysFromGradeAndCharacter(
          workplaces,
          e._id,
          c.grade._id,
          l._id
        ),
      })),
    })),
  }));

  return finalWorkplacesWithoutId;
};

const getMinimalWorkplaces = async (workplaces) => {
  const oldWorkplaces = await getWorkplaces(workplaces);

  return oldWorkplaces.map((w) => ({
    number: w.number,
    name: w.name,
    active: w.active,
    courses: w.courses.map((c) => ({
      grade: c.grade.level,
      letters: c.letters.map((l) => l.character),
    })),
  }));
};

const getUserWithWorkplaces = (user, workplaces) => {
  delete user._doc._id;
  delete user._doc.password;
  delete user._doc.__v;
  return { ...user._doc, workplaces };
};

const getUsersWithWorkplaces = async (users) => {
  const newUsers = await Promise.all(
    users.map(async (user) => {
      const pathSur = "workplaces.courses.letters.surveys.survey";
      const selectSur = "-_id -__v";
      const popTop = { path: "topic" };
      const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
      const popUser = await user.populate(popSurvey);
      const workplaces = await getWorkplaces(popUser._doc.workplaces);
      return getUserWithWorkplaces(popUser, workplaces);
    })
  );

  return newUsers;
};

const getMinimalUserData = ({ email, name, role, active }) => ({
  email,
  name,
  role,
  active,
});

const getMinimalUserDataWithMinimalWorkplaces = async (users) =>
  await Promise.all(
    users.map(async ({ _doc: { name, email, password, workplaces } }) => ({
      name,
      email,
      password,
      establishments: await getMinimalWorkplaces(workplaces),
    }))
  );

const isValidPassword = (user, password) =>
  user.encryptedPassword
    ? bcrypt.compareSync(password, user.password)
    : password === user.password;

const signUp = (req, resp) => {
  const { email, name, password, encryptedPassword, role, workplaces } =
    req.body;

  new Users({
    email,
    name,
    password,
    encryptedPassword,
    role,
    workplaces,
  }).save(async (error, user) => {
    if (error) return errorResponse(resp, 500, error);
    const pathSur = "workplaces.courses.letters.surveys.survey";
    const selectSur = "-_id -__v";
    const popTop = { path: "topic" };
    const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
    const popUser = await user.populate(popSurvey);
    const workplaces = await getWorkplaces(popUser._doc.workplaces);
    resp.json({ ok: true, user: getUserWithWorkplaces(popUser, workplaces) });
  });
};

const signIn = (req, resp) => {
  const { email, password } = req.body;

  Users.findOne({ email, active: true }, async (error, user) => {
    if (error) return errorResponse(resp, error);
    const validUser = !!user && isValidPassword(user, password);
    if (!validUser) return errorResponse(resp, 400, "Incorrect credentials");
    const pathSur = "workplaces.courses.letters.surveys.survey";
    const selectSur = "-_id -__v";
    const popTop = { path: "topic" };
    const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
    const popUser = await user.populate(popSurvey);
    const workplaces = await getWorkplaces(popUser._doc.workplaces);
    const newUser = getUserWithWorkplaces(popUser, workplaces);
    const expiration = { expiresIn: process.env.TOKEN_EXPIRATION_USER_LOGIN };
    const userToken = { user: getMinimalUserData(newUser) };
    const token = jwt.sign(userToken, process.env.SEED_USER_LOGIN, expiration);
    newUser.token = token;
    resp.cookie("token", token);
    resp.json({ ok: true, user: newUser });
  });
};

const signOut = (req, resp) => {
  resp.clearCookie("token");
  resp.json({ ok: true, message: "Sign out successful" });
};

const getUsers = async (req, resp) => {
  Users.find({})
    .sort({ active: -1, role: 1, email: 1 })
    .exec(async (error, users) => {
      if (error) return errorResponse(resp, 500, error);
      const newUsers = await getUsersWithWorkplaces(users);
      resp.json({ ok: true, total: users.length, users: newUsers });
    });
};

const updateNameUser = (req, resp) => {
  Users.findOneAndUpdate(
    { email: req.user.email, active: true },
    { name: req.body.name },
    { new: true, runValidators: true, context: "query" },
    async (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      const pathSur = "workplaces.courses.letters.surveys.survey";
      const selectSur = "-_id -__v";
      const popTop = { path: "topic" };
      const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
      const popUser = await user.populate(popSurvey);
      const workplaces = await getWorkplaces(popUser._doc.workplaces);
      resp.json({ ok: true, user: getUserWithWorkplaces(popUser, workplaces) });
    }
  );
};

const updateActiveUser = (req, resp) => {
  const { body, query } = req;

  Users.findOneAndUpdate(
    { email: query.email },
    { active: body.active || false },
    { new: true },
    async (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      const pathSur = "workplaces.courses.letters.surveys.survey";
      const selectSur = "-_id -__v";
      const popTop = { path: "topic" };
      const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
      const popUser = await user.populate(popSurvey);
      const workplaces = await getWorkplaces(popUser._doc.workplaces);
      resp.json({ ok: true, user: getUserWithWorkplaces(popUser, workplaces) });
    }
  );
};

const updatePasswordUser = (req, resp) => {
  const { password, encryptedPassword } = req.body;

  Users.findOneAndUpdate(
    { email: req.user.email, active: true },
    { password, encryptedPassword },
    { new: true, runValidators: true, context: "query" },
    async (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      const pathSur = "workplaces.courses.letters.surveys.survey";
      const selectSur = "-_id -__v";
      const popTop = { path: "topic" };
      const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
      const popUser = await user.populate(popSurvey);
      const workplaces = await getWorkplaces(popUser._doc.workplaces);
      resp.json({ ok: true, user: getUserWithWorkplaces(popUser, workplaces) });
    }
  );
};

const updateWorkplacesUser = (req, resp) => {
  Users.findOneAndUpdate(
    { email: req.query.email, active: true, role: "User" },
    { workplaces: req.body.workplaces },
    { new: true, runValidators: true, context: "query" },
    async (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      const pathSur = "workplaces.courses.letters.surveys.survey";
      const selectSur = "-_id -__v";
      const popTop = { path: "topic" };
      const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
      const popUser = await user.populate(popSurvey);
      const workplaces = await getWorkplaces(popUser._doc.workplaces);
      resp.json({ ok: true, user: getUserWithWorkplaces(popUser, workplaces) });
    }
  );
};

const getRecoveryPasswordUrl = (req, resp) =>
  resp.json({ ok: true, email: req.user.email });

const checkRecoveryPasswordUrl = (req, resp) =>
  resp.json({ ok: true, user: { ...req.user, token: req.query.token } });

const getSurveyStudentsUrl = (req, resp) => {
  const { email, name, link, linkExpiration } = req.user;
  resp.json({ ok: true, email, name, link, linkExpiration });
};

const checkSurveyStudentsUrl = (req, resp) => {
  const { establishment, student } = req;
  resp.json({ ok: true, establishment, student, token: req.query.token });
};

const saveSurveyTeacherAnswers = (req, resp) => {
  const { establishment, teacher, surveys } = req;

  const {
    establishmentId,
    establishmentNumber: number,
    establishmentName: name,
    gradeId,
    gradeLevel: grade,
    letterId,
    letterCharacter: letter,
  } = establishment;

  Users.findOneAndUpdate(
    { email: teacher.email, active: true },
    {
      $set: {
        "workplaces.$[w].courses.$[c].letters.$[l].surveys": surveys.map(
          (s) => ({
            survey: s._id,
            alternative: s.selectedAlternative,
          })
        ),
      },
    },
    {
      arrayFilters: [
        { "w.establishment": establishmentId },
        { "c.grade": gradeId },
        { "l.character": letterId },
      ],
      new: true,
      runValidators: true,
    },
    (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      const newEst = { number, name, grade, letter };
      surveys.forEach((s) => delete s._id);
      resp.json({ ok: true, establishment: newEst, teacher, surveys });
    }
  );
};

const saveSurveyStudentAnswers = (req, resp) => {
  const { establishment, student, surveys } = req;
  const { run } = student;

  Establishments.findOneAndUpdate(
    {
      number: establishment.number,
      active: true,
      "courses.letters.students.run": run,
    },
    {
      $set: {
        "courses.$[].letters.$[].students.$[s].surveys": surveys.map((s) => ({
          survey: s._id,
          alternative: s.selectedAlternative,
        })),
      },
    },
    {
      arrayFilters: [{ "s.run": run }],
      new: true,
      runValidators: true,
    },
    (error, est) => {
      if (error) return errorResponse(resp, 500, error);
      if (!est) return errorResponse(resp, 400, "Establisment not found");
      surveys.forEach((s) => delete s._id);
      resp.json({ ok: true, establishment, student, surveys });
    }
  );
};

const getAutoLoginUrl = (req, resp) => {
  Users.findOne(
    { email: req.query.email, active: true },
    async (error, user) => {
      if (error) return errorResponse(resp, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      const pathSur = "workplaces.courses.letters.surveys.survey";
      const selectSur = "-_id -__v";
      const popTop = { path: "topic" };
      const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
      const popUser = await user.populate(popSurvey);
      const workplaces = await getWorkplaces(popUser._doc.workplaces);
      const newUser = getUserWithWorkplaces(popUser, workplaces);
      const tokenExpiration = process.env.TOKEN_EXPIRATION_USER_LOGIN;
      const expiration = { expiresIn: tokenExpiration };
      const userToke = { user: getMinimalUserData(newUser) };
      const token = jwt.sign(userToke, process.env.SEED_USER_LOGIN, expiration);
      const defaultLink = `${getBaseUrl(req)}/checkAutoLoginUrl`;
      const linkWithoutToken = process.env.AUTO_LOGIN_URL || defaultLink;
      const link = `${linkWithoutToken}?token=${token}`;
      const linkExpiration = getExpirationTokenText(tokenExpiration);
      resp.json({ ok: true, link, linkExpiration });
    }
  );
};

const checkAutoLoginUrl = (req, resp) => {
  const { user, query } = req;
  const { token } = query;

  Users.findOne({ email: user.email, active: true }, async (error, user) => {
    if (error) return errorResponse(resp, error);
    if (!user) return errorResponse(resp, 400, "Incorrect credentials");
    const pathSur = "workplaces.courses.letters.surveys.survey";
    const selectSur = "-_id -__v";
    const popTop = { path: "topic" };
    const popSurvey = { path: pathSur, select: selectSur, populate: popTop };
    const popUser = await user.populate(popSurvey);
    const workplaces = await getWorkplaces(popUser._doc.workplaces);
    const newUser = getUserWithWorkplaces(popUser, workplaces);
    newUser.token = token;
    resp.cookie("token", token);
    resp.json({ ok: true, user: newUser });
  });
};

const generateRandomPassword = (req, resp) =>
  resp.json({ ok: true, password: getRandomPassword() });

const getActiveTeachersByEstablishment = async (req, resp) => {
  const queryEst = { number: req.query.establishment };
  const est = await Establishments.findOne(queryEst).exec().catch(nullCatch);
  if (!est) return errorResponse(resp, 400, "Establishment not found");

  Users.find({
    role: "User",
    active: true,
    encryptedPassword: false,
    "workplaces.establishment": est.id,
  })
    .sort({ email: 1 })
    .exec(async (error, users) => {
      if (error) return errorResponse(resp, 500, error);
      const newUsers = await getMinimalUserDataWithMinimalWorkplaces(users);
      resp.json({ ok: true, total: users.length, users: newUsers });
    });
};

module.exports = {
  signUp,
  signIn,
  signOut,
  getUsers,
  updateNameUser,
  updateActiveUser,
  updateWorkplacesUser,
  updatePasswordUser,
  getRecoveryPasswordUrl,
  checkRecoveryPasswordUrl,
  getSurveyStudentsUrl,
  checkSurveyStudentsUrl,
  saveSurveyTeacherAnswers,
  saveSurveyStudentAnswers,
  getAutoLoginUrl,
  checkAutoLoginUrl,
  generateRandomPassword,
  getActiveTeachersByEstablishment,
};
