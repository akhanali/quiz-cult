import { Router, Request, Response } from 'express';
import multer from 'multer';
import { DocumentQuestionService, DocumentAnalysis } from '../services/documentQuestionService';
import { DifficultyLevel } from '../types/types';

// Extend Request type to include file property from multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = Router();
const documentQuestionService = new DocumentQuestionService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory, not disk
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.'));
    }
  }
});

/**
 * POST /api/documents/upload
 * Upload and analyze a document
 */
router.post('/upload', upload.single('document'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    console.log(`📝 Document upload request: ${req.file.originalname} (${req.file.size} bytes)`);

    // Process document
    const analysis = await documentQuestionService.uploadAndProcessDocument(
      req.file.buffer,
      req.file.originalname
    );

    console.log(`✅ Document processed successfully: ${analysis.filename}`);

    res.json({
      success: true,
      documentAnalysis: analysis
    });

  } catch (error: any) {
    console.error('❌ Document upload failed:', error);
    res.status(500).json({
      error: 'Document processing failed',
      details: error.message
    });
  }
});

/**
 * POST /api/documents/generate-questions
 * Generate questions from a processed document
 */
router.post('/generate-questions', async (req: Request, res: Response) => {
  try {
    const { fileId, difficulty, count, extractedText } = req.body;

    // Validate request
    if (!fileId || !difficulty || !count || !extractedText) {
      return res.status(400).json({
        error: 'Missing required fields: fileId, difficulty, count, extractedText'
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty level'
      });
    }

    if (count < 1 || count > 25) {
      return res.status(400).json({
        error: 'Question count must be between 1 and 25'
      });
    }

    console.log(`🤖 Generating ${count} ${difficulty} questions from document ${fileId}`);

    // Generate questions using the document question service
    const result = await documentQuestionService.generateQuestionsFromDocument(
      extractedText,
      {
        difficulty: difficulty as DifficultyLevel,
        count: count
      }
    );

    console.log(`✅ Generated ${result.questions.length} questions successfully`);

    res.json({
      success: true,
      questions: result.questions,
      aiGenerated: result.aiGenerated,
      fallbackReason: result.fallbackReason
    });

  } catch (error: any) {
    console.error('❌ Question generation failed:', error);
    res.status(500).json({
      error: 'Question generation failed',
      details: error.message
    });
  }
});

export default router; 