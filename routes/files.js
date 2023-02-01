const express = require("express");

const {
  verifyLoginToken,
  verifyLoginTokenByQuery,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  checkIfClassExists,
  checkIfExceptionExists,
  checkIfEventExists,
} = require("../middlewares/files");

const {
  getFile,
  uploadFile,
  updateFile,
  deleteFile,
  getUploadsInZipFile,
  uploadAndUncompressUploadsZip,
  deleteUploadsZip,
} = require("../controllers/files");

const router = express.Router();

router.get(
  "/getFileByClassUnitAndGrade",
  verifyLoginTokenByQuery,
  verifyActiveState,
  checkIfClassExists,
  getFile
);

router.get(
  "/getFileByExceptionAndGrade",
  verifyLoginTokenByQuery,
  verifyActiveState,
  checkIfExceptionExists,
  getFile
);

router.get(
  "/getFileByEventAndGrade",
  verifyLoginTokenByQuery,
  verifyActiveState,
  checkIfEventExists,
  getFile
);

router.post(
  "/uploadFileByClassUnitAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfClassExists,
  uploadFile
);

router.post(
  "/uploadFileByExceptionAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfExceptionExists,
  uploadFile
);

router.post(
  "/uploadFileByEventAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfEventExists,
  uploadFile
);

router.put(
  "/updateFileByClassUnitAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfClassExists,
  updateFile
);

router.put(
  "/updateFileByExceptionAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfExceptionExists,
  updateFile
);

router.put(
  "/updateFileByEventAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfEventExists,
  updateFile
);

router.delete(
  "/deleteFileByClassUnitAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfClassExists,
  deleteFile
);

router.delete(
  "/deleteFileByExceptionAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfExceptionExists,
  deleteFile
);

router.delete(
  "/deleteFileByEventAndGrade",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  checkIfEventExists,
  deleteFile
);

router.get(
  "/getUploadsInZipFile",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  getUploadsInZipFile
);

router.post(
  "/uploadAndUncompressUploadsZip",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  uploadAndUncompressUploadsZip
);

router.delete(
  "/deleteUploadsZip",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteUploadsZip
);

module.exports = router;
