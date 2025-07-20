import { Router, Request, Response } from 'express';
import { db, dbHelpers } from '../config/firebase';
import { TopicQuestionService, TopicQuestionGenerationParams } from '../services/topicQuestionService';
import { Room, Player, Question, DifficultyLevel, CreateRoomRequest, CreateRoomResponse, JoinRoomRequest, JoinRoomResponse, StartGameRequest, StartGameResponse, ErrorResponse } from '../types/types';

const router = Router();
const topicQuestionService = new TopicQuestionService();

/**
 * Check if database is available
 */
const checkDatabaseAvailable = (res: Response): boolean => {
  if (!db) {
    res.status(503).json({
      error: 'Database not available',
      details: 'Firebase not configured in development mode'
    } as ErrorResponse);
    return false;
  }
  return true;
};

/**
 * Generate a random 6-digit room code
 */
const generateRoomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a unique player ID
 */
const generatePlayerId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Validate room creation request
 */
const validateCreateRoomRequest = (body: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!body.nickname || typeof body.nickname !== 'string' || body.nickname.trim().length === 0) {
    errors.push('Nickname is required and must be a non-empty string');
  }
  if (body.nickname && body.nickname.trim().length > 20) {
    errors.push('Nickname must be 20 characters or less');
  }

  if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
    errors.push('Topic is required and must be a non-empty string');
  }
  if (body.topic && body.topic.trim().length > 100) {
    errors.push('Topic must be 100 characters or less');
  }

  if (!body.difficulty || !['easy', 'medium', 'hard'].includes(body.difficulty)) {
    errors.push('Difficulty must be one of: easy, medium, hard');
  }

  if (!body.questionCount || typeof body.questionCount !== 'number') {
    errors.push('Question count must be a number');
  }
  if (body.questionCount && (body.questionCount < 1 || body.questionCount > 35)) {
    errors.push('Question count must be between 1 and 35');
  }

  // Validate pre-generated questions if provided
  if (body.questions) {
    if (!Array.isArray(body.questions)) {
      errors.push('Questions must be an array');
    } else {
      if (body.questions.length !== body.questionCount) {
        errors.push(`Expected ${body.questionCount} questions, but received ${body.questions.length}`);
      }
      
      for (let i = 0; i < body.questions.length; i++) {
        const question = body.questions[i];
        if (!question.text || !Array.isArray(question.options) || question.options.length !== 4 || !question.correctOption) {
          errors.push(`Question ${i + 1} is invalid: must have text, exactly 4 options, and correctOption`);
        }
        if (!question.options.includes(question.correctOption)) {
          errors.push(`Question ${i + 1}: correctOption must match one of the provided options`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate join room request
 */
const validateJoinRoomRequest = (body: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!body.roomCode || typeof body.roomCode !== 'string') {
    errors.push('Room code is required and must be a string');
  }
  if (body.roomCode && !/^\d{6}$/.test(body.roomCode)) {
    errors.push('Room code must be exactly 6 digits');
  }

  if (!body.nickname || typeof body.nickname !== 'string' || body.nickname.trim().length === 0) {
    errors.push('Nickname is required and must be a non-empty string');
  }
  if (body.nickname && body.nickname.trim().length > 20) {
    errors.push('Nickname must be 20 characters or less');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Generate questions using AI or fallback to samples (imported from questions route)
 */
const getSampleQuestions = (difficulty: DifficultyLevel): Question[] => {
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
};

/**
 * Generate questions for a room using topic-based service
 */
const generateQuestionsForRoom = async (
  topic: string,
  difficulty: DifficultyLevel,
  count: number
): Promise<Question[]> => {
  try {
    console.log(`🧠 Generating ${count} ${difficulty} questions about "${topic}" for room...`);

    const params: TopicQuestionGenerationParams = {
      topic,
      difficulty,
      count
    };

    const result = await topicQuestionService.generateQuestionsFromTopic(params);

    if (result.questions.length === 0) {
      throw new Error('No questions generated');
    }

    console.log(`✅ Generated ${result.questions.length} questions for room (AI: ${result.aiGenerated})`);

    return result.questions;

  } catch (error: any) {
    console.error('❌ Question generation failed:', error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

/**
 * POST /api/rooms
 * Create a new quiz room
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('🆕 Creating new room:', req.body);

    // Check database availability first
    if (!checkDatabaseAvailable(res)) {
      return;
    }

    // Validate request
    const validation = validateCreateRoomRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      } as ErrorResponse);
    }

    const { nickname, topic, difficulty, questionCount, questions }: CreateRoomRequest = req.body;

    // Generate unique room code
    let roomCode: string;
    let roomExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomCode = generateRoomCode();
      const existingRoom = await dbHelpers.getRoomByCode(roomCode);
      roomExists = existingRoom !== null;
      attempts++;
    } while (roomExists && attempts < maxAttempts);

    if (roomExists) {
      return res.status(500).json({
        error: 'Failed to generate unique room code',
        code: 'ROOM_CODE_GENERATION_FAILED'
      } as ErrorResponse);
    }

    // Generate room and player IDs
    const roomId = db!.ref('rooms').push().key!;
    const playerId = generatePlayerId();

    // Create host player
    const hostPlayer: Player = {
      id: playerId,
      nickname: nickname.trim(),
      isHost: true,
      score: 0,
      joinedAt: Date.now(),
      answers: {}
    };

    // Determine if we have pre-generated questions or need to generate them
    const hasPreGeneratedQuestions = questions && questions.length > 0;
    
    // Create room data
    const roomData: Room = {
      id: roomId,
      roomCode,
      topic: topic.trim(),
      difficulty: difficulty as DifficultyLevel,
      questionCount,
      status: 'waiting',
      hostId: playerId,
      createdAt: Date.now(),
      currentQuestionIndex: 0,
      players: {
        [playerId]: hostPlayer
      },
      questions: hasPreGeneratedQuestions ? questions : [], // Use pre-generated questions or empty initially
      totalQuestions: questionCount,
      isGameComplete: false,
      questionsGenerating: !hasPreGeneratedQuestions // Only generating if no pre-generated questions
    };

    // Save room to Firebase immediately
    await db!.ref(`rooms/${roomId}`).set(roomData);

    if (hasPreGeneratedQuestions) {
      console.log(`✅ Room ${roomCode} created successfully with ID: ${roomId} (using ${questions.length} pre-generated questions)`);
      
      // Return room immediately with pre-generated questions
      const response: CreateRoomResponse = {
        roomId,
        playerId,
        aiGenerated: true, // Pre-generated questions are considered AI-generated
        fallbackReason: undefined
      };

      res.status(201).json(response);
    } else {
      console.log(`✅ Room ${roomCode} created successfully with ID: ${roomId} (questions generating in background)`);
      
      // Return room immediately
      const response: CreateRoomResponse = {
        roomId,
        playerId,
        aiGenerated: false, // Will be updated when questions are generated
        fallbackReason: undefined
      };

      res.status(201).json(response);

      // Generate questions asynchronously (don't await)
      generateQuestionsForRoomAsync(roomId, topic.trim(), difficulty as DifficultyLevel, questionCount);
    }

  } catch (error: any) {
    console.error('❌ Error creating room:', error);
    res.status(500).json({
      error: 'Failed to create room',
      details: error.message
    } as ErrorResponse);
  }
});

/**
 * Generate questions asynchronously and update the room
 */
const generateQuestionsForRoomAsync = async (roomId: string, topic: string, difficulty: DifficultyLevel, count: number): Promise<void> => {
  try {
    console.log(`🧠 Generating questions asynchronously for room ${roomId}: ${count} ${difficulty} questions about "${topic}"`);
    
    // Request extra questions to account for potential validation losses
    const requestedCount = count;
    const bufferCount = Math.ceil(requestedCount * 1.1); // Request 10% more (reduced from 20%)
    
    console.log(`🧠 Requesting ${bufferCount} questions from AI (target: ${requestedCount}, buffer: ${bufferCount - requestedCount})`);
    
    const questions = await generateQuestionsForRoom(topic, difficulty, bufferCount);

    // Update room with generated questions
    const updateData: Partial<Room> = {
      questions: questions.slice(0, requestedCount),
      questionsGenerating: false,
      aiGenerated: true // Assuming AI generation is always true for this service
    };

    await db!.ref(`rooms/${roomId}`).update(updateData);

    console.log(`✅ Questions generated for room ${roomId}: ${questions.length} questions (100% AI)`);

  } catch (error: any) {
    console.error(`❌ Error generating questions for room ${roomId}:`, error);
    
    // Fallback to sample questions if AI generation fails
    const sampleQuestions = getSampleQuestions(difficulty);
    const selectedQuestions = sampleQuestions.slice(0, count);
    
    // Pad with repeated questions if needed
    while (selectedQuestions.length < count) {
      const remaining = count - selectedQuestions.length;
      const additionalQuestions = sampleQuestions.slice(0, remaining);
      selectedQuestions.push(...additionalQuestions);
    }

    const updateData: Partial<Room> = {
      questions: selectedQuestions.slice(0, count),
      questionsGenerating: false,
      aiGenerated: false,
      fallbackReason: 'AI generation failed, using sample questions'
    };

    await db!.ref(`rooms/${roomId}`).update(updateData);
    
    console.log(`✅ Fallback questions set for room ${roomId}: ${selectedQuestions.length} sample questions`);
  }
};

/**
 * POST /api/rooms/join
 * Join an existing room
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    console.log('🚪 Joining room:', req.body);

    // Validate request
    const validation = validateJoinRoomRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      } as ErrorResponse);
    }

    const { roomCode, nickname }: JoinRoomRequest = req.body;

    // Find room by code
    const roomData = await dbHelpers.getRoomByCode(roomCode);
    if (!roomData) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      } as ErrorResponse);
    }

    // Check if room is still accepting players
    if (roomData.status !== 'waiting') {
      return res.status(400).json({
        error: 'Room is not accepting new players',
        code: 'ROOM_NOT_ACCEPTING_PLAYERS'
      } as ErrorResponse);
    }

    // Check if nickname is already taken
    const existingPlayers = Object.values(roomData.players || {});
    const nicknameExists = existingPlayers.some(
      (player: any) => player.nickname.toLowerCase() === nickname.trim().toLowerCase()
    );

    if (nicknameExists) {
      return res.status(409).json({
        error: 'Nickname already taken in this room',
        code: 'NICKNAME_TAKEN'
      } as ErrorResponse);
    }

    // Generate player ID and create player
    const playerId = generatePlayerId();
    const newPlayer: Player = {
      id: playerId,
      nickname: nickname.trim(),
      isHost: false,
      score: 0,
      joinedAt: Date.now(),
      answers: {}
    };

    // Add player to room
    if (!checkDatabaseAvailable(res)) {
      return;
    }
    await db!.ref(`rooms/${roomData.id}/players/${playerId}`).set(newPlayer);

    // Get updated room data
    const updatedRoomSnapshot = await db!.ref(`rooms/${roomData.id}`).once('value');
    const updatedRoom = updatedRoomSnapshot.val() as Room;

    console.log(`✅ Player ${nickname} joined room ${roomCode} (${roomData.id})`);

    const response: JoinRoomResponse = {
      roomId: roomData.id,
      playerId,
      room: updatedRoom
    };

    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error joining room:', error);
    res.status(500).json({
      error: 'Failed to join room',
      details: error.message
    } as ErrorResponse);
  }
});

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    console.log(`🔍 Getting room details for: ${roomId}`);

    // Check if room exists
    if (!checkDatabaseAvailable(res)) {
      return;
    }
    const roomSnapshot = await db!.ref(`rooms/${roomId}`).once('value');
    if (!roomSnapshot.exists()) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      } as ErrorResponse);
    }

    const room = roomSnapshot.val() as Room;
    res.status(200).json(room);

  } catch (error: any) {
    console.error('❌ Error getting room:', error);
    res.status(500).json({
      error: 'Failed to get room',
      details: error.message
    } as ErrorResponse);
  }
});

/**
 * POST /api/rooms/:roomId/start
 * Start a game (host only) - starts the game with pre-generated questions
 */
router.post('/:roomId/start', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { hostId }: StartGameRequest = req.body;

    console.log(`🎮 Starting game for room: ${roomId}`);

    // Check if room exists
    if (!checkDatabaseAvailable(res)) {
      return;
    }
    const roomSnapshot = await db!.ref(`rooms/${roomId}`).once('value');
    if (!roomSnapshot.exists()) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      } as ErrorResponse);
    }

    const room = roomSnapshot.val() as Room;

    // Verify host permissions
    if (room.hostId !== hostId) {
      return res.status(403).json({
        error: 'Only the room host can start the game',
        code: 'INSUFFICIENT_PERMISSIONS'
      } as ErrorResponse);
    }

    // Check if room is in waiting state
    if (room.status !== 'waiting') {
      return res.status(400).json({
        error: 'Game can only be started from waiting state',
        code: 'INVALID_ROOM_STATE'
      } as ErrorResponse);
    }

    // Check if there are enough players (at least 1, which is the host)
    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount < 1) {
      return res.status(400).json({
        error: 'At least one player is required to start the game',
        code: 'NOT_ENOUGH_PLAYERS'
      } as ErrorResponse);
    }

    // Check if questions are available
    if (!room.questions || room.questions.length === 0) {
      return res.status(400).json({
        error: 'No questions available for this room',
        code: 'NO_QUESTIONS_AVAILABLE'
      } as ErrorResponse);
    }

    // Start the game with pre-generated questions
    const gameStartTime = Date.now();
    const firstQuestion = room.questions[0];
    const questionEndTime = gameStartTime + (firstQuestion.timeLimit * 1000);
    
    await db!.ref(`rooms/${roomId}`).update({
      status: 'active',
      startedAt: gameStartTime,
      gameState: {
        phase: 'answering',
        questionStartTime: gameStartTime,
        questionEndTime: questionEndTime,
        allPlayersAnswered: false
      }
    });

    console.log(`✅ Game started for room ${roomId} with ${playerCount} players and ${room.questions.length} questions`);

    const response: StartGameResponse = {
      success: true
    };

    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error starting game:', error);
    res.status(500).json({
      error: 'Failed to start game',
      details: error.message
    } as ErrorResponse);
  }
});

/**
 * DELETE /api/rooms/:roomId
 * Delete a room (host only)
 */
router.delete('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { hostId } = req.body;

    console.log(`🗑️ Deleting room: ${roomId}`);

    // Check if room exists
    if (!checkDatabaseAvailable(res)) {
      return;
    }
    const roomSnapshot = await db!.ref(`rooms/${roomId}`).once('value');
    if (!roomSnapshot.exists()) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      } as ErrorResponse);
    }

    const room = roomSnapshot.val() as Room;

    // Verify host permissions
    if (room.hostId !== hostId) {
      return res.status(403).json({
        error: 'Only the room host can delete the room',
        code: 'INSUFFICIENT_PERMISSIONS'
      } as ErrorResponse);
    }

    // Delete room
    await dbHelpers.deleteRoom(roomId);

    console.log(`✅ Room ${roomId} deleted successfully`);

    res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('❌ Error deleting room:', error);
    res.status(500).json({
      error: 'Failed to delete room',
      details: error.message
    } as ErrorResponse);
  }
});

