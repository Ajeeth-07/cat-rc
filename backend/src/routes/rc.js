const express = require("express");
const router = express.Router();
const { Essay, RC } = require("../db");

// Update the RC generation route to use and update the processed flag
router.post("/generate/:essayId", async (req, res) => {
  try {
    const { essayId } = req.params;

    // Find the essay and check processed status in one query
    const essay = await Essay.findById(essayId);

    if (!essay) {
      return res.status(404).json({ message: "Essay not found" });
    }

    // Check if already processed
    if (essay.processed) {
      const existingRC = await RC.findOne({ essayId });
      return res.status(409).json({
        message: "RC content already exists for this essay",
        data: existingRC,
      });
    }

    // Update essay status to processing
    essay.processingStatus = "processing";
    await essay.save();

    // Generate RC content
    const rcContent = await generateRCContent(essay.content, essay.title);

    // Add metadata
    rcContent.metadata = {
      ...rcContent.metadata,
      aiModel: "gemini-1.5-pro",
      promptUsed: "CAT-style RC generation",
    };

    // Create RC document
    const newRC = await RC.create({
      essayId,
      summary: rcContent.summary,
      category : rcContent.category,
      questions: rcContent.questions,
      metadata: rcContent.metadata,
    });

    // Update essay status to completed
    essay.processed = true;
    essay.processingStatus = "completed";
    essay.processedAt = new Date();
    await essay.save();

    res.status(201).json({
      message: "RC content generated successfully",
      data: newRC,
    });
  } catch (error) {
    // If there was an error, update the essay status
    try {
      await Essay.findByIdAndUpdate(req.params.essayId, {
        processingStatus: "failed",
        processingError: error.message,
      });
    } catch (updateError) {
      console.error("Error updating essay status:", updateError);
    }

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
