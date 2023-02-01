const express = require("express");

const {
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const { setPlanningData } = require("../middlewares/planning");

const {
  getExceptionsByGrade,
  createException,
  updateException,
  deleteException,
} = require("../controllers/exceptions");

const router = express.Router();

router.get(
  "/getExceptionsByGrade",
  verifyLoginToken,
  verifyActiveState,
  getExceptionsByGrade
);

router.post(
  "/createException",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setPlanningData,
  createException
);

router.put(
  "/updateException",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setPlanningData,
  updateException
);

router.delete(
  "/deleteException",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteException
);

module.exports = router;
