const axios = require("axios");
require("dotenv").config();

// Initialize Anthropic API key
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

// Improved truncation function that works with word count
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

async function generateRCContent(essayContent, essayTitle, essayCategory = "") {
  try {
    // Truncate the essay content if it's too long
    const truncatedContent = truncateText(essayContent, 3000);

    const prompt = `
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
   - 1 tone/style/author's attitude question
   - 1 specific detail/fact-based question
   - 1 strengthen/weaken the argument question
5. For each question, provide a detailed explanation of why the correct answer is right and why each incorrect option is wrong.
6. The questions should be challenging and require critical thinking, not just direct recall.

FORMAT YOUR RESPONSE IN JSON:
{
  "summary": "your 450-550 word summary here",
  "questions": [
    {
      "questionText": "question here",
      "questionType": "one of: main-idea, inference, tone-style, fact-detail, strengthen-weaken, other",
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

    console.log(`Sending request to Claude API for essay: "${essayTitle}"`);

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku", // Using the base model name
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    console.log("Received response from Claude API");

    // Check if we got content in the response
    if (
      !response.data ||
      !response.data.content ||
      response.data.content.length === 0
    ) {
      throw new Error("Invalid response format from Claude API - no content");
    }

    // Parse the JSON response
    const rcContent = JSON.parse(response.data.content[0].text);

    // Validate the content
    if (!rcContent.summary || !rcContent.questions) {
      throw new Error(
        "Invalid response format from Claude API - missing required fields"
      );
    }

    return rcContent;
  } catch (error) {
    console.error("Error generating RC content with Claude:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Error data:", error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

module.exports = { generateRCContent, countWords };
