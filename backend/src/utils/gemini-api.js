const axios = require("axios");
require("dotenv").config();

// Use direct API access instead of the SDK
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL_NAME = "gemini-1.5-pro"; // Updated model name from the available list

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function truncateText(text, maxWords = 3000) {
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
 * Helper function to extract JSON from text that might include markdown code blocks
 */
function extractJSON(text) {
  // Try to find JSON inside markdown code blocks first
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);

  // If found inside code blocks, use that
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.log("Found code blocks but couldn't parse JSON inside them");
    }
  }

  // Otherwise, try to parse the entire text
  try {
    return JSON.parse(text);
  } catch (e) {
    // As a last resort, try to find anything that looks like JSON
    const possibleJson = text.match(/\{[\s\S]*\}/);
    if (possibleJson) {
      try {
        return JSON.parse(possibleJson[0]);
      } catch (e) {
        throw new Error("Could not extract valid JSON from response");
      }
    }
    throw new Error("Could not extract valid JSON from response");
  }
}

async function generateRCContent(essayContent, essayTitle, essayCategory = "") {
  try {
    // Truncate the essay content if it's too long
    const truncatedContent = truncateText(essayContent, 3000);

    // Include the "system" instructions directly in the user prompt
    const prompt = `
You are an expert CAT exam content creator. You specialize in creating Reading Comprehension passages and questions that test critical reading skills. Always respond with valid JSON.

I need you to convert the following essay into a CAT (Common Admission Test) Reading Comprehension passage with questions.

ESSAY TITLE: ${essayTitle}
CATEGORY: ${essayCategory}

INSTRUCTIONS:
1. Summarize the essay into a 450-550 word passage while maintaining key ideas, logical flow, and complexity.
2. The passage should be challenging but clear, similar to CAT exam standards.
3. Generate exactly 5 CAT-style questions about the passage, with exactly 4 options each.
4. Include the following question types:
   - 1 main idea question
   - 1 inference question  
   - 2 detail question
   - 1 strengthen/weaken the argument question
5. For each question, provide a detailed explanation of why the correct answer is right and why each incorrect option is wrong.
6. The questions should be challenging and require critical thinking, not just direct recall.

IMPORTANT: Format your entire response as valid JSON following this exact structure:
{
  "summary": "your 450-550 word summary here",
  "questions": [
    {
      "questionText": "question here",
      "questionType": "main-idea/inference/detail/strengthen-weaken",
      "options": [
        {"text": "option A", "isCorrect": false},
        {"text": "option B", "isCorrect": true},
        {"text": "option C", "isCorrect": false},
        {"text": "option D", "isCorrect": false}
      ],
      "explanation": "detailed explanation here"
    }
  ],
  "metadata": {
    "wordCount": 0
  }
}

ESSAY CONTENT:
${truncatedContent}`;

    console.log(
      `Sending request to Gemini API (${MODEL_NAME}) for essay: "${essayTitle}"`
    );

    // Make direct API call using axios - removing system role
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent`,
      {
        contents: [
          // Only include user role
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      },
      {
        params: { key: API_KEY },
        headers: { "Content-Type": "application/json" },
      }
    );

    // Rest of the function remains the same
    const text = response.data.candidates[0].content.parts[0].text;
    console.log("Received response, extracting JSON...");

    // Use our improved JSON extraction function
    let rcContent;
    try {
      rcContent = extractJSON(text);
      console.log("Successfully extracted JSON response");
    } catch (error) {
      console.error("Failed to extract JSON. Raw response:", text);
      throw new Error("Invalid JSON response from Gemini API");
    }

    // Validate and set summary word count
    const summaryWordCount = countWords(rcContent.summary || "");
    rcContent.metadata = rcContent.metadata || {};
    rcContent.metadata.wordCount = summaryWordCount;

    console.log(`Generated summary with ${summaryWordCount} words`);

    // Simple validation of questions
    if (!rcContent.questions || !Array.isArray(rcContent.questions)) {
      console.warn("No valid questions array in response");
      rcContent.questions = [];
    }

    return rcContent;
  } catch (error) {
    console.error("Error generating RC content with Gemini:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

module.exports = { generateRCContent, countWords };
