const express = require("express");
const { signUp, signIn, signOut } = require("../controllers/sign");
const { verifyToken } = require("../middlewares/authentication");
const router = express.Router();
router.post("/signUp", signUp);
router.post("/signIn", signIn);
router.post("/signOut", verifyToken, signOut);
module.exports = router;
