const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
   - 2 specific detail/fact-based questions
   - 1 strengthen/weaken the argument question
5. For each question, provide a detailed explanation (100+ words) of why the correct answer is right and why each incorrect option is wrong.
6. The questions should be challenging and require critical thinking, not just direct recall.

You must format your response in valid JSON with the following structure:
{
  "summary": "your 450-550 word summary here",
  "questions": [
    {
      "questionText": "question here",
      "questionType": "one of: main-idea, inference, fact-detail, strengthen-weaken",
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

    console.log(`Sending request to Gemini API for essay: "${essayTitle}"`);

    // Create a text-only generative model
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction:
        "You are an expert CAT exam content creator. You specialize in creating Reading Comprehension passages and questions that test critical reading skills.",
    });

    console.log("Model initialized, sending prompt...");

    // Generate content with a simple prompt structure
    const result = await model.generateContent(prompt);

    // Get the response text
    const response = result.response;
    const text = response.text();

    console.log("Received response, parsing JSON...");

    // Parse the response as JSON
    let rcContent;
    try {
      // Clean the text in case the model adds markdown backticks or other formatting
      const cleanedText = text.replace(/```json|```|</g, "").trim();
      rcContent = JSON.parse(cleanedText);
      console.log("Successfully parsed JSON response");
    } catch (error) {
      console.error("Failed to parse JSON response. Raw response:", text);
      throw new Error("Invalid JSON response from Gemini API");
    }

    // Validate and set summary word count
    const summaryWordCount = countWords(rcContent.summary);
    rcContent.metadata = rcContent.metadata || {};
    rcContent.metadata.wordCount = summaryWordCount;

    console.log(`Generated summary with ${summaryWordCount} words`);

    // Check that we have questions
    if (!rcContent.questions || !Array.isArray(rcContent.questions)) {
      console.warn("No valid questions array in response");
      rcContent.questions = [];
    }

    return rcContent;
  } catch (error) {
    console.error("Error generating RC content with Gemini:", error);
    throw error;
  }
}

module.exports = { generateRCContent, countWords };
