import OpenAI from 'openai';

// Get API key from environment variables
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ OpenAI API key not found in environment variables.');
  console.warn('Please add VITE_OPENAI_API_KEY to your .env.local file');
  console.warn('The app will use fallback sample questions instead.');
}

// Initialize OpenAI client only if API key is available
export const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage
}) : null;

// Export boolean for easy checking
export const isOpenAIAvailable = !!openai;

// Configuration constants
export const OPENAI_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
} as const; 