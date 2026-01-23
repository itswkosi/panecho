import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'test-key-placeholder');

// Export Gemini model for vision tasks
export const geminiVision = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 1000,
  }
});

// Keep openai export for compatibility during transition
export const openai = {
  chat: {
    completions: {
      create: async () => {
        throw new Error('OpenAI has been replaced with Gemini. This should not be called.');
      }
    }
  }
};
