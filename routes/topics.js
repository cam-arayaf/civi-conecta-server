const express = require("express");

const {
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} = require("../controllers/topics");

const router = express.Router();
router.get("/getTopics", verifyLoginToken, verifyActiveState, getTopics);

router.post(
  "/createTopic",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  createTopic
);

router.put(
  "/updateTopic",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  updateTopic
);

router.delete(
  "/deleteTopic",
  verifyLoginToken,
  verifyActiveState,
  verifyAdminRole,
  deleteTopic
);

module.exports = router;
