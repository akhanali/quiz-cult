import { openai, isOpenAIAvailable, OPENAI_CONFIG } from '../lib/openai';
import type { Question, DifficultyLevel } from '../../../shared/types';
import { getSampleQuestions } from '../utils/sampleQuiz';

export interface QuestionGenerationParams {
  topic: string;
  difficulty: DifficultyLevel;
  count: number;
}

// Simplified error types as string constants
export const QuestionGenerationError = {
  NO_API_KEY: 'NO_API_KEY',
  API_FAILURE: 'API_FAILURE',
  PARSING_ERROR: 'PARSING_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT'
} as const;

export type QuestionGenerationErrorType = typeof QuestionGenerationError[keyof typeof QuestionGenerationError];

export class QuestionGenerationException extends Error {
  public errorType: QuestionGenerationErrorType;
  public fallbackUsed: boolean;

  constructor(
    errorType: QuestionGenerationErrorType,
    message: string,
    fallbackUsed: boolean = false
  ) {
    super(message);
    this.name = 'QuestionGenerationException';
    this.errorType = errorType;
    this.fallbackUsed = fallbackUsed;
  }
}

/**
 * Main function to generate questions using OpenAI API with fallback to sample questions
 */
export async function generateQuestions(params: QuestionGenerationParams): Promise<Question[]> {
  console.log(`🤖 Generating ${params.count} ${params.difficulty} questions about ${params.topic}`);
  
  // Fallback to sample questions if OpenAI not available
  if (!isOpenAIAvailable) {
    console.warn('OpenAI not available, using sample questions as fallback');
    return getFallbackQuestions(params);
  }

  try {
    const prompt = createQuestionPrompt(params);
    console.log('📝 Sending prompt to OpenAI...');
    
    const response = await openai!.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [{ role: "user", content: prompt }],
      temperature: OPENAI_CONFIG.temperature,
      max_tokens: OPENAI_CONFIG.maxTokens,
    });

    const aiContent = response.choices[0].message.content;
    console.log('✅ Received response from OpenAI');
    
    const questions = parseAIResponse(aiContent);
    const validatedQuestions = validateAndEnhanceQuestions(questions, params);
    
    console.log(`🎯 Successfully generated ${validatedQuestions.length} questions`);
    return validatedQuestions;
    
  } catch (error) {
    console.error('❌ OpenAI question generation failed:', error);
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('📋 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack
      });
      
      // Check for specific OpenAI API errors
      if (error.message.includes('401')) {
        console.error('🔑 Authentication Error: Invalid API key');
      } else if (error.message.includes('429')) {
        console.error('🚦 Rate Limit Error: Too many requests or insufficient quota');
      } else if (error.message.includes('400')) {
        console.error('⚙️ Bad Request Error: Invalid request parameters');
      } else if (error.message.includes('timeout')) {
        console.error('⏱️ Timeout Error: Request took too long');
      } else if (error.message.includes('network')) {
        console.error('🌐 Network Error: Connection issue');
      }
    }
    
    // Use fallback questions
    console.log('🔄 Using fallback sample questions');
    const fallbackQuestions = getFallbackQuestions(params);
    
    // For now, return fallback questions instead of throwing
    // In a future version, we can decide whether to throw or return fallback
    console.warn('Returning fallback questions due to AI generation failure');
    return fallbackQuestions;
  }
}

/**
 * Create difficulty-appropriate prompts for OpenAI
 */
