const express = require("express");
const router = express.Router();
const { Essay, RC } = require("../db");
const { generateRCContent } = require("../utils/openai");

// Generate RC for a specific essay
router.post("/generate/:essayId", async (req, res) => {
  try {
    const { essayId } = req.params;

    // Check if RC already exists
    const existingRC = await RC.findOne({ essayId });
    if (existingRC) {
      return res.status(409).json({
        message: "RC content already exists for this essay",
        data: existingRC,
      });
    }

    // Find the essay
    const essay = await Essay.findById(essayId);
    if (!essay) {
      return res.status(404).json({ message: "Essay not found" });
    }

    // Generate RC content
    const rcContent = await generateRCContent(essay.content, essay.title);

    // Add metadata
    rcContent.metadata = {
      ...rcContent.metadata,
      aiModel: "gpt-4", // or whichever model you used
      promptUsed: "CAT-style RC generation",
    };

    // Create RC document
    const newRC = await RC.create({
      essayId,
      summary: rcContent.summary,
      questions: rcContent.questions,
      metadata: rcContent.metadata,
    });

    res.status(201).json({
      message: "RC content generated successfully",
      data: newRC,
    });
  } catch (error) {
    console.error("Error generating RC content:", error);
    res
      .status(500)
      .json({ message: "Failed to generate RC content", error: error.message });
  }
});

// Get all RCs
router.get("/", async (req, res) => {
  try {
    const rcs = await RC.find().populate("essayId");
    res.status(200).json({ data: rcs });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch RC content", error: error.message });
  }
});

// Get specific RC
router.get("/:id", async (req, res) => {
  try {
    const rc = await RC.findById(req.params.id).populate("essayId");
    if (!rc) {
      return res.status(404).json({ message: "RC content not found" });
    }
    res.status(200).json({ data: rc });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch RC content", error: error.message });
  }
});

module.exports = router;