/**
 * POST /api/rooms/:roomId/kick-player
 * Kick a player from the room (host only)
 */
router.post('/:roomId/kick-player', async (req: Request, res: Response) => {
  try {
    console.log('👢 Kicking player from room:', req.params.roomId, req.body);

    const { roomId } = req.params;
    const { hostId, playerIdToKick } = req.body;

    // Validate request
    if (!hostId || !playerIdToKick) {
      return res.status(400).json({
        error: 'Missing required fields: hostId and playerIdToKick',
        code: 'MISSING_FIELDS'
      } as ErrorResponse);
    }

    // Check database availability
    if (!checkDatabaseAvailable(res)) {
      return;
    }

    // Get room data
    const roomSnapshot = await db!.ref(`rooms/${roomId}`).once('value');
    if (!roomSnapshot.exists()) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      } as ErrorResponse);
    }

    const room = roomSnapshot.val() as Room;

    // Verify host permissions
    if (room.hostId !== hostId) {
      return res.status(403).json({
        error: 'Only the room host can kick players',
        code: 'INSUFFICIENT_PERMISSIONS'
      } as ErrorResponse);
    }

    // Check if room is still in waiting status
    if (room.status !== 'waiting') {
      return res.status(400).json({
        error: 'Cannot kick players after the game has started',
        code: 'GAME_ALREADY_STARTED'
      } as ErrorResponse);
    }

    // Check if player exists in the room
    if (!room.players || !room.players[playerIdToKick]) {
      return res.status(404).json({
        error: 'Player not found in room',
        code: 'PLAYER_NOT_FOUND'
      } as ErrorResponse);
    }

    const playerToKick = room.players[playerIdToKick];

    // Prevent host from kicking themselves
    if (playerToKick.isHost) {
      return res.status(400).json({
        error: 'Host cannot kick themselves',
        code: 'CANNOT_KICK_HOST'
      } as ErrorResponse);
    }

    // Remove player from room
    await db!.ref(`rooms/${roomId}/players/${playerIdToKick}`).remove();

    console.log(`✅ Player ${playerToKick.nickname} (${playerIdToKick}) kicked from room ${roomId} by host ${hostId}`);

    // Return success response
    res.status(200).json({
      success: true,
      kickedPlayer: {
        id: playerIdToKick,
        nickname: playerToKick.nickname
      },
      message: `Player ${playerToKick.nickname} has been kicked from the room`
    });

  } catch (error: any) {
    console.error('❌ Error kicking player:', error);
    res.status(500).json({
      error: 'Failed to kick player',
      details: error.message
    } as ErrorResponse);
  }
});

