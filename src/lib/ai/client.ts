import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key-placeholder',
  dangerouslyAllowBrowser: process.env.NODE_ENV === 'test',
});
