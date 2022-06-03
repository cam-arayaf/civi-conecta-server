const express = require("express");

const {
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
} = require("../middlewares/authentication");

const {
  getUsers,
  updatePasswordUser,
  updateRoleUser,
  inactivateUser,
  reactivateUser,
} = require("../controllers/users");

const router = express.Router();
router.get("/getUsers", verifyToken, verifyActiveState, getUsers);

router.put(
  "/updatePasswordUser",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updatePasswordUser
);

router.put(
  "/updateRoleUser",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  updateRoleUser
);

router.put(
  "/inactivateUser",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  inactivateUser
);

router.put(
  "/reactivateUser",
  verifyToken,
  verifyActiveState,
  verifyAdminRole,
  reactivateUser
);

module.exports = router;
