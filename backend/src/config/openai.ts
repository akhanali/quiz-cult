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
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 4000,  // Increased from 2000 to maximum allowed
  timeout: 30000, 
} as const;

/**
 * Generate difficulty-specific prompts for OpenAI
 */
export const generateQuestionPrompt = (topic: string, difficulty: DifficultyLevel, count: number): string => {
  const difficultyInstructions = {
    easy: {
      description: 'Basic recall and recognition questions requiring minimal thinking',
      timeLimit: '10-15 seconds',
      complexity: 'Direct factual recall, simple identification, or basic vocabulary. No calculations, analysis, or complex reasoning required. Questions should be answerable from memory or immediate recognition.',
      examples: 'What is the capital of France? Which planet is closest to the Sun? What color is the sky? Who wrote Romeo and Juliet?'
    },
    medium: {
      description: 'Understanding and application questions requiring moderate analysis', 
      timeLimit: '20-25 seconds',
      complexity: 'Requires understanding relationships between concepts, applying knowledge to new situations, or performing simple calculations. May involve comparing options, identifying patterns, or connecting related ideas.',
      examples: 'Which programming concept helps prevent code duplication? What causes ocean tides? How does photosynthesis work? Which historical event led to the American Revolution?'
    },
    hard: {
      description: 'Critical thinking and specialized knowledge questions requiring deep analysis',
      timeLimit: '30+ seconds', 
      complexity: 'Requires complex reasoning, multi-step problem solving, or specialized domain knowledge. May involve analyzing cause-and-effect relationships, evaluating multiple factors, or applying advanced concepts to novel situations.',
      examples: 'How would a change in Earth\'s axial tilt affect global climate patterns? What are the implications of quantum computing for cryptography? Analyze the economic impact of the Industrial Revolution on social structures.'
    }
  };

  const difficultyInfo = difficultyInstructions[difficulty];

  return `Generate ${count} multiple choice quiz questions about "${topic}" with ${difficulty} difficulty level.

LANGUAGE REQUIREMENTS:
- Generate ALL questions and options in the SAME language as the topic
- If the topic is in Russian, generate questions in Russian
- If the topic is in Spanish, generate questions in Spanish
- If the topic is in French, generate questions in French
- If the topic is in German, generate questions in German
- If the topic is in English, generate questions in English
- If the topic is in Ukrainian, generate questions in Ukrainian
- If the topic is in Kazakh, generate questions in Kazakh
- Match the language of the topic exactly - use the same language for everything

DIFFICULTY REQUIREMENTS:
- Level: ${difficulty.toUpperCase()} (${difficultyInfo.description})
- Time needed: ${difficultyInfo.timeLimit}
- Complexity: ${difficultyInfo.complexity}
- Examples: ${difficultyInfo.examples}

CRITICAL FORMAT REQUIREMENTS:
1. Return ONLY a valid JSON array, no extra text, no markdown formatting
2. Each question MUST have exactly 4 options (no more, no less)
3. correctOption MUST be the exact text from one of the options (not A, B, C, D)
4. All text must be clean and properly escaped for JSON
5. Do not include any numbering, letters, or extra formatting in the options
6. Ensure correctOption matches one of the options exactly (case-sensitive)

MANDATORY JSON EXAMPLE STRUCTURE:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOption": "Option A",
    "timeLimit": 15
  }
]

VALIDATION RULES:
- text: Required string, ends with question mark
- options: Required array with exactly 4 strings
- correctOption: Required string that exactly matches one option
- timeLimit: Optional number (will be auto-set if missing)

Example valid questions:
[
  {
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctOption": "Paris",
    "timeLimit": 15
  },
  {
    "text": "Which programming language uses curly braces for code blocks?",
    "options": ["Python", "JavaScript", "HTML", "CSS"],
    "correctOption": "JavaScript",
    "timeLimit": 20
  }
]

QUALITY STANDARDS:
- Questions should be educational and factually accurate
- Options should be plausible but only one correct
- Avoid trick questions or ambiguous wording
- Ensure questions match the requested difficulty level
- Use appropriate time limits based on complexity
- Maintain consistent language throughout all questions and options
- Each question should be independent and self-contained

Topic: ${topic}
Difficulty: ${difficulty}
Count: ${count}

IMPORTANT: Return ONLY the JSON array, no additional text, explanations, or formatting.`;
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
    estimatedCostPer1000Tokens: 0.0024, // Updated to current GPT-4o-mini output pricing
    averageTokensPerQuestion: 100,
    estimatedCostPerQuestion: 0.00026,  // Updated cost per question
  };
};

// Export the initialized client for direct use if needed
export { openaiClient }; 