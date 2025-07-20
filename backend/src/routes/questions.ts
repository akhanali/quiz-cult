import { Router, Request, Response } from 'express';
import { TopicQuestionService, TopicQuestionGenerationParams } from '../services/topicQuestionService';
import { DifficultyLevel, ErrorResponse } from '../types/types';

const router = Router();
const topicQuestionService = new TopicQuestionService();

/**
 * Validate question generation request
 */
const validateQuestionRequest = (body: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
    errors.push('Topic is required and must be a non-empty string');
  }
  if (body.topic && body.topic.trim().length > 100) {
    errors.push('Topic must be 100 characters or less');
  }

  if (!body.difficulty || !['easy', 'medium', 'hard'].includes(body.difficulty)) {
    errors.push('Difficulty must be one of: easy, medium, hard');
  }

  if (!body.count || typeof body.count !== 'number') {
    errors.push('Count must be a number');
  }
  if (body.count && (body.count < 1 || body.count > 35)) {
    errors.push('Count must be between 1 and 35');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * POST /api/questions/generate
 * Generate quiz questions using AI or fallback samples
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    console.log('📝 Topic question generation request:', req.body);

    // Validate request
    const validation = validateQuestionRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      } as ErrorResponse);
    }

    const params: TopicQuestionGenerationParams = {
      topic: req.body.topic.trim(),
      difficulty: req.body.difficulty as DifficultyLevel,
      count: req.body.count
    };

    // Generate questions using the topic question service
    const result = await topicQuestionService.generateQuestionsFromTopic(params);

    console.log(`✅ Topic question generation complete: ${result.questions.length} questions, AI: ${result.aiGenerated}`);

    res.status(200).json(result);

  } catch (error: any) {
    console.error('❌ Error in topic question generation endpoint:', error);
    res.status(500).json({
      error: 'Failed to generate questions',
      details: error.message
    } as ErrorResponse);
  }
});

export default router; 