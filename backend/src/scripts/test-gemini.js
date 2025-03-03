require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    console.log("Testing Gemini API with simple prompt...");
    const result = await model.generateContent("Hello, what can you do?");
    console.log(result.response.text());
    console.log("API test successful!");
  } catch (error) {
    console.error("API test failed:", error);
  }
}

testGemini();