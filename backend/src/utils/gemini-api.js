const axios = require("axios");
require("dotenv").config();

// Use direct API access
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL_NAME = "gemini-1.5-pro-002"; // Can also use "gemini-2.0-flash" if available

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function truncateText(text, maxWords = 7000) {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  if (wordCount <= maxWords) {
    console.log(`Essay is ${wordCount} words - no truncation needed`);
    return text;
  }

  console.log(`Essay is ${wordCount} words - truncating to ${maxWords} words`);
  return (
    words.slice(0, maxWords).join(" ") +
    "... [content truncated for API limits]"
  );
}

/**
 * Generate RC content using JSON mode
 */
async function generateRCContent(essayContent, essayTitle, essayCategory = "") {
  try {
    // Truncate the essay content if it's too long
    const truncatedContent = truncateText(essayContent, 7000);

    // Define the schema for JSON output
    const responseSchema = {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "450-550 word summary of the essay",
        },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              questionText: {
                type: "string",
                description: "The text of the question",
              },
              questionType: {
                type: "string",
                enum: [
                  "main-idea",
                  "inference",
                  "fact-detail",
                  "tone-style",
                  "strengthen-weaken",
                ],
                description: "The type of question",
              },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      description: "Text of the option",
                    },
                    isCorrect: {
                      type: "boolean",
                      description: "Whether this option is the correct answer",
                    },
                  },
                  required: ["text", "isCorrect"],
                },
                minItems: 4,
                maxItems: 4,
                description: "The four options for the question",
              },
              explanation: {
                type: "string",
                description:
                  "Explanation of why the correct answer is correct and why others are wrong",
              },
            },
            required: [
              "questionText",
              "questionType",
              "options",
              "explanation",
            ],
          },
          minItems: 5,
          maxItems: 5,
          description: "Five questions about the passage",
        },
        metadata: {
          type: "object",
          properties: {
            wordCount: {
              type: "integer",
              description: "The word count of the summary",
            },
          },
          required: ["wordCount"],
        },
      },
      required: ["summary", "questions", "metadata"],
    };

    const prompt = `
You are an expert CAT (Common Admission Test) content creator specializing in Reading Comprehension passages and questions.

Your task is to convert the following essay into high-quality CAT RC material.

ESSAY TITLE: ${essayTitle}
CATEGORY: ${essayCategory}

INSTRUCTIONS:
1. Create a concise summary of the essay (450-550 words) that:
   - Preserves the key arguments, logical flow, and complexity of the original
   - Uses sophisticated vocabulary appropriate for CAT level
   - Maintains an academic tone with clear paragraph structure

2. Generate exactly 5 challenging questions:
   - One main-idea/primary purpose question
   - One inference question that requires reading between the lines
   - One fact-detail question about specific information
   - One tone-style/author's attitude question
   - One strengthen/weaken the argument question

3. For each question:
   - Create exactly 4 answer options
   - Make only ONE option correct
   - Ensure wrong options are plausible but clearly incorrect
   - Provide a detailed explanation of why the correct answer is right and why    each incorrect option is wrong
    -The questions should be challenging and require critical thinking, not just direct recall.
ESSAY CONTENT:
${truncatedContent}`;

    console.log(
      `Sending request to Gemini API (${MODEL_NAME}) for essay: "${essayTitle}"`
    );

    // Make direct API call using axios
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more precise output
          maxOutputTokens: 4000,
        },
        // Fix system instruction format
        systemInstruction: {
          parts: [
            {
              text:
                "You are an expert CAT (Common Admission Test) content creator. " +
                "IMPORTANT: Respond ONLY with raw JSON data without any markdown formatting (no ```json tags). " +
                "The JSON must follow this schema: " +
                JSON.stringify(responseSchema, null, 2),
            },
          ],
        },
      },
      {
        params: { key: API_KEY },
        headers: { "Content-Type": "application/json" },
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    console.log("Received response, parsing JSON...");

    // Extract JSON from markdown code blocks if present
    let jsonContent;
    try {
      // Check if the response is wrapped in markdown code blocks
      if (text.includes("```json")) {
        console.log("Detected JSON in markdown code blocks, extracting...");
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = JSON.parse(jsonMatch[1].trim());
          console.log(
            "Successfully extracted and parsed JSON from code blocks"
          );
        } else {
          throw new Error("Failed to extract JSON from code blocks");
        }
      }
      // Otherwise try parsing the whole text directly
      else {
        jsonContent = JSON.parse(text);
        console.log("Successfully parsed direct JSON response");
      }

      // Ensure metadata is complete
      jsonContent.metadata.wordCount = countWords(jsonContent.summary);
      console.log(
        `Generated summary with ${jsonContent.metadata.wordCount} words`
      );

      return jsonContent;
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
      console.log("Response format:", text.substring(0, 100) + "...");

      // Try fallback extraction
      console.log("Attempting fallback extraction from response text...");
      const result = extractAndStructureContent(text);
      if (
        result &&
        result.summary &&
        result.questions &&
        result.questions.length === 5
      ) {
        console.log("Fallback extraction successful");
        return result;
      } else {
        throw new Error("Failed to extract structured content from response");
      }
    }
  } catch (error) {
    console.error("Error generating RC content with Gemini:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else {
      console.error(error.message);
    }

    // If JSON parsing fails, try the old extraction method as fallback
    if (error.message.includes("JSON")) {
      try {
        console.log("Attempting fallback extraction from response text...");
        if (error.response && error.response.data) {
          const text = error.response.data.candidates[0].content.parts[0].text;
          const result = extractAndStructureContent(text);
          return result;
        }
      } catch (fallbackError) {
        console.error(
          "Fallback extraction also failed:",
          fallbackError.message
        );
      }
    }

    throw error;
  }
}

// Keep the existing extraction function as fallback
function extractAndStructureContent(text) {
  // Keep your current implementation
  console.log("Using fallback extraction method");

  // Your existing code...
  // [Kept the same - not duplicating here for brevity]
}

module.exports = {
  generateRCContent,
  countWords,
  extractAndStructureContent,
};
