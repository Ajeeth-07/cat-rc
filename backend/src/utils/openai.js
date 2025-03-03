const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Count words in a text
 * @param {string} text - The text to count words in
 * @returns {number} - Word count
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Generate CAT-style Reading Comprehension content from an essay
 * @param {string} essayContent - The full essay content
 * @param {string} essayTitle - The essay title
 * @param {string} essayCategory - The essay category (optional)
 * @returns {Object} - Formatted RC content
 */
async function generateRCContent(essayContent, essayTitle, essayCategory = '') {
  try {
    // Craft a detailed prompt for CAT-style RC generation
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
5. For each question, provide a detailed explanation (100+ words) of why the correct answer is right and why each incorrect option is wrong.
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
    // 4 more questions with similar structure
  ],
  "metadata": {
    "wordCount": 0
  }
}

ESSAY CONTENT:
${essayContent}
`;

    // API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or gpt-4 or whatever model you prefer
      messages: [
        {
          role: "system",
          content: "You are an expert CAT exam content creator specializing in Reading Comprehension passages and questions. You excel at creating challenging but fair content that tests critical reading skills."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    // Parse the response
    let rcContent = JSON.parse(response.choices[0].message.content);
    
    // Validate summary word count
    const summaryWordCount = countWords(rcContent.summary);
    rcContent.metadata.wordCount = summaryWordCount;
    
    // Validate we have exactly 5 questions with proper structure
    if (!rcContent.questions || rcContent.questions.length !== 5) {
      throw new Error("Generated content doesn't have exactly 5 questions");
    }
    
    // Ensure each question has exactly 4 options and one correct answer
    rcContent.questions.forEach(question => {
      if (!question.options || question.options.length !== 4) {
        throw new Error("Each question must have exactly 4 options");
      }
      
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        throw new Error("Each question must have exactly one correct option");
      }
    });
    
    return rcContent;
  } catch (error) {
    console.error("Error generating RC content:", error);
    throw error;
  }
}

/**
 * Batch process multiple essays for RC generation
 * @param {Array} essays - Array of essay objects
 * @returns {Array} - Array of RC contents
 */
async function batchGenerateRCContent(essays) {
  const results = [];
  
  for (const essay of essays) {
    try {
      console.log(`Generating RC content for essay: ${essay.title}`);
      const rcContent = await generateRCContent(essay.content, essay.title, essay.category);
      results.push({
        essayId: essay._id,
        rcContent
      });
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to generate RC for essay ${essay._id}:`, error);
      results.push({
        essayId: essay._id,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = { generateRCContent, batchGenerateRCContent, countWords };