// index.js
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const rootRouter = require("./routes/index");

app.use(express.json());
app.use("/api/v1", rootRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
