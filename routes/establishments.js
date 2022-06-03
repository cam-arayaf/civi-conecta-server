const express = require("express");

const {
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getEstablishments,
  createEstablishment,
  updateEstablishment,
  inactivateEstablishment,
  reactivateEstablishment,
} = require("../controllers/establishments");

const router = express.Router();

router.get(
  "/getEstablishments",
  verifyToken,
  verifyActiveState,
  getEstablishments
);

router.post(
  "/createEstablishment",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  createEstablishment
);

router.put(
  "/updateEstablishment",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updateEstablishment
);

router.put(
  "/inactivateEstablishment",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  inactivateEstablishment
);

router.put(
  "/reactivateEstablishment",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  reactivateEstablishment
);

module.exports = router;
