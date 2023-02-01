const express = require("express");

const {
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getUnitsByGrade,
  createUnit,
  updateUnit,
  deleteUnit,
} = require("../controllers/units");

const router = express.Router();
router.get("/getUnitsByGrade", verifyLoginToken, verifyActiveState, getUnitsByGrade);

router.post(
  "/createUnit",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  createUnit
);

router.put(
  "/updateUnit",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  updateUnit
);

router.delete(
  "/deleteUnit",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteUnit
);

module.exports = router;
