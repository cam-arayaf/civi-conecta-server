const jwt = require("jsonwebtoken");
const { errorResponse } = require("../helpers");

const verifyToken = (req, resp, next, byCookiesOrHeaders, seed) => {
  const { cookies, headers, query } = req;
  const tokenLogin = cookies.token || headers.token;
  const token = byCookiesOrHeaders ? tokenLogin : query.token;

  jwt.verify(token, seed, (error, decoded) => {
    if (error) return errorResponse(resp, 401, error);
    req.user = decoded.user;
    next();
  });
};

const verifyLoginToken = (req, resp, next) =>
  verifyToken(req, resp, next, true, process.env.SEED_USER_LOGIN);

const verifyLoginTokenByQuery = (req, resp, next) =>
  verifyToken(req, resp, next, false, process.env.SEED_USER_LOGIN);

const verifyRecoveryPasswordToken = (req, resp, next) =>
  verifyToken(req, resp, next, false, process.env.SEED_RECOVERY_PASSWORD);

const verifySurveyStudentsToken = (req, resp, next) =>
  verifyToken(req, resp, next, false, process.env.SEED_SURVEY_STUDENTS);

const verifyAutoLoginToken = (req, resp, next) =>
  verifyToken(req, resp, next, false, process.env.SEED_USER_LOGIN);

const verifyActiveState = (req, resp, next) => {
  const condition = !req.user.active;
  const message = `This user isn't active`;
  if (condition) return errorResponse(resp, 400, message);
  next();
};

const verifyAdminRole = (req, resp, next) => {
  const condition = req.user.role !== "Administrator";
  const message = `This user isn't Administrator`;
  if (condition) return errorResponse(resp, 400, message);
  next();
};

const verifyUserRole = (req, resp, next) => {
  const condition = req.user.role !== "User";
  const message = `This user isn't a user role`;
  if (condition) return errorResponse(resp, 400, message);
  next();
};

module.exports = {
  verifyLoginToken,
  verifyLoginTokenByQuery,
  verifyRecoveryPasswordToken,
  verifySurveyStudentsToken,
  verifyAutoLoginToken,
  verifyActiveState,
  verifyAdminRole,
  verifyUserRole,
};
