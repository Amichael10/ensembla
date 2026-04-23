const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  try {
    // There is no listModels in the standard genAI object as a direct call sometimes
    // But we can try to fetch a known model and see the error or check documentation
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash");
  } catch (e) {
    console.log("Failed with gemini-1.5-flash, trying gemini-pro...");
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent("test");
      console.log("Success with gemini-pro");
    } catch (e2) {
      console.log("Failed with gemini-pro too.");
      console.log(e2.message);
    }
  }
}
list();
