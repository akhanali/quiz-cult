import type { Question, DifficultyLevel } from '../../../shared/types';
import { getSampleQuestions } from '../utils/sampleQuiz';
import apiClient from '../services/apiClient';

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
 * Main function to generate questions using backend API with fallback to sample questions
 */
export async function generateQuestions(params: QuestionGenerationParams): Promise<Question[]> {
  console.log(`🤖 Generating ${params.count} ${params.difficulty} questions about ${params.topic}`);
  
  try {
    console.log('📝 Sending request to backend API...');
    
    const result = await apiClient.generateQuestions({
      topic: params.topic,
      difficulty: params.difficulty,
      count: params.count
    });

    console.log('✅ Received response from backend API');
    
    if (result.aiGenerated) {
      console.log(`🎯 Successfully generated ${result.questions.length} AI questions`);
    } else {
      console.log(`🔄 Using fallback questions: ${result.fallbackReason}`);
    }
    
    return result.questions;
    
  } catch (error) {
    console.error('❌ Backend question generation failed:', error);
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('📋 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack
      });
      
      // Check for specific API errors
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
    console.warn('Returning fallback questions due to backend generation failure');
    return fallbackQuestions;
  }
}

/**
 * Get fallback sample questions when AI generation fails
 */
function getFallbackQuestions(params: QuestionGenerationParams): Question[] {
  console.log(`🔄 Using fallback sample questions for ${params.topic} (${params.difficulty})`);
  const sampleQuestions = getSampleQuestions(params.difficulty);
  
  // Return requested number of questions (or all if fewer available)
  return sampleQuestions.slice(0, params.count);
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