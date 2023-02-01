const express = require("express");

const {
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const { setEstablishmentData } = require("../middlewares/establishments");

const {
  getEstablishments,
  createEstablishment,
  updateNameEstablishment,
  updateActiveEstablishment,
  updateCoursesEstablishment,
} = require("../controllers/establishments");

const router = express.Router();

router.get(
  "/getEstablishments",
  verifyLoginToken,
  verifyActiveState,
  getEstablishments
);

router.post(
  "/createEstablishment",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  createEstablishment
);

router.put(
  "/updateNameEstablishment",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  updateNameEstablishment
);

router.put(
  "/updateActiveEstablishment",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  updateActiveEstablishment
);

router.put(
  "/updateCoursesEstablishment",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setEstablishmentData,
  updateCoursesEstablishment
);

module.exports = router;
