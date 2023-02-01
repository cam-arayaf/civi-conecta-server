const express = require("express");

const {
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const { setPlanningData } = require("../middlewares/planning");

const {
  getClassesByUnitAndGrade,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classes");

const router = express.Router();

router.get(
  "/getClassesByUnitAndGrade",
  verifyLoginToken,
  verifyActiveState,
  getClassesByUnitAndGrade
);

router.post(
  "/createClass",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setPlanningData,
  createClass
);

router.put(
  "/updateClass",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setPlanningData,
  updateClass
);

router.delete(
  "/deleteClass",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteClass
);

module.exports = router;
