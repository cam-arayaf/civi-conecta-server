const express = require("express");

const {
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getClassesByUnitAndGrade,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classes");

const router = express.Router();

router.get(
  "/getClassesByUnitAndGrade",
  verifyToken,
  verifyActiveState,
  getClassesByUnitAndGrade
);

router.post(
  "/createClass",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  createClass
);

router.put(
  "/updateClass",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updateClass
);

router.delete(
  "/deleteClass",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  deleteClass
);

module.exports = router;
