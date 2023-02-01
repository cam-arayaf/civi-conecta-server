const express = require("express");

const {
  verifyLoginToken,
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
router.get("/getGrades", verifyLoginToken, verifyActiveState, getGrades);

router.post(
  "/createGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  createGrade
);

router.put(
  "/updateGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  updateGrade
);

router.delete(
  "/deleteGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteGrade
);

module.exports = router;
