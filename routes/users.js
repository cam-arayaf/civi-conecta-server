const express = require("express");

const {
  verifyLoginToken,
  verifyRecoveryPasswordToken,
  verifySurveyStudentsToken,
  verifyAutoLoginToken,
  verifyActiveState,
  verifyAdminRole,
  verifyUserRole,
} = require("../middlewares/authentication");

const {
  setUserRoleData,
  setUserAdminData,
  setEmailNameLinkUserForRecoveryPassword,
  setSubjectAndTransporterForRecoveryPassword,
  sendEmailAdministratorForRecoveryPassword,
  sendEmailUserForRecoveryPassword,
  setEmailNameLinkUserForSurveyStudents,
  setSubjectAndTransporterForSurveyStudents,
  sendEmailAdministratorForSurveyStudents,
  sendEmailUserForSurveyStudents,
  checkIfTeacherIsInsideEstablishment,
  checkIfStudentIsInsideEstablishment,
  setSurveysTeacher,
  setSurveysStudent,
} = require("../middlewares/users");

const {
  signUp,
  signIn,
  signOut,
  getUsers,
  updateNameUser,
  updateActiveUser,
  updatePasswordUser,
  updateWorkplacesUser,
  getRecoveryPasswordUrl,
  checkRecoveryPasswordUrl,
  getSurveyStudentsUrl,
  checkSurveyStudentsUrl,
  saveSurveyTeacherAnswers,
  saveSurveyStudentAnswers,
  getAutoLoginUrl,
  checkAutoLoginUrl,
  generateRandomPassword,
  getActiveTeachersByEstablishment,
} = require("../controllers/users");

const router = express.Router();

router.post("/signUpAdminRole", setUserAdminData, signUp);

router.post(
  "/signUpUserRole",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setUserRoleData,
  signUp
);

router.post("/signIn", signIn);
router.post("/signOut", verifyLoginToken, signOut);

router.get(
  "/getUsers",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  getUsers
);

router.put(
  "/updateNameUser",
  verifyLoginToken,
  verifyActiveState,
  updateNameUser
);

router.put(
  "/updateActiveUser",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  updateActiveUser
);

router.put(
  "/updatePasswordUserLogin",
  verifyLoginToken,
  verifyActiveState,
  updatePasswordUser
);

router.put(
  "/updatePasswordUserRecovery",
  verifyRecoveryPasswordToken,
  verifyActiveState,
  updatePasswordUser
);

router.put(
  "/updateWorkplacesUser",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setUserRoleData,
  updateWorkplacesUser
);

router.get(
  "/getRecoveryPasswordUrl",
  setEmailNameLinkUserForRecoveryPassword,
  setSubjectAndTransporterForRecoveryPassword,
  sendEmailAdministratorForRecoveryPassword,
  sendEmailUserForRecoveryPassword,
  getRecoveryPasswordUrl
);

router.get(
  "/checkRecoveryPasswordUrl",
  verifyRecoveryPasswordToken,
  verifyActiveState,
  checkRecoveryPasswordUrl
);

router.get(
  "/getSurveyStudentsUrl",
  verifyLoginToken,
  verifyActiveState,
  verifyUserRole,
  setEmailNameLinkUserForSurveyStudents,
  setSubjectAndTransporterForSurveyStudents,
  sendEmailAdministratorForSurveyStudents,
  sendEmailUserForSurveyStudents,
  getSurveyStudentsUrl
);

router.post(
  "/checkSurveyStudentsUrl",
  verifySurveyStudentsToken,
  verifyActiveState,
  checkIfStudentIsInsideEstablishment,
  checkSurveyStudentsUrl
);

router.put(
  "/saveSurveyStudentAnswers",
  verifySurveyStudentsToken,
  verifyActiveState,
  checkIfStudentIsInsideEstablishment,
  setSurveysStudent,
  saveSurveyStudentAnswers
);

router.put(
  "/saveSurveyTeacherAnswers",
  verifyLoginToken,
  verifyActiveState,
  verifyUserRole,
  checkIfTeacherIsInsideEstablishment,
  setSurveysTeacher,
  saveSurveyTeacherAnswers
);

router.get(
  "/getAutoLoginUrl",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  getAutoLoginUrl
);

router.get(
  "/checkAutoLoginUrl",
  verifyAutoLoginToken,
  verifyActiveState,
  checkAutoLoginUrl
);

router.get("/generateRandomPassword", generateRandomPassword);

router.get(
  "/getActiveTeachersByEstablishment",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  getActiveTeachersByEstablishment
);

module.exports = router;
