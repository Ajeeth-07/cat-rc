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
        category: {
          type: "string",
          description: "Standardized category for the essay content",
          enum: [
            "Philosophy",
            "Science",
            "Psychology",
            "Technology",
            "Social Sciences",
            "History",
            "Culture",
            "Ethics",
            "Politics",
            "Education",
          ],
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
      required: ["summary", "category", "questions", "metadata"],
    };

    const prompt = `
You are an expert CAT (Common Admission Test) content creator specializing in creating advanced Reading Comprehension passages and questions.

Your task is to convert the following essay into high-quality CAT RC material that would challenge the strongest test-takers.

ESSAY TITLE: ${essayTitle}
CATEGORY: ${essayCategory}

INSTRUCTIONS FOR READING PASSAGE:
1. Create a sophisticated reading passage (EXACTLY 450-550 words - this is non-negotiable):
   - Do NOT write a summary that references "the author" or "the article" - create a standalone academic passage
   - Incorporate advanced vocabulary expected at CAT level (75th-90th percentile difficulty)
   - Use complex sentence structures with varied transitions
   - Preserve the sophisticated arguments, nuances, and logical flow of the original
   - Maintain a formal academic tone with clear paragraph structure
   - Ensure the passage contains implicit arguments and subtle positions (not just explicit statements)
   - Include at least 3-4 distinct paragraphs with logical progression

2.Develop 5 DISCRIMINATING Questions (95th vs. 85th Percentile):

    -Question 1: Primary Purpose/Main Idea (Subtle Distinctions): Design a question that probes the central purpose or main idea, requiring discernment of subtle nuances in the author's intent and argument. Options should hinge on slightly different interpretations of the overarching theme.

    -Question 2: Complex Inference (Synthesis Required): Create an inference question that demands significant "reading between the lines." It should necessitate synthesizing information from multiple parts of the passage to arrive at a non-explicitly stated but logically derivable conclusion.

    -Question 3: Fact-Detail (Careful Reading & Discernment): Formulate a fact-detail question that tests meticulous reading. The answer should be explicitly present in the passage, but embedded within complex sentences or nuanced phrasing, requiring careful extraction and precise understanding.

    -Question 4: Tone/Style/Author's Attitude (Nuanced Interpretation): Craft a question assessing the tone, style, or author's attitude. This should focus on subtle aspects of the writing – irony, qualified agreement, measured skepticism – requiring nuanced interpretation beyond superficial impressions.

    -Question 5: Strengthen/Weaken Argument (Sophisticated Logical Analysis): Construct a strengthen/weaken question that demands sophisticated logical analysis of the passage's argument. Options should present arguments that subtly bolster or undermine the central thesis, requiring evaluation of the logical connections and underlying assumptions.

3. For Each Question (Answer Options & Explanations):

    -Four Answer Options (One Correct): Provide exactly four answer options, ensuring only ONE is unequivocally correct based on a rigorous reading of the passage.

    -Extremely Plausible Distractors: Design incorrect options to be highly plausible, requiring careful analysis and elimination. Distractors should:

    -Be Partially True: Incorporate elements from the passage but distort their meaning or context.

    -Reflect Common Reading Errors: Exploit typical misinterpretations, oversimplifications, or focus on superficial details.

    -Be Thematically Relevant: Address the same topic as the correct answer but present a subtly incorrect perspective or inference.

    -Utilize "Attractive" Keywords: Incorporate vocabulary from the passage to make them initially appealing but ultimately misleading.

    -Detailed Explanation for Each Option: Provide a comprehensive explanation for EACH answer option (correct and incorrect).

    -Correct Option Justification: Clearly articulate why the correct option is right, referencing specific textual evidence and logical reasoning from the passage.

    -Incorrect Option Negation: Precisely explain why each incorrect option is wrong. Identify the specific misinterpretation, logical fallacy, or lack of textual support that disqualifies it. Highlight how each distractor is designed to be plausible yet ultimately flawed.

    -The content should be challenging enough that a typical test-taker would need to read the passage multiple times and carefully analyze each question.

4.  Categorization:
   - Assign the content to EXACTLY ONE of the following standard categories based on the primary subject matter:
     * Philosophy
     * Science
     * Psychology
     * Technology
     * Social Sciences
     * History
     * Culture
     * Ethics
     * Politics
     * Education
   - Choose the single most appropriate category that best represents the main theme of the passage.

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
                "The passage must be 450-550 words exactly. " +
                "You must classify the content into exactly ONE standard category from the provided list based on the primary subject matter. " +
                "Questions must be genuinely challenging with very plausible distractors. " +
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
