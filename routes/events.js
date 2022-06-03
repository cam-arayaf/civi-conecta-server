const express = require("express");

const {
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/events");

const router = express.Router();
router.get("/getEvents", verifyToken, verifyActiveState, getEvents);

router.post(
  "/createEvent",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  createEvent
);

router.put(
  "/updateEvent",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updateEvent
);

router.delete(
  "/deleteEvent",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  deleteEvent
);

module.exports = router;
