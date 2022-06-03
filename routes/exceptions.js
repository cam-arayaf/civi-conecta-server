const express = require("express");

const {
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getExceptionsByGrade,
  createException,
  updateException,
  deleteException,
} = require("../controllers/exceptions");

const router = express.Router();

router.get(
  "/getExceptionsByGrade",
  verifyToken,
  verifyActiveState,
  getExceptionsByGrade
);

router.post(
  "/createException",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  createException
);

router.put(
  "/updateException",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updateException
);

router.delete(
  "/deleteException",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  deleteException
);

module.exports = router;
