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
  publishedDate: { type: String },
  scrappedDate: { type: String },
  wordCount: { type: Number },
});

//rc-materials
const rcSchema = new mongoose.Schema({
  essayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Essay",
    required: true,
  },
  summary: {
    type: String,
    required: true,
    minlength: 450,
  },
  questions: [
    {
      questionText: {
        type: String,
        required: true,
      },
      questionType: {
        type: String,
        enum: [
          "main-idea",
          "inference",
          "tone-style",
          "fact-detail",
          "strengthen-weaken",
          "detail",
          "vocabulary",
          "other",
        ],
        required: true,
      },
      options: [
        {
          text: String,
          isCorrect: Boolean,
        },
      ],
      explanation: {
        type: String,
        required: true,
      },
    },
  ],
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    wordCount: Number,
    aiModel: String,
    promptUsed: String,
  },
});

const Essay = mongoose.model("Essay", essaySchema);
const RC = mongoose.model("RC", rcSchema);

module.exports = { Essay, RC };
