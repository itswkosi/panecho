import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use a known stable model that definitely works
const STABLE_MODEL = 'gemini-2.0-flash';

console.log(`[Gemini] Using model: ${STABLE_MODEL}`);

// Export function to get model instance
export function getGeminiModel() {
  return genAI.getGenerativeModel({ 
    model: STABLE_MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    }
  });
}

export function getValidatedModelName(): string {
  return STABLE_MODEL;
}

export function isUsingFallbackModel(): boolean {
  return false;
}

// Keep for backward compatibility
export { genAI };

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
