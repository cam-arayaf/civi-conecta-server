const express = require("express");

const {
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  checkIfClassExists,
  checkIfExceptionExists,
  checkIfEventExists,
} = require("../middlewares/files");

const { getFile, uploadFile, deleteFile } = require("../controllers/files");
const router = express.Router();
router.get("/getFileByClassUnitAndGrade", checkIfClassExists, getFile);
router.get("/getFileByExceptionAndGrade", checkIfExceptionExists, getFile);
router.get("/getFileByEvent", checkIfEventExists, getFile);

router.put(
  "/uploadFileByClassUnitAndGrade",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfClassExists,
  uploadFile
);

router.put(
  "/uploadFileByExceptionAndGrade",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfExceptionExists,
  uploadFile
);

router.put(
  "/uploadFileByEvent",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfEventExists,
  uploadFile
);

router.put(
  "/deleteFileByClassUnitAndGrade",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfClassExists,
  deleteFile
);

router.put(
  "/deleteFileByExceptionAndGrade",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfExceptionExists,
  deleteFile
);

router.put(
  "/deleteFileByEvent",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfEventExists,
  deleteFile
);

module.exports = router;
