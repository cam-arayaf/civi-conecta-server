const express = require("express");

const {
  verifyToken,
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
router.get("/getUnitsByGrade", verifyToken, verifyActiveState, getUnitsByGrade);

router.post(
  "/createUnit",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  createUnit
);

router.put(
  "/updateUnit",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updateUnit
);

router.delete(
  "/deleteUnit",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  deleteUnit
);

module.exports = router;
