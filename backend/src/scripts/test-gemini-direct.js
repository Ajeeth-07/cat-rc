require("dotenv").config();
const axios = require("axios");

async function testGeminiAPI() {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;

    // First check if API key is correct format
    console.log("API key length:", API_KEY.length);
    console.log(
      "API key format check:",
      /^AIza[0-9A-Za-z-_]{35}$/.test(API_KEY)
    );

    // List available models
    console.log("Listing available models...");
    const listResponse = await axios.get(
      "https://generativelanguage.googleapis.com/v1/models",
      { params: { key: API_KEY } }
    );

    console.log("Available models:");
    listResponse.data.models.forEach((model) => {
      console.log(`- ${model.name}: ${model.displayName}`);
    });

    // Try a simple generation with direct API call
    console.log("\nTesting text generation...");
    const generateResponse = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
      {
        contents: [{ parts: [{ text: "Hello, what can you do?" }] }],
      },
      {
        params: { key: API_KEY },
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("Response:");
    console.log(generateResponse.data.candidates[0].content.parts[0].text);
    console.log("\nTest successful!");
  } catch (error) {
    console.error("Test failed:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testGeminiAPI();
