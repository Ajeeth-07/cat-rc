require("dotenv").config();
const mongoose = require("mongoose");
const { Essay, RC } = require("../db");
const { generateRCContent, countWords } = require("../utils/gemini-api");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Constants
const MAX_WORDS_PER_CHUNK = 7000; // Should match value in gemini-api.js
const API_DELAY = 31000; // 31 seconds to be safe (2 req/min rate limit)

// Get command line arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args[0]) || 5; // Default to 5 essays if not provided
const skipCount = parseInt(args[1]) || 0; // Option to skip essays

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Format time in minutes and seconds
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

async function batchProcessEssays() {
  try {
    console.log(
      `Starting batch processing of up to ${batchSize} essays (skipping ${skipCount})...`
    );
    console.log("Finding unprocessed essays...");

    // Find essays without RC content
    const unprocessedEssays = await Essay.find({
      processed: false, // Use the flag instead of complex $nin query
    })
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(batchSize);

    console.log(`Found ${unprocessedEssays.length} essays to process`);

    if (unprocessedEssays.length === 0) {
      console.log("No unprocessed essays found. Exiting.");
      return;
    }

    // Create a report structure for summary
    const report = {
      total: unprocessedEssays.length,
      successful: 0,
      failed: 0,
      totalChunksProcessed: 0,
      totalWords: 0,
      failures: [],
    };

    // Process each essay with delay between requests
    for (let i = 0; i < unprocessedEssays.length; i++) {
      const essay = unprocessedEssays[i];
      const wordCount = countWords(essay.content);
      report.totalWords += wordCount;

      // Estimate chunks needed
      const estimatedChunks = Math.ceil(wordCount / MAX_WORDS_PER_CHUNK);

      console.log(
        `\n[${i + 1}/${unprocessedEssays.length}] Processing essay: "${
          essay.title
        }"`
      );
      console.log(`Essay ID: ${essay._id}`);
      console.log(
        `Word count: ${wordCount} (${
          estimatedChunks > 1
            ? `estimated ${estimatedChunks} chunks needed`
            : "single chunk"
        })`
      );

      // Calculate estimated time for this essay
      const essayTimeSeconds =
        estimatedChunks > 1
          ? estimatedChunks * 31 + 31 // Time for chunks + final combination
          : 31; // Single chunk
      console.log(`Estimated time: ~${formatTime(essayTimeSeconds)}`);

      const startTime = Date.now();
      try {
        // Set status to processing first
        await Essay.findByIdAndUpdate(essay._id, {
          processingStatus: "processing",
        });

        console.log("Generating RC content...");

        const rcContent = await generateRCContent(
          essay.content,
          essay.title,
          essay.category
        );

        // Add metadata
        rcContent.metadata = {
          ...rcContent.metadata,
          aiModel: "gemini-1.5-pro",
          promptUsed: "CAT-style RC generation",
          processingTime: Date.now() - startTime,
          originalWordCount: wordCount,
          chunks: estimatedChunks,
        };

        // Create RC document
        const newRC = await RC.create({
          essayId: essay._id,
          summary: rcContent.summary,
          category : rcContent.category,
          questions: rcContent.questions,
          metadata: rcContent.metadata,
        });

        // Mark essay as processed
        await Essay.findByIdAndUpdate(essay._id, {
          processed: true,
          processingStatus: "completed",
          processedAt: new Date(),
        });

        const processingTime = Math.round((Date.now() - startTime) / 1000);
        console.log(
          `✓ Success: Generated RC for "${essay.title}" in ${formatTime(
            processingTime
          )}`
        );
        console.log(`  Summary: ${rcContent.metadata.wordCount} words`);
        console.log(`  Category: ${rcContent.category} `);
        console.log(`  Questions: ${rcContent.questions.length}`);
        console.log(`  RC ID: ${newRC._id}`);

        report.successful++;
        report.totalChunksProcessed += estimatedChunks;
      } catch (error) {
        // Update essay with error status
        await Essay.findByIdAndUpdate(essay._id, {
          processingStatus: "failed",
          processingError: error.message,
        });

        console.error(
          `✗ Error generating RC for essay ${essay._id}:`,
          error.message
        );
        report.failed++;
        report.failures.push({
          essayId: essay._id,
          title: essay.title,
          error: error.message,
        });
      }

      // If not the last essay, wait before processing the next one
      // But only if the previous one didn't already involve multiple chunks
      // (since in that case, delays were already added between chunks)
      if (i < unprocessedEssays.length - 1 && estimatedChunks <= 1) {
        const delaySeconds = Math.round(API_DELAY / 1000);
        console.log(
          `Waiting ${delaySeconds} seconds before processing next essay (API rate limit)...`
        );
        await sleep(API_DELAY);
      } else if (estimatedChunks > 1) {
        console.log(
          "No additional delay needed (already added delays between chunks)"
        );
      }
    }

    // Calculate total processing time
    const totalSeconds = Math.round(report.totalChunksProcessed * 31);

    // Print summary report
    console.log("\n========== BATCH PROCESSING SUMMARY ==========");
    console.log(
      `Total essays processed: ${
        report.total
      } (${report.totalWords.toLocaleString()} words)`
    );
    console.log(`Total chunks processed: ${report.totalChunksProcessed}`);
    console.log(`Successful: ${report.successful}`);
    console.log(`Failed: ${report.failed}`);
    console.log(`Total estimated API time: ${formatTime(totalSeconds)}`);

    if (report.failures.length > 0) {
      console.log("\nFailed essays:");
      report.failures.forEach((failure, index) => {
        console.log(
          `${index + 1}. "${failure.title}" (${failure.essayId}) - ${
            failure.error
          }`
        );
      });
    }

    return report;
  } catch (error) {
    console.error("Batch processing error:", error);
  } finally {
    // Close the database connection when done
    mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the batch processor
batchProcessEssays()
  .then(() => console.log("Batch processing completed"))
  .catch((err) => console.error("Fatal error:", err));
