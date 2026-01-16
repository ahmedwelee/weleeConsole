import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import RoomManager from './roomManager.js';
import QuizGenerator from './quizGenerator.js';
import QuizGameManager from "./quizGameManager.js";
import WhoIsTheSpyGameManager from "./whoIsTheSpyGameManager.js";


dotenv.config();

const app = express();
const httpServer = createServer(app);

/* =========================
   SOCKET.IO (FIXED CORS)
========================= */
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust to your frontend URL in production
    methods: ["GET", "POST"]
  }
});

/* =========================
   EXPRESS MIDDLEWARE
========================= */
app.use(cors({ origin: "*" }));
app.use(express.json());

const roomManager = new RoomManager();
const quizGenerator = new QuizGenerator();
const quizGameManager  = new QuizGameManager();
const spyGameManager = new WhoIsTheSpyGameManager();

/* =========================
   HEALTH CHECK
========================= */
app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    rooms: roomManager.getRoomStats()
  });
});

/* =========================
   SOCKET CONNECTION
========================= */
io.on('connection', (socket) => {
  console.log("✅ Connected:", socket.id);

  /* ---------- HOST CREATE ROOM ---------- */
  socket.on('host:create-room', (callback) => {
    try {
      const room = roomManager.createRoom(socket.id);
      socket.join(room.code);
      callback({ success: true, roomCode: room.code });
      console.log(`🏠 Room created: ${room.code}`);
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- PLAYER JOIN ROOM ---------- */
  socket.on('player:join-room', ({ roomCode, playerName }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: "Room not found" });

      const player = roomManager.addPlayer(code, socket.id, playerName, socket.id);
      socket.join(code);

      // Notify all players in the room about the new player
      io.to(code).emit("player:joined", {
        player,
        players: roomManager.getPlayers(code),
        hostPlayerId: room.hostPlayerId,
        roomState: room.state
      });

      const firstPlayerId = roomManager.getFirstPlayerId(code);
      callback({
        success: true,
        roomCode: code,
        playerId: player.id,
        isHost: player.id === room.hostPlayerId,
        isFirstPlayer: player.id === firstPlayerId,
        roomState: room.state
      });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- HOST START GAME BRIDGE ---------- */
  socket.on('host:start-game', async ({ roomCode, gameName }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) return callback ? callback({ success: false, error: 'Room not found' }) : null;

      if (gameName === 'quiz') {
        const settings = roomManager.getQuizSettings(code) || {};
        const questions = await quizGenerator.generateQuestions(10, settings);

        quizGameManager.createGame(code, questions);
        quizGameManager.startGame(code);

        // Broadcast the quiz start to the entire room (includes host + controllers)
        io.to(code).emit('quiz:started', {
          questions,
          currentQuestion: quizGameManager.getCurrentQuestion(code)
        });

        if (callback) callback({ success: true, questions });
      } else {
        io.to(code).emit('host:game-started', { gameName });
        if (callback) callback({ success: true });
      }
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  /* ---------- ENTER CONFIG STATE ---------- */
  socket.on('game:select', ({ roomCode, playerId, gameType }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.state !== 'WAITING') return callback({ success: false, error: 'Invalid state' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can select game' });

      roomManager.setRoomState(code, 'CONFIG');
      room.gameState.currentGame = gameType;

      io.to(code).emit('room:state-changed', {
        state: 'CONFIG',
        gameType,
        hostPlayerId: room.hostPlayerId
      });

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- UPDATE QUIZ SETTINGS (HOST ONLY) ---------- */
  socket.on('quiz:update-settings', ({ roomCode, playerId, settings }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.state !== 'CONFIG') return callback({ success: false, error: 'Not in config state' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can update settings' });

      roomManager.updateQuizSettings(code, settings);

      io.to(code).emit('quiz:settings-updated', {
        settings: roomManager.getQuizSettings(code)
      });

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- CONFIRM CONFIG ---------- */
  socket.on('quiz:confirm-config', ({ roomCode, playerId }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.state !== 'CONFIG') return callback({ success: false, error: 'Not in config state' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can confirm config' });

      roomManager.confirmQuizSettings(code);

      io.to(code).emit('quiz:config-ready', {
        settings: roomManager.getQuizSettings(code)
      });

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- QUIZ START (HOST ONLY, AFTER CONFIG) ---------- */
  socket.on('quiz:start', async ({ roomCode, playerId }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.state !== 'CONFIG') return callback({ success: false, error: 'Must configure game first' });
      if (!room.quizSettings.configReady) return callback({ success: false, error: 'Settings not confirmed' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can start game' });

      const settings = roomManager.getQuizSettings(code);
      const questions = await quizGenerator.generateQuestions(10, settings);

      quizGameManager.createGame(code, questions);
      quizGameManager.startGame(code);

      roomManager.setRoomState(code, 'PLAYING');

      io.to(code).emit('room:state-changed', {
        state: 'PLAYING'
      });

      io.to(code).emit('quiz:started', {
        questions,
        currentQuestion: quizGameManager.getCurrentQuestion(code)
      });

      callback({ success: true, questions });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- QUIZ ANSWER SUBMISSION ---------- */
  socket.on('quiz:submit-answer', ({ roomCode, playerId, answerLetter }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.state !== 'PLAYING') return callback({ success: false, error: 'Game not playing' });

      // Convert letter (A/B/C/D) to index (0/1/2/3)
      const answerIndex = answerLetter.charCodeAt(0) - 65;

      const result = quizGameManager.submitAnswer(code, playerId, answerIndex);
      if (!result) return callback({ success: false });

      // Send result back to the specific player for immediate feedback
      callback({ success: true, ...result });

      // Notify the host/room about score updates for a live leaderboard
      const game = quizGameManager.getGame(code);
      if (game) {
        io.to(code).emit('quiz:score-update', { scores: game.scores });
      }
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- NEXT QUESTION (Sync All) ---------- */
  socket.on('quiz:next-question', ({ roomCode }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.state !== 'PLAYING') return callback({ success: false, error: 'Game not playing' });

      const result = quizGameManager.nextQuestion(code);
      if (!result) return callback({ success: false });

      if (result.finished) {
        roomManager.setRoomState(code, 'FINISHED');
        io.to(code).emit('room:state-changed', { state: 'FINISHED' });
        io.to(code).emit('quiz:finished', { finalScores: result.finalScores });
      } else {
        // Broadcast the full next-question payload so all clients can sync
        io.to(code).emit('quiz:new-question', {
          question: result.question,
          questionIndex: result.questionIndex,
          totalQuestions: result.totalQuestions,
          timeLimit: result.timeLimit
        });
      }

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ========================================
     WHO IS THE SPY GAME EVENTS
  ======================================== */

  /* ---------- SPY GAME START ---------- */
  socket.on('spy:start-game', ({ roomCode, playerId, language }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can start game' });

      const players = roomManager.getPlayers(code);
      if (players.length < 3) return callback({ success: false, error: 'Need at least 3 players' });

      // Create and start the spy game
      const gameState = spyGameManager.createGame(code, players, language || 'en');

      // Set room state to PLAYING
      roomManager.setRoomState(code, 'PLAYING');
      room.gameState.currentGame = 'spy';

      // Send assignments to each player individually
      players.forEach(player => {
        const assignment = spyGameManager.getPlayerAssignment(code, player.id);
        io.to(player.socketId).emit('spy:assignment', {
          isSpy: assignment.isSpy,
          role: assignment.role,
          location: assignment.location
        });
      });

      // Broadcast game started to the room
      io.to(code).emit('spy:game-started', {
        phase: gameState.phase,
        timer: gameState.timer,
        uiText: spyGameManager.getAllUIText(language || 'en')
      });

      callback({ success: true, gameState });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- SPY GAME START VOTING ---------- */
  socket.on('spy:start-voting', ({ roomCode, playerId }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can start voting' });

      const gameState = spyGameManager.startVoting(code);
      if (!gameState) return callback({ success: false, error: 'Game not found' });

      // Broadcast voting phase to all players
      const players = roomManager.getPlayers(code);
      io.to(code).emit('spy:voting-started', {
        phase: 'VOTING',
        players: players.map(p => ({ id: p.id, name: p.name }))
      });

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- SPY SUBMIT VOTE ---------- */
  socket.on('spy:submit-vote', ({ roomCode, playerId, votedForId }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const game = spyGameManager.getGame(code);

      if (!game) return callback({ success: false, error: 'Game not found' });

      const result = spyGameManager.submitVote(code, playerId, votedForId);
      if (!result) return callback({ success: false, error: 'Vote failed' });

      // Notify room of vote count update
      const players = roomManager.getPlayers(code);
      io.to(code).emit('spy:vote-update', {
        totalVotes: result.totalVotes,
        expectedVotes: players.length
      });

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- SPY PROCESS VOTES ---------- */
  socket.on('spy:process-votes', ({ roomCode, playerId }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can process votes' });

      const result = spyGameManager.processVotes(code);
      if (!result) return callback({ success: false, error: 'Failed to process votes' });

      // Broadcast results to all players
      io.to(code).emit('spy:game-result', result);

      // Set room state to FINISHED
      roomManager.setRoomState(code, 'FINISHED');

      callback({ success: true, result });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- SPY NEXT ROUND ---------- */
  socket.on('spy:next-round', ({ roomCode, playerId }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can start next round' });

      const players = roomManager.getPlayers(code);
      const game = spyGameManager.getGame(code);
      const language = game?.language || 'en';

      // Reset game with same players
      const gameState = spyGameManager.resetGame(code, players);

      // Set room state back to PLAYING
      roomManager.setRoomState(code, 'PLAYING');

      // Send new assignments to each player
      players.forEach(player => {
        const assignment = spyGameManager.getPlayerAssignment(code, player.id);
        io.to(player.socketId).emit('spy:assignment', {
          isSpy: assignment.isSpy,
          role: assignment.role,
          location: assignment.location
        });
      });

      // Broadcast new game started
      io.to(code).emit('spy:game-started', {
        phase: gameState.phase,
        timer: gameState.timer,
        uiText: spyGameManager.getAllUIText(language)
      });

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- SPY CHANGE LANGUAGE ---------- */
  socket.on('spy:change-language', ({ roomCode, playerId, language }, callback) => {
    try {
      const code = String(roomCode || '').toUpperCase();
      const room = roomManager.getRoom(code);

      if (!room) return callback({ success: false, error: 'Room not found' });
      if (!roomManager.isHost(code, playerId)) return callback({ success: false, error: 'Only host can change language' });

      spyGameManager.setLanguage(code, language);

      // Broadcast language change
      io.to(code).emit('spy:language-changed', {
        language,
        uiText: spyGameManager.getAllUIText(language)
      });

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  /* ---------- DISCONNECT ---------- */
  socket.on('disconnect', () => {
    const info = roomManager.findRoomBySocket(socket.id);
    if (!info) return;

    const { code, role, playerId, room } = info;
    if (role === "host") {
      io.to(code).emit("room:closed");
      roomManager.rooms.delete(code);
    } else {
      roomManager.removePlayer(code, playerId);
      io.to(room.host).emit("player:left", playerId);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});