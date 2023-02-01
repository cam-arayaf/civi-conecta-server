const express = require("express");

const {
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const { verifyAlternatives } = require("../middlewares/surveys");

const {
  getSurveysByType,
  createSurvey,
  updateSurvey,
  deleteSurvey,
} = require("../controllers/surveys");

const router = express.Router();

router.get(
  "/getSurveysByType",
  verifyLoginToken,
  verifyActiveState,
  getSurveysByType
);

router.post(
  "/createSurvey",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  verifyAlternatives,
  createSurvey
);

router.put(
  "/updateSurvey",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  verifyAlternatives,
  updateSurvey
);

router.delete(
  "/deleteSurvey",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteSurvey
);

module.exports = router;
