const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("connected to db");
  })
  .catch((e) => {
    console.error(e);
  });

const essaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
  },
  content: { type: String },
  publishedDate : {type:String},
  scrappedDate : {type:String},
  wordCount : {type:Number}
});


const Essay = mongoose.model("Essay", essaySchema);

module.exports = {Essay}