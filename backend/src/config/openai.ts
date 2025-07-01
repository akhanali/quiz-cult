import OpenAI from 'openai';
import { DifficultyLevel } from '../types/types';

/**
 * OpenAI Configuration for Quiz Cult Backend
 * Handles AI-powered question generation with comprehensive error handling
 */

// OpenAI Client instance
let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client with proper error handling
 */
const initializeOpenAI = (): OpenAI | null => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY environment variable not set');
      console.warn('📝 AI question generation will not be available');
      console.warn('🔧 Set OPENAI_API_KEY to enable AI features');
      return null;
    }

    if (!apiKey.startsWith('sk-')) {
      console.error('❌ Invalid OpenAI API key format');
      console.error('🔑 API key should start with "sk-"');
      return null;
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });

    console.log('✅ OpenAI client initialized successfully');
    console.log('🤖 AI question generation available');
    
    return openaiClient;

  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error);
    return null;
  }
};

// Initialize OpenAI client
openaiClient = initializeOpenAI();

/**
 * Check if OpenAI is available and properly configured
 */
export const isOpenAIAvailable = (): boolean => {
  return openaiClient !== null;
};

/**
 * Get OpenAI client instance
 */
export const getOpenAIClient = (): OpenAI | null => {
  return openaiClient;
};

/**
 * OpenAI Configuration Constants
 */
export const OPENAI_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 2000,
  timeout: 30000, // 30 second timeout
} as const;

/**
 * Generate difficulty-specific prompts for OpenAI
 */
export const generateQuestionPrompt = (topic: string, difficulty: DifficultyLevel, count: number): string => {
  const difficultyInstructions = {
    easy: {
      description: 'Basic recall or recognition questions',
      timeLimit: '10-15 seconds',
      complexity: 'Simple facts, definitions, or obvious connections. No calculations or deep thinking required.',
      examples: 'What is the capital of France? Which planet is closest to the Sun?'
    },
    medium: {
      description: 'Understanding and light reasoning questions', 
      timeLimit: '20-25 seconds',
      complexity: 'Requires understanding concepts, making connections, or light calculations. Some analysis needed.',
      examples: 'Which programming concept helps prevent code duplication? What causes ocean tides?'
    },
    hard: {
      description: 'Critical thinking and domain knowledge questions',
      timeLimit: '30+ seconds', 
      complexity: 'Complex analysis, multi-step reasoning, or specialized knowledge. Requires careful thought.',
      examples: 'Analyze the impact of X on Y. What would happen if Z occurred?'
    }
  };

  const difficultyInfo = difficultyInstructions[difficulty];

  return `Generate ${count} multiple choice quiz questions about "${topic}" with ${difficulty} difficulty level.

DIFFICULTY REQUIREMENTS:
- Level: ${difficulty.toUpperCase()} (${difficultyInfo.description})
- Time needed: ${difficultyInfo.timeLimit}
- Complexity: ${difficultyInfo.complexity}
- Examples: ${difficultyInfo.examples}

CRITICAL FORMAT REQUIREMENTS:
1. Return ONLY a valid JSON array, no extra text
2. Each question must have exactly 4 options
3. correctOption MUST be the exact text from one of the options (not A, B, C, D)
4. All text must be clean and properly escaped for JSON

Example format:
[
  {
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctOption": "Paris",
    "timeLimit": 15
  }
]

QUALITY STANDARDS:
- Questions should be educational and factually accurate
- Options should be plausible but only one correct
- Avoid trick questions or ambiguous wording
- Ensure questions match the requested difficulty level
- Use appropriate time limits based on complexity

Topic: ${topic}
Difficulty: ${difficulty}
Count: ${count}

Return the JSON array:`;
};

/**
 * Validate OpenAI API response for common issues
 */
export const validateOpenAIResponse = (response: any): { valid: boolean; error?: string } => {
  if (!response) {
    return { valid: false, error: 'Empty response from OpenAI' };
  }

  if (!response.choices || response.choices.length === 0) {
    return { valid: false, error: 'No choices in OpenAI response' };
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { valid: false, error: 'No content in OpenAI response' };
  }

  try {
    JSON.parse(content);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON in OpenAI response' };
  }
};

/**
 * Test OpenAI connection and API key validity
 */
export const testOpenAIConnection = async (): Promise<{ success: boolean; error?: string }> => {
  if (!openaiClient) {
    return { 
      success: false, 
      error: 'OpenAI client not initialized - check API key configuration' 
    };
  }

  try {
    console.log('🧪 Testing OpenAI connection...');
    
    const response = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: 'Respond with just the word "test" to verify connection.'
        }
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim().toLowerCase();
    
    if (content?.includes('test')) {
      console.log('✅ OpenAI connection test successful');
      return { success: true };
    } else {
      console.log('⚠️ OpenAI responded but with unexpected content:', content);
      return { success: true }; // Still consider it successful if we got a response
    }

  } catch (error: any) {
    console.error('❌ OpenAI connection test failed:', error.message);
    
    // Provide specific error messages for common issues
    if (error.code === 'invalid_api_key') {
      return { success: false, error: 'Invalid OpenAI API key' };
    } else if (error.code === 'insufficient_quota') {
      return { success: false, error: 'OpenAI API quota exceeded' };
    } else if (error.message?.includes('rate limit')) {
      return { success: false, error: 'OpenAI API rate limit reached' };
    } else {
      return { success: false, error: `OpenAI API error: ${error.message}` };
    }
  }
};

/**
 * Get OpenAI model information and pricing
 */
export const getOpenAIInfo = () => {
  return {
    model: OPENAI_CONFIG.model,
    available: isOpenAIAvailable(),
    estimatedCostPer1000Tokens: 0.002, // GPT-3.5-turbo pricing
    averageTokensPerQuestion: 100,
    estimatedCostPerQuestion: 0.0002,
  };
};

// Export the initialized client for direct use if needed
export { openaiClient }; 