function createQuestionPrompt({ topic, difficulty, count }: QuestionGenerationParams): string {
  const difficultySpecs = {
    easy: {
      timeRange: "10-20 seconds",
      complexity: "Simple recall or recognition. No calculations, minimal reading required.",
      examples: "Name a capital city, identify a color, basic true/false questions",
      timeLimit: "10-15"
    },
    medium: {
      timeRange: "21-30 seconds", 
      complexity: "Understanding and light reasoning. May involve basic calculations or comparisons.",
      examples: "Choose correct formula, interpret small graph, simple logic problems",
      timeLimit: "20-25"
    },
    hard: {
      timeRange: "35+ seconds",
      complexity: "Critical thinking and domain knowledge. Multi-step problems or analysis required.",
      examples: "Complex calculations, data analysis, research interpretation, advanced reasoning",
      timeLimit: "30-40"
    }
  };

  const spec = difficultySpecs[difficulty];
  
  return `Create ${count} multiple choice quiz questions about ${topic} at ${difficulty} difficulty level.

DIFFICULTY REQUIREMENTS:
- Target answering time: ${spec.timeRange}
- Complexity level: ${spec.complexity}
- Question types: ${spec.examples}

FORMATTING REQUIREMENTS:
- Return a valid JSON array only (no markdown code blocks)
- Each question must have exactly 4 options
- One option must be clearly correct
- Other options should be plausible but incorrect
- All questions must be factual and verifiable
- correctOption MUST be the exact text from one of the options (not A, B, C, D or 1, 2, 3, 4)

JSON FORMAT EXAMPLE:
[
  {
    "text": "Which planet is closest to the Sun?",
    "options": ["Mercury", "Venus", "Earth", "Mars"],
    "correctOption": "Mercury",
    "timeLimit": ${spec.timeLimit},
    "difficulty": "${difficulty}",
    "timeReasoning": "Basic astronomy fact requiring simple recall"
  }
]

CRITICAL REQUIREMENTS:
- correctOption must be EXACTLY one of the texts from the options array
- Do NOT use letter format (A, B, C, D) - use the actual option text
- Questions should be directly related to ${topic}
- Avoid ambiguous wording
- Ensure correct answer is definitively right
- Make incorrect options believable but clearly wrong
- Time limits should match difficulty (${spec.timeRange})

Generate exactly ${count} high-quality questions and return ONLY the JSON array.`;
}

/**
 * Parse and clean AI response
 */
