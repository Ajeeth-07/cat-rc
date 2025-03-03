const express = require("express");
const router = express.Router();
const EssayRouter = require("./essay")
const rcRouter = require("./rc")


router.use("/scrapped-essay", EssayRouter);
router.use("/rc", rcRouter);

module.exports =router;