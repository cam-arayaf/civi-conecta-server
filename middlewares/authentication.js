const jwt = require("jsonwebtoken");
const { errorResponse } = require("../helpers");

const verifyToken = (req, resp, next) => {
  const { cookies, headers } = req;
  const token = cookies.token || headers.token;

  jwt.verify(token, process.env.SEED, (error, decoded) => {
    if (error) return errorResponse(resp, 401, error);
    req.user = decoded.user;
    next();
  });
};

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

module.exports = { verifyToken, verifyActiveState, verifyAdminRole };
