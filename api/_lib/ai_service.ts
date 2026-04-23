import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Initialize Groq (if key exists)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Clean and parse JSON from AI response
 */
export function parseJSON(text: string) {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse AI JSON:', text);
    return [];
  }
}

/**
 * Unified request handler with fallback + telemetry
 */
export async function generateAIContent(prompt: string) {
  let telemetry = { engine: 'gemini', status: 'ok', remaining: 100, reset: 0 };
  
  // Try Gemini first
  try {
    const result = await geminiModel.generateContent(prompt);
    return { text: result.response.text(), telemetry };
  } catch (err: any) {
    console.warn('Gemini failed/busy. Checking fallback...', err.message);

    // If Gemini fails and we have Groq
    if (groq) {
      console.log('Falling back to Groq (Llama-3.3-70b)...');
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
        }).asResponse(); // Use .asResponse() to get headers

        const data = await response.json();
        const headers = response.headers;

        telemetry = {
          engine: 'groq',
          status: 'ok',
          remaining: parseInt(headers.get('x-ratelimit-remaining-tokens') || '0'),
          reset: parseFloat(headers.get('x-ratelimit-reset-tokens') || '0')
        };

        return { text: data.choices[0]?.message?.content || '', telemetry };
      } catch (groqErr: any) {
        console.error('Fallback Groq failed:', groqErr.message);
        throw groqErr;
      }
    }
    throw err;
  }
}
