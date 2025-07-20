import OpenAI from 'openai';
import { getOpenAIClient, generateQuestionPrompt, validateOpenAIResponse, OPENAI_CONFIG } from '../config/openai';
import { Question, DifficultyLevel } from '../types/types';

export interface TopicQuestionGenerationParams {
  topic: string;
  difficulty: DifficultyLevel;
  count: number;
}

export interface TopicQuestionGenerationResponse {
  questions: Question[];
  aiGenerated: boolean;
  fallbackReason?: string;
}

export class TopicQuestionService {
  private openai: OpenAI;

  constructor() {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not available');
    }
    this.openai = client;
  }

  /**
   * Sample fallback questions organized by difficulty
   */
  private getSampleQuestions(difficulty: DifficultyLevel): Question[] {
    const questions = {
      easy: [
        {
          text: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctOption: "Paris",
          timeLimit: 15,
          difficulty: "easy" as DifficultyLevel
        },
        {
          text: "Which planet is closest to the Sun?",
          options: ["Venus", "Mercury", "Earth", "Mars"],
          correctOption: "Mercury",
          timeLimit: 12,
          difficulty: "easy" as DifficultyLevel
        },
        {
          text: "What color do you get when you mix red and white?",
          options: ["Purple", "Orange", "Pink", "Yellow"],
          correctOption: "Pink",
          timeLimit: 10,
          difficulty: "easy" as DifficultyLevel
        },
        {
          text: "How many sides does a triangle have?",
          options: ["2", "3", "4", "5"],
          correctOption: "3",
          timeLimit: 8,
          difficulty: "easy" as DifficultyLevel
        },
        {
          text: "Which animal is known as the 'King of the Jungle'?",
          options: ["Tiger", "Elephant", "Lion", "Bear"],
          correctOption: "Lion",
          timeLimit: 12,
          difficulty: "easy" as DifficultyLevel
        }
      ],
      medium: [
        {
          text: "What is the chemical symbol for gold?",
          options: ["Go", "Gd", "Au", "Ag"],
          correctOption: "Au",
          timeLimit: 20,
          difficulty: "medium" as DifficultyLevel
        },
        {
          text: "In which year did World War II end?",
          options: ["1944", "1945", "1946", "1947"],
          correctOption: "1945",
          timeLimit: 25,
          difficulty: "medium" as DifficultyLevel
        },
        {
          text: "What is the largest mammal in the world?",
          options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
          correctOption: "Blue Whale",
          timeLimit: 18,
          difficulty: "medium" as DifficultyLevel
        },
        {
          text: "Which programming language is known for its use in data science?",
          options: ["JavaScript", "Python", "C++", "PHP"],
          correctOption: "Python",
          timeLimit: 22,
          difficulty: "medium" as DifficultyLevel
        },
        {
          text: "What is the square root of 144?",
          options: ["10", "11", "12", "13"],
          correctOption: "12",
          timeLimit: 15,
          difficulty: "medium" as DifficultyLevel
        }
      ],
      hard: [
        {
          text: "What is the time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n log n)", "O(n²)"],
          correctOption: "O(log n)",
          timeLimit: 35,
          difficulty: "hard" as DifficultyLevel
        },
        {
          text: "Which of the following is NOT a principle of object-oriented programming?",
          options: ["Encapsulation", "Inheritance", "Polymorphism", "Compilation"],
          correctOption: "Compilation",
          timeLimit: 30,
          difficulty: "hard" as DifficultyLevel
        },
        {
          text: "In quantum mechanics, what does Schrödinger's equation describe?",
          options: ["Wave function evolution", "Particle position", "Energy levels", "Spin states"],
          correctOption: "Wave function evolution",
          timeLimit: 40,
          difficulty: "hard" as DifficultyLevel
        },
        {
          text: "What is the primary cause of ocean acidification?",
          options: ["Industrial pollution", "CO2 absorption", "Temperature rise", "Overfishing"],
          correctOption: "CO2 absorption",
          timeLimit: 35,
          difficulty: "hard" as DifficultyLevel
        },
        {
          text: "Which algorithm is commonly used for finding shortest paths in graphs?",
          options: ["Bubble Sort", "Dijkstra's Algorithm", "Quick Sort", "Binary Search"],
          correctOption: "Dijkstra's Algorithm",
          timeLimit: 30,
          difficulty: "hard" as DifficultyLevel
        }
      ]
    };

    return questions[difficulty] || questions.easy;
  }

  /**
   * Validate and enhance generated questions
   */
  private validateAndEnhanceQuestions(
    questions: any[], 
    params: TopicQuestionGenerationParams
  ): Question[] {
    const validQuestions: Question[] = [];
    let totalProcessed = 0;
    let validationFailures = 0;

    console.log(`🔍 Validating ${questions.length} AI-generated questions...`);

    for (const q of questions) {
      totalProcessed++;
      try {
        // Validate basic structure
        if (!q.text || !Array.isArray(q.options) || !q.correctOption) {
          console.warn(`⚠️ Question ${totalProcessed} failed: Missing required fields`, {
            hasText: !!q.text,
            hasOptions: Array.isArray(q.options),
            hasCorrectOption: !!q.correctOption,
            question: q
          });
          validationFailures++;
          continue;
        }

        // Clean and validate text
        const cleanText = q.text.trim();
        if (!cleanText || cleanText.length < 10) {
          console.warn(`⚠️ Question ${totalProcessed} failed: Text too short or empty`, {
            text: cleanText,
            length: cleanText.length
          });
          validationFailures++;
          continue;
        }

        // Validate options
        if (q.options.length !== 4) {
          console.warn(`⚠️ Question ${totalProcessed} failed: Must have exactly 4 options`, {
            optionsCount: q.options.length,
            options: q.options
          });
          validationFailures++;
          continue;
        }

        // Clean options
        const cleanOptions = q.options.map((opt: string) => opt.trim()).filter(Boolean);
        if (cleanOptions.length !== 4) {
          console.warn(`⚠️ Question ${totalProcessed} failed: Invalid options after cleaning`, {
            originalOptions: q.options,
            cleanOptions: cleanOptions
          });
          validationFailures++;
          continue;
        }

        // Validate correct option
        const cleanCorrectOption = q.correctOption.trim();
        if (!cleanOptions.includes(cleanCorrectOption)) {
          console.warn(`⚠️ Question ${totalProcessed} failed: Correct option not in options list`, {
            correctOption: cleanCorrectOption,
            options: cleanOptions
          });
          validationFailures++;
          continue;
        }

        // Set appropriate time limit based on difficulty
        let timeLimit: number;
        switch (params.difficulty) {
          case 'easy':
            timeLimit = q.timeLimit || 15;
            break;
          case 'medium':
            timeLimit = q.timeLimit || 25;
            break;
          case 'hard':
            timeLimit = q.timeLimit || 35;
            break;
          default:
            timeLimit = q.timeLimit || 20;
        }

        // Create valid question
        const validQuestion: Question = {
          text: cleanText,
          options: cleanOptions,
          correctOption: cleanCorrectOption,
          timeLimit: timeLimit,
          difficulty: params.difficulty
        };

        validQuestions.push(validQuestion);
        console.log(`✅ Question ${totalProcessed} validated successfully`);

      } catch (error) {
        console.error(`❌ Question ${totalProcessed} validation error:`, error);
        validationFailures++;
      }
    }

    console.log(`📊 Validation complete: ${validQuestions.length} valid, ${validationFailures} failed`);

    return validQuestions;
  }

  /**
   * Generate questions from topic using AI or fallback to samples
   */
  async generateQuestionsFromTopic(params: TopicQuestionGenerationParams): Promise<TopicQuestionGenerationResponse> {
    try {
      console.log(`🧠 Generating ${params.count} ${params.difficulty} questions about "${params.topic}"...`);

      const openai = getOpenAIClient()!;
      
      // Request extra questions to account for potential validation losses
      const requestedCount = params.count;
      const bufferCount = Math.ceil(requestedCount * 1.1); // Request 10% more
      
      console.log(`🧠 Requesting ${bufferCount} questions from AI (target: ${requestedCount}, buffer: ${bufferCount - requestedCount})`);
      
      const prompt = generateQuestionPrompt(params.topic, params.difficulty, bufferCount);

      console.log('🧠 Sending request to OpenAI...');
      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: OPENAI_CONFIG.max_tokens,
        temperature: OPENAI_CONFIG.temperature,
      });

      // Validate OpenAI response
      const validation = validateOpenAIResponse(response);
      if (!validation.valid) {
        throw new Error(`OpenAI response validation failed: ${validation.error}`);
      }

      const content = response.choices[0].message.content!;
      console.log('📝 Raw OpenAI response length:', content.length);

      // Parse JSON response
      let parsedQuestions;
      try {
        // Clean content (remove any markdown formatting or extra text)
        const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
        parsedQuestions = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('❌ Failed to parse OpenAI JSON response:', parseError);
        console.error('Response content:', content);
        throw new Error('Invalid JSON format in OpenAI response');
      }

      // Validate and enhance questions
      const validQuestions = this.validateAndEnhanceQuestions(parsedQuestions, params);

      if (validQuestions.length === 0) {
        throw new Error('No valid questions generated by OpenAI');
      }

      // If we don't have enough valid questions, pad with samples
      if (validQuestions.length < requestedCount) {
        const sampleQuestions = this.getSampleQuestions(params.difficulty);
        const needed = requestedCount - validQuestions.length;
        validQuestions.push(...sampleQuestions.slice(0, needed));
        console.log(`📝 Padded with ${needed} sample questions`);
      }

      console.log(`✅ Successfully generated ${validQuestions.length} questions about "${params.topic}"`);

      return {
        questions: validQuestions.slice(0, requestedCount),
        aiGenerated: true
      };

    } catch (error: any) {
      console.error('❌ AI question generation failed:', error);
      
      // Use fallback sample questions
      console.log('🔄 Using fallback sample questions');
      const sampleQuestions = this.getSampleQuestions(params.difficulty);
      
      return {
        questions: sampleQuestions.slice(0, params.count),
        aiGenerated: false,
        fallbackReason: error.message
      };
    }
  }
} 