import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import RoomManager from './roomManager.js';
import QuizGenerator from './quizGenerator.js';
import QuizGameManager from './quizGameManager.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://192.168.1.108:5173',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();
const quizGenerator = new QuizGenerator();
const quizGameManager = new QuizGameManager();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://192.168.1.108:5173"
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = roomManager.getRoomStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...stats
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // HOST: Create a new room
  socket.on('host:create-room', (callback) => {
    try {
      const room = roomManager.createRoom(socket.id);
      socket.join(room.code);

      callback({
        success: true,
        roomCode: room.code
      });

      console.log(`Host ${socket.id} created room ${room.code}`);
    } catch (error) {
      callback({ success: false, error: error. message });
    }
  });

  // PLAYER: Join a room
    socket.on('player:join-room', ({ roomCode, playerName }, callback) => {
        try {
            const code = roomCode.toUpperCase();
            const room = roomManager.getRoom(code);

            if (!room) {
                return callback({ success: false, error: 'Room not found' });
            }

            const player = roomManager.addPlayer(
                code,
                socket.id,
                playerName,
                socket.id
            );

            socket.join(code);

            io.to(room.host).emit('player:joined', {
                player,
                players: roomManager.getPlayers(code)
            });

            callback({
                success: true,
                playerId: player.id,
                roomCode: code
            });
        } catch (err) {
            callback({ success: false, error: err.message });
        }
    });


    // PLAYER: Send controller input
  socket.on('controller:input', ({ roomCode, playerId, input }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    // Forward input to host
    io.to(room. host).emit('game:input', {
      playerId,
      input,
      timestamp: Date.now()
    });
  });

  // HOST: Start game
  socket.on('host:start-game', ({ roomCode, gameName }) => {
    const gameState = roomManager.updateGameState(roomCode, {
      started: true,
      currentGame:  gameName
    });

    if (gameState) {
      io.to(roomCode).emit('game:started', {
        gameName,
        gameState
      });
    }
  });

  // HOST: Update game state
  socket.on('host:game-state', ({ roomCode, state }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    // Broadcast game state to all players in room
    socket.to(roomCode).emit('game:state-update', state);
  });

  // HOST: End game
  socket.on('host:end-game', ({ roomCode, finalScores }) => {
    const gameState = roomManager.updateGameState(roomCode, {
      started: false,
      currentGame:  null,
      scores: finalScores
    });

    if (gameState) {
      io.to(roomCode).emit('game:ended', {
        finalScores:  gameState.scores
      });
    }
  });

  // QUIZ: Start quiz battle
  socket.on('quiz:start', async ({ roomCode }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      const players = roomManager.getPlayers(roomCode);
      if (players.length === 0) {
        return callback({ success: false, error: 'No players in room' });
      }

      console.log(`Generating quiz questions for room ${roomCode}...`);
      const questions = await quizGenerator.generateQuestions(20);
      
      const game = quizGameManager.createGame(roomCode, questions);
      
      const scores = {};
      players.forEach(player => {
        scores[player.id] = 0;
      });
      game.scores = scores;

      callback({ success: true, totalQuestions: questions.length });

      console.log(`Quiz created for room ${roomCode} with ${questions.length} questions`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      callback({ success: false, error: error.message });
    }
  });

  // QUIZ: Get current question
  socket.on('quiz:get-question', ({ roomCode }, callback) => {
    const question = quizGameManager.getCurrentQuestion(roomCode);
    if (question) {
      callback({ success: true, question });
    } else {
      callback({ success: false, error: 'No active question' });
    }
  });

  // QUIZ: Submit answer
  socket.on('quiz:submit-answer', ({ roomCode, playerId, answerIndex }, callback) => {
    const result = quizGameManager.submitAnswer(roomCode, playerId, answerIndex);
    
    if (result) {
      callback({ success: true, ...result });
      
      const game = quizGameManager.getGame(roomCode);
      const room = roomManager.getRoom(roomCode);
      
      if (room && game) {
        io.to(room.host).emit('quiz:answer-submitted', {
          playerId,
          answerIndex,
          isCorrect: result.isCorrect,
          scores: game.scores
        });
      }
    } else {
      callback({ success: false, error: 'Failed to submit answer' });
    }
  });

  // QUIZ: Next question
  socket.on('quiz:next-question', ({ roomCode }, callback) => {
    const result = quizGameManager.nextQuestion(roomCode);
    
    if (result) {
      callback({ success: true, ...result });
      
      if (result.finished) {
        io.to(roomCode).emit('quiz:finished', {
          finalScores: result.finalScores
        });
        
        setTimeout(() => {
          quizGameManager.deleteGame(roomCode);
        }, 60000);
      } else {
        const question = quizGameManager.getCurrentQuestion(roomCode);
        io.to(roomCode).emit('quiz:new-question', { question });
      }
    } else {
      callback({ success: false, error: 'Failed to get next question' });
    }
  });

  // QUIZ: Get scores
  socket.on('quiz:get-scores', ({ roomCode }, callback) => {
    const game = quizGameManager.getGame(roomCode);
    if (game) {
      callback({ success: true, scores: game.scores });
    } else {
      callback({ success: false, error: 'Game not found' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    const roomInfo = roomManager.findRoomBySocket(socket.id);

    if (roomInfo) {
      const { code, room, role, playerId } = roomInfo;

      if (role === 'host') {
        // Host disconnected - notify all players and close room
        io.to(code).emit('room:closed', {
          reason: 'Host disconnected'
        });
        roomManager.rooms.delete(code);
        console.log(`Room ${code} closed (host disconnected)`);
      } else if (role === 'player') {
        // Player disconnected
        roomManager.removePlayer(code, playerId);
        io.to(room.host).emit('player:left', {
          playerId,
          players: roomManager.getPlayers(code)
        });
      }
    }
  });

  // Heartbeat for connection monitoring
  socket.on('ping', (callback) => {
    callback({ pong: true, timestamp: Date.now() });
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});