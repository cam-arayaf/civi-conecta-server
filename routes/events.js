const express = require("express");

const {
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const { setPlanningData } = require("../middlewares/planning");

const {
  getEventsByGrade,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/events");

const router = express.Router();

router.get(
  "/getEventsByGrade",
  verifyLoginToken,
  verifyActiveState,
  getEventsByGrade
);

router.post(
  "/createEvent",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setPlanningData,
  createEvent
);

router.put(
  "/updateEvent",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  setPlanningData,
  updateEvent
);

router.delete(
  "/deleteEvent",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteEvent
);

module.exports = router;