/**
 * Clean up expired rooms that have been waiting too long
 */
const cleanupExpiredRooms = async (): Promise<void> => {
  try {
    if (!db) return;

    const ROOM_EXPIRY_TIME = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    const now = Date.now();
    const cutoffTime = now - ROOM_EXPIRY_TIME;

    console.log('🧹 Checking for expired rooms...');

    const roomsSnapshot = await db.ref('rooms').once('value');
    const rooms = roomsSnapshot.val();

    if (!rooms) {
      console.log('📝 No rooms found to check for expiration');
      return;
    }

    let deletedCount = 0;
    const deletions: Promise<void>[] = [];

    for (const [roomId, room] of Object.entries(rooms)) {
      const roomData = room as Room;
      
      // Delete rooms that are:
      // 1. Still in 'waiting' status (never started)
      // 2. Created more than 30 minutes ago
      if (roomData.status === 'waiting' && roomData.createdAt < cutoffTime) {
        console.log(`🗑️ Deleting expired room: ${roomData.roomCode} (created ${new Date(roomData.createdAt).toLocaleString()})`);
        deletions.push(db.ref(`rooms/${roomId}`).remove());
        deletedCount++;
      }
    }

    // Execute all deletions in parallel
    await Promise.all(deletions);

    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} expired rooms`);
    } else {
      console.log('📝 No expired rooms found');
    }

  } catch (error: any) {
    console.error('❌ Error cleaning up expired rooms:', error);
  }
};

/**
 * DELETE /api/rooms/cleanup
 * Manually trigger cleanup of expired rooms
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    console.log('🧹 Manual room cleanup triggered');
    
    await cleanupExpiredRooms();
    
    res.status(200).json({
      success: true,
      message: 'Room cleanup completed'
    });

  } catch (error: any) {
    console.error('❌ Error during manual cleanup:', error);
    res.status(500).json({
      error: 'Failed to cleanup rooms',
      details: error.message
    } as ErrorResponse);
  }
});

// Run cleanup every 10 minutes
setInterval(cleanupExpiredRooms, 10 * 60 * 1000);

// Run initial cleanup after 30 seconds
setTimeout(cleanupExpiredRooms, 30 * 1000);

export default router; 