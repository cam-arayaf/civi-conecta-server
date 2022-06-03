const express = require("express");

const {
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
} = require("../controllers/grades");

const router = express.Router();
router.get("/getGrades", verifyToken, verifyActiveState, getGrades);

router.post(
  "/createGrade",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  createGrade
);

router.put(
  "/updateGrade",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updateGrade
);

router.delete(
  "/deleteGrade",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  deleteGrade
);

module.exports = router;
