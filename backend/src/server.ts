// Quiz Cult Backend Server - Production Ready v1.0.1
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Import our configuration modules
import env from './config/environment';
import { db, dbHelpers } from './config/firebase';
import { isOpenAIAvailable, testOpenAIConnection, getOpenAIInfo } from './config/openai';

// Import API routes
import roomsRouter from './routes/rooms';
import questionsRouter from './routes/questions';

/**
 * Quiz Cult Backend Server
 * Express + Socket.io + Firebase + OpenAI
 */

// Create Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Create Socket.io server
const io = new SocketServer(server, {
  cors: {
    origin: env.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: env.frontendUrl,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (env.debug) {
    console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

/**
 * Health Check Endpoints
 */

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    port: env.port,
    services: {
      firebase: 'connected',
      openai: isOpenAIAvailable() ? 'available' : 'unavailable'
    }
  });
});

// Detailed status check
app.get('/status', async (req, res) => {
  try {
    // Test Firebase connection (only if available)
    let firebaseStatus = {
      connected: false,
      databaseUrl: env.firebaseDbUrl,
      testResult: 'Database not available in development mode'
    };
    
    if (db) {
      try {
        const firebaseConnected = await dbHelpers.roomExists('test-connection-check');
        firebaseStatus = {
          connected: true,
          databaseUrl: env.firebaseDbUrl,
          testResult: 'Connection successful'
        };
      } catch (error: any) {
        firebaseStatus = {
          connected: false,
          databaseUrl: env.firebaseDbUrl,
          testResult: `Connection failed: ${error.message}`
        };
      }
    }
    
    // Test OpenAI connection (if available)
    let openaiStatus: { available: boolean; error?: string } = { available: false, error: 'Not configured' };
    if (isOpenAIAvailable()) {
      const openaiTest = await testOpenAIConnection();
      openaiStatus = {
        available: openaiTest.success,
        error: openaiTest.error
      };
    }

    const openaiInfo = getOpenAIInfo();

    res.json({
      status: 'detailed',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: env.nodeEnv,
        port: env.port,
        frontendUrl: env.frontendUrl,
        debug: env.debug
      },
      services: {
        firebase: firebaseStatus,
        openai: {
          ...openaiStatus,
          model: openaiInfo.model,
          estimatedCostPerQuestion: openaiInfo.estimatedCostPerQuestion
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * API Routes
 */

// Mount API routes
app.use('/api/rooms', roomsRouter);
app.use('/api/questions', questionsRouter);

// API information endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Quiz Cult Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      status: '/status',
      rooms: {
        create: 'POST /api/rooms',
        join: 'POST /api/rooms/join',
        get: 'GET /api/rooms/:roomId',
        start: 'POST /api/rooms/:roomId/start',
        delete: 'DELETE /api/rooms/:roomId'
      },
      questions: {
        generate: 'POST /api/questions/generate',
        sample: 'GET /api/questions/sample/:difficulty'
      }
    }
  });
});

/**
 * Socket.io Connection Handling
 * Real-time multiplayer communication for quiz games
 */

// Track active connections and room memberships
const activeConnections = new Map<string, { playerId: string; roomId: string; nickname: string }>();
const roomConnections = new Map<string, Set<string>>(); // roomId -> Set of socketIds

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Send welcome message
  socket.emit('welcome', {
    message: 'Connected to Quiz Cult Backend',
    timestamp: new Date().toISOString()
  });

  /**
   * Join a room for real-time updates
   */
  socket.on('join-room', async (data: { roomId: string; playerId: string; nickname: string }) => {
    try {
      const { roomId, playerId, nickname } = data;
      
      console.log(`🚪 Player ${nickname} (${playerId}) joining room ${roomId} via socket ${socket.id}`);

      // Verify room exists
      if (db) {
        const roomSnapshot = await db.ref(`rooms/${roomId}`).once('value');
        if (!roomSnapshot.exists()) {
          socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
          return;
        }
      }

      // Join socket room
      await socket.join(roomId);

      // Track connection
      activeConnections.set(socket.id, { playerId, roomId, nickname });
      
      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
      }
      roomConnections.get(roomId)!.add(socket.id);

      // Notify other players in the room
      socket.to(roomId).emit('player-connected', {
        playerId,
        nickname,
        timestamp: new Date().toISOString()
      });

      // Send confirmation to the joining player
      socket.emit('room-joined', {
        roomId,
        playerId,
        connectedPlayers: Array.from(roomConnections.get(roomId) || []).length,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Player ${nickname} joined room ${roomId}. Total connections: ${roomConnections.get(roomId)?.size || 0}`);

    } catch (error: any) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room', details: error.message });
    }
  });

  /**
   * Leave a room
   */
  socket.on('leave-room', async (data: { roomId: string; playerId: string }) => {
    try {
      const { roomId, playerId } = data;
      const connection = activeConnections.get(socket.id);
      
      if (connection) {
        console.log(`🚪 Player ${connection.nickname} leaving room ${roomId}`);
        
        // Leave socket room
        await socket.leave(roomId);
        
        // Remove from tracking
        activeConnections.delete(socket.id);
        if (roomConnections.has(roomId)) {
          roomConnections.get(roomId)!.delete(socket.id);
          if (roomConnections.get(roomId)!.size === 0) {
            roomConnections.delete(roomId);
          }
        }

        // Notify other players in the room
        socket.to(roomId).emit('player-disconnected', {
          playerId,
          nickname: connection.nickname,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ Player ${connection.nickname} left room ${roomId}`);
      }

    } catch (error: any) {
      console.error('❌ Error leaving room:', error);
    }
  });

  /**
   * Handle answer submission with real-time feedback
   */
  socket.on('submit-answer', async (data: {
    roomId: string;
    playerId: string;
    questionIndex: number;
    selectedOption: string;
    timeToAnswer: number;
  }) => {
    try {
      const { roomId, playerId, questionIndex, selectedOption, timeToAnswer } = data;
      
      console.log(`📝 Answer submitted by player ${playerId} in room ${roomId}: ${selectedOption} (${timeToAnswer}ms)`);

      // Verify player is in room
      const connection = activeConnections.get(socket.id);
      if (!connection || connection.roomId !== roomId || connection.playerId !== playerId) {
        socket.emit('error', { message: 'Invalid player or room', code: 'INVALID_SUBMISSION' });
        return;
      }

      if (!db) {
        socket.emit('error', { message: 'Database not available', code: 'DATABASE_ERROR' });
        return;
      }

      // Get current room state
      const roomSnapshot = await db.ref(`rooms/${roomId}`).once('value');
      if (!roomSnapshot.exists()) {
        socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
        return;
      }

      const room = roomSnapshot.val();
      
      // Validate question index
      if (questionIndex !== room.currentQuestionIndex) {
        socket.emit('error', { message: 'Invalid question index', code: 'INVALID_QUESTION' });
        return;
      }

      // Get current question
      const currentQuestion = room.questions[questionIndex];
      if (!currentQuestion) {
        socket.emit('error', { message: 'Question not found', code: 'QUESTION_NOT_FOUND' });
        return;
      }

      // Check if answer is correct and calculate score
      const isCorrect = selectedOption === currentQuestion.correctOption;
      let scoreEarned = 0;
      
      if (isCorrect) {
        // Score calculation: base points + time bonus
        const basePoints = 100;
        const timeBonus = Math.max(0, Math.floor((currentQuestion.timeLimit * 1000 - timeToAnswer) / 100));
        scoreEarned = basePoints + timeBonus;
      }

      // Create answer record
      const answer = {
        option: selectedOption,
        isCorrect,
        timeToAnswer,
        scoreEarned
      };

      // Update player's answer and score in database
      const currentScore = room.players[playerId]?.score || 0;
      const newScore = currentScore + scoreEarned;

      await db.ref(`rooms/${roomId}/players/${playerId}/answers/${questionIndex}`).set(answer);
      await db.ref(`rooms/${roomId}/players/${playerId}/score`).set(newScore);

      // Notify the player of their result
      socket.emit('answer-result', {
        isCorrect,
        scoreEarned,
        newTotalScore: newScore,
        correctOption: currentQuestion.correctOption,
        timestamp: new Date().toISOString()
      });

      // Notify other players in the room (without revealing the answer)
      socket.to(roomId).emit('player-answered', {
        playerId,
        nickname: connection.nickname,
        timestamp: new Date().toISOString()
      });

      // Check if all players have answered
      const updatedRoomSnapshot = await db.ref(`rooms/${roomId}`).once('value');
      const updatedRoom = updatedRoomSnapshot.val();
      const players = Object.values(updatedRoom.players || {}) as any[];
      const playersWithAnswers = players.filter(p => p.answers && p.answers[questionIndex]);
      
      if (playersWithAnswers.length === players.length) {
        // All players have answered - notify room
        io.to(roomId).emit('all-players-answered', {
          questionIndex,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ All players answered question ${questionIndex} in room ${roomId}`);
      }

      console.log(`✅ Answer processed for player ${playerId}: ${isCorrect ? 'Correct' : 'Incorrect'} (+${scoreEarned} points)`);

    } catch (error: any) {
      console.error('❌ Error processing answer submission:', error);
      socket.emit('error', { message: 'Failed to submit answer', details: error.message });
    }
  });

  /**
   * Handle game state changes (host only)
   */
  socket.on('game-state-change', async (data: {
    roomId: string;
    hostId: string;
    gameState: any;
    action: 'next-question' | 'show-results' | 'end-game';
  }) => {
    try {
      const { roomId, hostId, gameState, action } = data;
      
      console.log(`🎮 Game state change in room ${roomId}: ${action}`);

      // Verify host permissions
      const connection = activeConnections.get(socket.id);
      if (!connection || connection.roomId !== roomId || connection.playerId !== hostId) {
        socket.emit('error', { message: 'Only the host can change game state', code: 'INSUFFICIENT_PERMISSIONS' });
        return;
      }

      if (!db) {
        socket.emit('error', { message: 'Database not available', code: 'DATABASE_ERROR' });
        return;
      }

      // Get current room state
      const roomSnapshot = await db.ref(`rooms/${roomId}`).once('value');
      if (!roomSnapshot.exists()) {
        socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
        return;
      }

      const room = roomSnapshot.val();

      // Handle different game state changes
      switch (action) {
        case 'next-question':
          if (room.currentQuestionIndex < room.questions.length - 1) {
            const nextQuestionIndex = room.currentQuestionIndex + 1;
            await db.ref(`rooms/${roomId}/currentQuestionIndex`).set(nextQuestionIndex);
            await db.ref(`rooms/${roomId}/gameState`).set({
              ...gameState,
              questionStartTime: Date.now()
            });

            // Notify all players of the next question
            io.to(roomId).emit('next-question', {
              questionIndex: nextQuestionIndex,
              question: room.questions[nextQuestionIndex],
              gameState: { ...gameState, questionStartTime: Date.now() },
              timestamp: new Date().toISOString()
            });

            console.log(`➡️ Advanced to question ${nextQuestionIndex} in room ${roomId}`);
          }
          break;

        case 'show-results':
          // Update game state to show results
          await db.ref(`rooms/${roomId}/gameState`).set(gameState);
          
          // Send results to all players
          io.to(roomId).emit('show-results', {
            questionIndex: room.currentQuestionIndex,
            results: Object.values(room.players).map((player: any) => ({
              playerId: player.id,
              nickname: player.nickname,
              answer: player.answers?.[room.currentQuestionIndex],
              score: player.score
            })),
            gameState,
            timestamp: new Date().toISOString()
          });

          console.log(`📊 Showing results for question ${room.currentQuestionIndex} in room ${roomId}`);
          break;

        case 'end-game':
          // Mark game as finished
          await db.ref(`rooms/${roomId}/status`).set('finished');
          await db.ref(`rooms/${roomId}/finishedAt`).set(Date.now());
          await db.ref(`rooms/${roomId}/isGameComplete`).set(true);

          // Send final results to all players
          const finalResults = Object.values(room.players).map((player: any) => ({
            playerId: player.id,
            nickname: player.nickname,
            finalScore: player.score,
            answers: player.answers
          })).sort((a, b) => b.finalScore - a.finalScore);

          io.to(roomId).emit('game-ended', {
            finalResults,
            winner: finalResults[0],
            timestamp: new Date().toISOString()
          });

          console.log(`🏁 Game ended in room ${roomId}. Winner: ${finalResults[0]?.nickname}`);
          break;
      }

    } catch (error: any) {
      console.error('❌ Error handling game state change:', error);
      socket.emit('error', { message: 'Failed to update game state', details: error.message });
    }
  });

  /**
   * Handle player disconnection
   */
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    const connection = activeConnections.get(socket.id);
    if (connection) {
      const { playerId, roomId, nickname } = connection;
      
      // Remove from tracking
      activeConnections.delete(socket.id);
      if (roomConnections.has(roomId)) {
        roomConnections.get(roomId)!.delete(socket.id);
        if (roomConnections.get(roomId)!.size === 0) {
          roomConnections.delete(roomId);
        }
      }

      // Notify other players in the room
      socket.to(roomId).emit('player-disconnected', {
        playerId,
        nickname,
        timestamp: new Date().toISOString()
      });

      console.log(`👋 Player ${nickname} disconnected from room ${roomId}`);
    }
  });

  /**
   * Handle ping for connection testing
   */
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
});

/**
 * Error Handling
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

/**
 * Server Startup
 */
const startServer = async () => {
  try {
    console.log('🚀 Starting Quiz Cult Backend Server...\n');

    // Test services on startup
    console.log('🔧 Testing service connections...');
    
    // Test Firebase
    try {
      await dbHelpers.roomExists('startup-test');
      console.log('✅ Firebase connection test passed');
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
    }

    // Test OpenAI (if configured)
    if (isOpenAIAvailable()) {
      const openaiTest = await testOpenAIConnection();
      if (openaiTest.success) {
        console.log('✅ OpenAI connection test passed');
      } else {
        console.warn('⚠️ OpenAI connection test failed:', openaiTest.error);
      }
    }

    // Start server
    server.listen(env.port, () => {
      console.log('\n🎉 Quiz Cult Backend Server is running!');
      console.log(`📡 Server: http://localhost:${env.port}`);
      console.log(`🌐 Frontend: ${env.frontendUrl}`);
      console.log(`🔍 Health Check: http://localhost:${env.port}/health`);
      console.log(`📊 Status Check: http://localhost:${env.port}/status`);
      console.log(`📖 API Info: http://localhost:${env.port}/api`);
      console.log(`🔌 Socket.io: Ready for connections`);
      console.log('\n✅ Backend ready for Step 4: API Routes implementation\n');
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  // Close Socket.io server first
  io.close(() => {
    console.log('✅ Socket.io server closed');
    
    // Then close HTTP server
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
  
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('⏰ Force shutting down...');
    process.exit(1);
  }, 5000);
});

// Start the server
startServer(); 