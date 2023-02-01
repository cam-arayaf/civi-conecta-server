const express = require("express");
const { get404 } = require("../controllers/404");
const router = express.Router();
router.get("*", get404);
module.exports = router;