function parseAIResponse(content: string | null): any[] {
  if (!content) {
    throw new Error('Empty response from OpenAI API');
  }
  
  try {
    // Clean response - remove markdown code blocks and extra whitespace
    let cleanContent = content.trim();
    cleanContent = cleanContent.replace(/^```json\s*\n?|\n?\s*```$/g, '');
    cleanContent = cleanContent.replace(/^```\s*\n?|\n?\s*```$/g, '');
    cleanContent = cleanContent.trim();
    
    // Fix common AI response formatting issues before JSON parsing
    // Fix timeLimit ranges like "10-15" -> 15 (use the higher value)
    cleanContent = cleanContent.replace(/"timeLimit":\s*(\d+)-(\d+)/g, (match, min, max) => {
      const maxValue = parseInt(max);
      console.warn(`Fixed timeLimit range ${match} -> ${maxValue}`);
      return `"timeLimit": ${maxValue}`;
    });
    
    // Fix timeLimit ranges like "10 to 15" -> 15
    cleanContent = cleanContent.replace(/"timeLimit":\s*(\d+)\s*to\s*(\d+)/g, (match, min, max) => {
      const maxValue = parseInt(max);
      console.warn(`Fixed timeLimit range ${match} -> ${maxValue}`);
      return `"timeLimit": ${maxValue}`;
    });
    
    // Fix unquoted timeLimit values that might not be numbers
    cleanContent = cleanContent.replace(/"timeLimit":\s*([^",\}\s]+)/g, (match, value) => {
      // If it's already a number, keep it
      if (/^\d+$/.test(value.trim())) {
        return match;
      }
      // Otherwise, try to extract a number or use default
      const numberMatch = value.match(/\d+/);
      const extractedNumber = numberMatch ? parseInt(numberMatch[0]) : 15;
      console.warn(`Fixed timeLimit value ${match} -> "timeLimit": ${extractedNumber}`);
      return `"timeLimit": ${extractedNumber}`;
    });
    
    const questions = JSON.parse(cleanContent);
    
    if (!Array.isArray(questions)) {
      throw new Error('AI response is not a JSON array');
    }
    
    if (questions.length === 0) {
      throw new Error('AI returned empty question array');
    }
    
    return questions;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw content:', content);
    throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and enhance questions from AI response
 */
function validateAndEnhanceQuestions(questions: any[], params: QuestionGenerationParams): Question[] {
  const validated: Question[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    try {
      // Validate required fields
      if (!q.text || typeof q.text !== 'string') {
        throw new Error('Missing or invalid question text');
      }
      
      if (!Array.isArray(q.options)) {
        throw new Error('Options must be an array');
      }
      
      if (q.options.length !== 4) {
        throw new Error('Must have exactly 4 options');
      }
      
      if (!q.correctOption || typeof q.correctOption !== 'string') {
        throw new Error('Missing or invalid correct option');
      }
      
      // Clean and validate correct option
      const cleanedCorrectOption = q.correctOption.trim();
      const cleanedOptions = q.options.map((opt: any) => String(opt).trim());
      
      // Validate correct option exists in options array (exact match first)
      let isValidCorrectOption = cleanedOptions.includes(cleanedCorrectOption);
      
      // If exact match fails, try case-insensitive match as fallback
      if (!isValidCorrectOption) {
        const lowerCorrectOption = cleanedCorrectOption.toLowerCase();
        const matchingOption = cleanedOptions.find((opt: string) => opt.toLowerCase() === lowerCorrectOption);
        
        if (matchingOption) {
          // Use the exact case from options array
          q.correctOption = matchingOption;
          isValidCorrectOption = true;
          console.warn(`Question ${i}: Fixed case mismatch in correctOption: "${cleanedCorrectOption}" → "${matchingOption}"`);
        }
      }
      
      // If still no match, check if it's a letter format (A, B, C, D) and provide helpful error
      if (!isValidCorrectOption) {
        if (/^[A-D]$/i.test(cleanedCorrectOption)) {
          throw new Error(`Correct option "${cleanedCorrectOption}" appears to be letter format. Please use exact text from options: ${JSON.stringify(cleanedOptions)}`);
        } else {
          throw new Error(`Correct option "${cleanedCorrectOption}" not found in options: ${JSON.stringify(cleanedOptions)}`);
        }
      }
      
      // Validate unique options
      const uniqueOptions = new Set(cleanedOptions);
      if (uniqueOptions.size !== 4) {
        throw new Error('All options must be unique');
      }
      
      // Set appropriate time limit based on difficulty
      const defaultTimeLimits = { easy: 15, medium: 25, hard: 35 };
      const timeLimit = typeof q.timeLimit === 'number' && q.timeLimit > 0 
        ? q.timeLimit 
        : defaultTimeLimits[params.difficulty];
      
      // Create validated question with cleaned data
      const validatedQuestion: Question = {
        text: q.text.trim(),
        options: cleanedOptions,
        correctOption: q.correctOption.trim(), // Use the corrected version
        timeLimit,
        difficulty: params.difficulty,
        timeReasoning: q.timeReasoning || `${params.difficulty} difficulty question about ${params.topic}`
      };
      
      validated.push(validatedQuestion);
      
    } catch (error) {
      console.error(`Question ${i} validation failed:`, error);
      console.error('Question data:', q);
      // Skip invalid questions rather than failing completely
      continue;
    }
  }
  
  if (validated.length === 0) {
    throw new Error('No valid questions after validation');
  }
  
  // If we got fewer questions than requested, that's okay but log it
  if (validated.length < params.count) {
    console.warn(`Generated ${validated.length} valid questions out of ${params.count} requested`);
  }
  
  return validated.slice(0, params.count); // Ensure we don't exceed requested count
}

/**
 * Fallback to sample questions when AI generation fails
 */
function getFallbackQuestions(params: QuestionGenerationParams): Question[] {
  const sampleQuestions = getSampleQuestions(params.difficulty);
  
  // Modify sample questions to match the requested topic if possible
  const modifiedQuestions = sampleQuestions.map(q => ({
    ...q,
    // Keep original questions but add topic context in reasoning
    timeReasoning: `Sample ${params.difficulty} question (requested topic: ${params.topic})`
  }));
  
  // Return requested number of questions (repeat if necessary)
  const result: Question[] = [];
  for (let i = 0; i < params.count; i++) {
    const questionIndex = i % modifiedQuestions.length;
    result.push(modifiedQuestions[questionIndex]);
  }
  
  return result;
}

/**
 * Check if a topic might generate good questions
 */
export function validateTopic(topic: string): { valid: boolean; suggestion?: string } {
  const cleanTopic = topic.trim().toLowerCase();
  
  if (cleanTopic.length < 2) {
    return { valid: false, suggestion: 'Topic should be at least 2 characters long' };
  }
  
  if (cleanTopic.length > 100) {
    return { valid: false, suggestion: 'Topic should be less than 100 characters' };
  }
  
  // Check for inappropriate content (basic check)
  const inappropriateWords = ['test', 'xxx', 'explicit'];
  if (inappropriateWords.some(word => cleanTopic.includes(word))) {
    return { valid: false, suggestion: 'Please choose an educational topic' };
  }
  
  return { valid: true };
} 