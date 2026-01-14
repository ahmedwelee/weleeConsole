import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import RoomManager from './roomManager.js';

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