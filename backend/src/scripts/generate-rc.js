require("dotenv").config();
const mongoose = require("mongoose");
const { Essay, RC } = require("../db"); 
// const { generateRCContent } = require("../utils/openai");
// const {generateRCContent} = require("../utils/claude-api")
const {generateRCContent} = require("../utils/gemini-api")
// Get command line arguments (optional essay ID)
const args = process.argv.slice(2);
const specificEssayId = args[0]; // If first argument is provided, use it as essay ID

async function processSingleEssay() {
  try {
    console.log("Connecting to database...");

    // Find a single essay to process
    let essay;

    if (specificEssayId) {
      // If an ID was provided, use that specific essay
      essay = await Essay.findById(specificEssayId);
      if (!essay) {
        console.error(`No essay found with ID: ${specificEssayId}`);
        return;
      }

      // Check if this essay already has RC content
      const existingRC = await RC.findOne({ essayId: essay._id });
      if (existingRC) {
        console.log(`Essay "${essay.title}" already has RC content. Skipping.`);
        return;
      }
    } else {
      // Otherwise, find the first unprocessed essay
      const processedEssayIds = (await RC.find()).map((rc) =>
        rc.essayId.toString()
      );
      const unprocessedEssay = await Essay.findOne({
        _id: { $nin: processedEssayIds },
      });

      if (!unprocessedEssay) {
        console.log(
          "No essays to process. All essays already have RC content."
        );
        return;
      }

      essay = unprocessedEssay;
    }

    console.log(`Processing essay: "${essay.title}" (ID: ${essay._id})`);

    try {
      console.log("Generating RC content...");
      const rcContent = await generateRCContent(
        essay.content,
        essay.title,
        essay.category
      );

      // Add metadata
      rcContent.metadata = {
        ...rcContent.metadata,
        aiModel: "gemini-pro",
        promptUsed: "CAT-style RC generation",
      };

      // Create RC document
      const newRC = await RC.create({
        essayId: essay._id,
        summary: rcContent.summary,
        questions: rcContent.questions,
        metadata: rcContent.metadata,
      });

      console.log(`Successfully generated RC content for: "${essay.title}"`);
      console.log(`Generated summary of ${rcContent.metadata.wordCount} words`);
      console.log(`Created ${rcContent.questions.length} questions`);
      console.log(`RC ID: ${newRC._id}`);
    } catch (error) {
      console.error(
        `Error generating RC for essay ${essay._id}:`,
        error.message
      );
    }
  } catch (error) {
    console.error("Error in processing:", error);
  } finally {
    // Close the database connection when done
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the processor
processSingleEssay();
