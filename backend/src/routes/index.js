const express = require("express");
const router = express.Router();
const EssayRouter = require("./essay")

router.use("/scrapped-essay", EssayRouter);

module.exports =router;