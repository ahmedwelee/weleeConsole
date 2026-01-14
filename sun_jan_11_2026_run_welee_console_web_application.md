# Copilot Chat Conversation Export: Run WeleeConsole web application

**User:** @ahmedwelee
**Thread URL:** https://github.com/copilot/c/a34ec1ca-8ccd-4be6-ac1f-a4d11aa25e6f

## @ahmedwelee

Prompt: Build an AirConsole-like Web Application

Build a web-based multiplayer gaming platform similar to https://www.airconsole.com
 where smartphones act as game controllers and a desktop or TV browser acts as the main game screen.

Core Concept

One main screen (host) opened on desktop/TV

Multiple mobile devices connect as controllers via browser

Real-time communication between host and controllers

Main Features

Room System

Generate a unique room code / QR code

Players join by entering the code on their phone

Controller Web App (Mobile)

Touch buttons (A, B, arrows, joystick, etc.)

Responsive mobile UI

Sends input events in real time

Game Screen (Desktop/TV)

Displays the game

Shows connected players

Receives controller inputs instantly

Real-Time Communication

Use WebSockets (Socket.io / WebRTC / WebSocket API)

Low latency input handling

Game Engine

Simple example game (e.g., racing, trivia, party game)

Pluggable architecture to add new games easily

User Flow

Open main screen → room created

Phone connects → becomes controller

Start game → receive live inputs

Tech Stack (Suggested)

Frontend: React / Vue / HTML5 Canvas

Backend: Node.js + Express

Real-time: Socket.io or WebRTC

Deployment: Docker-ready

Extra Features (Optional)

Player names & avatars

Reconnection handling

Spectator mode

Fullscreen TV mode

Cross-browser compatibility

Deliverables

Full project structure

Frontend + backend code

Socket communication logic

Sample controller UI

Sample multiplayer game

Setup & run instructions

The application must work entirely in the browser, without installing mobile apps.

## Copilot

I can help you build this AirConsole-like web application!  This is an exciting project that will involve creating a real-time multiplayer gaming platform. 

Since you're asking me to build a complete application for your repository **ahmedwelee/weleeConsole**, I want to clarify how you'd like me to proceed:

## Would you like me to: 

1. **Create a pull request** with the complete implementation of this AirConsole-like platform?  This would include:
   - Full project structure with frontend and backend
   - Room system with unique codes
   - Mobile controller interface
   - Desktop/TV game screen
   - Real-time WebSocket communication (Socket.io)
   - Sample multiplayer game
   - Docker configuration
   - Complete setup and run instructions

2. **Provide you with a detailed implementation guide** and code examples that you can implement yourself?

---

If you'd like me to **create a pull request**, just let me know and I'll build the complete application with: 

- **Backend**: Node.js + Express + Socket.io
- **Frontend**:  React-based UI for both controller and game screen
- **Real-time Communication**: Socket.io for low-latency input
- **Sample Game**: A simple multiplayer party game to demonstrate the platform
- **Docker**:  Ready-to-deploy containerized setup
- **Documentation**: Complete setup, run, and development instructions

Just say **"create a pull request"** or **"open a PR"** and I'll get started!  🚀

## @ahmedwelee

Provide a detailed implementation guide and code examples

## Copilot

# AirConsole-like Web Application - Complete Implementation Guide

I'll provide you with a comprehensive implementation guide with full code examples.  Let's build this step by step!

## 📁 Project Structure

```
weleeConsole/
├── backend/
│   ├── server.js
│   ├── roomManager.js
│   ├── package.json
│   └── . env
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── Host.jsx
│   │   │   ├── Controller.jsx
│   │   │   └── Join.jsx
│   │   ├── components/
│   │   │   ├── GameScreen.jsx
│   │   │   ├── ControllerUI.jsx
│   │   │   ├── PlayerList.jsx
│   │   │   └── RoomCode.jsx
│   │   ├── games/
│   │   │   ├── RacingGame.jsx
│   │   │   └── GameEngine.js
│   │   └── utils/
│   │       └── socket.js
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── Dockerfile. backend
├── Dockerfile.frontend
└── README.md
```

---

## 🔧 Backend Implementation

### 1. Backend Package Configuration

```json name=backend/package.json
{
  "name": "weleeconsole-backend",
  "version": "1.0.0",
  "description": "AirConsole-like backend server",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev":  "nodemon server.js"
  },
  "dependencies":  {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors":  "^2.8.5",
    "dotenv": "^16.0.3",
    "nanoid": "^5.0.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 2. Room Manager (Room System Logic)

```javascript name=backend/roomManager.js
import { nanoid } from 'nanoid';

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  // Generate a unique 6-character room code
  generateRoomCode() {
    let code;
    do {
      code = nanoid(6).toUpperCase();
    } while (this.rooms.has(code));
    return code;
  }

  // Create a new room
  createRoom(hostSocketId) {
    const roomCode = this.generateRoomCode();
    const room = {
      code: roomCode,
      host: hostSocketId,
      players: new Map(),
      gameState: {
        started: false,
        currentGame: null,
        scores: {}
      },
      createdAt: Date.now()
    };
    
    this.rooms.set(roomCode, room);
    console.log(`Room created: ${roomCode}`);
    return room;
  }

  // Get room by code
  getRoom(roomCode) {
    return this.rooms.get(roomCode. toUpperCase());
  }

  // Add player to room
  addPlayer(roomCode, playerId, playerName, socketId) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = {
      id: playerId,
      name: playerName,
      socketId:  socketId,
      connected: true,
      joinedAt: Date.now()
    };

    room.players. set(playerId, player);
    room.gameState.scores[playerId] = 0;
    
    console.log(`Player ${playerName} joined room ${roomCode}`);
    return player;
  }

  // Remove player from room
  removePlayer(roomCode, playerId) {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    room.players.delete(playerId);
    delete room.gameState.scores[playerId];
    
    // If host disconnects or room is empty, delete room
    if (room.players. size === 0) {
      this.rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted (empty)`);
      return true;
    }
    
    return false;
  }

  // Get all players in a room
  getPlayers(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return [];
    
    return Array.from(room.players. values());
  }

  // Update game state
  updateGameState(roomCode, updates) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    room.gameState = { ...room.gameState, ...updates };
    return room.gameState;
  }

  // Find room by socket ID
  findRoomBySocket(socketId) {
    for (const [code, room] of this.rooms. entries()) {
      if (room.host === socketId) {
        return { code, room, role: 'host' };
      }
      
      for (const player of room.players. values()) {
        if (player.socketId === socketId) {
          return { code, room, role: 'player', playerId: player.id };
        }
      }
    }
    return null;
  }

  // Get room statistics
  getRoomStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: Array.from(this.rooms.values()).reduce(
        (sum, room) => sum + room.players.size, 0
      )
    };
  }
}

export default RoomManager;
```

### 3. Main Server File

```javascript name=backend/server.js
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
    origin: process.env. FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

app.use(cors());
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
  socket.on('host: create-room', (callback) => {
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
  socket. on('player:join-room', ({ roomCode, playerName }, callback) => {
    try {
      const room = roomManager. getRoom(roomCode);
      
      if (!room) {
        return callback({ 
          success: false, 
          error: 'Room not found' 
        });
      }

      if (room.gameState.started) {
        return callback({ 
          success: false, 
          error: 'Game already started' 
        });
      }

      const playerId = socket.id;
      const player = roomManager.addPlayer(roomCode, playerId, playerName, socket.id);
      
      socket.join(roomCode);
      
      // Notify host and other players
      io.to(room.host).emit('player:joined', {
        player: player,
        players: roomManager.getPlayers(roomCode)
      });

      callback({ 
        success:  true, 
        playerId: player.id,
        roomCode: roomCode
      });
      
    } catch (error) {
      callback({ success: false, error:  error.message });
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
```

### 4. Backend Environment Variables

```bash name=backend/.env
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🎨 Frontend Implementation

### 1. Frontend Package Configuration

```json name=frontend/package.json
{
  "name": "weleeconsole-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build":  "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "socket. io-client": "^4.6.1",
    "qrcode.react": "^3.1.0",
    "framer-motion": "^10.16.16"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

### 2. Vite Configuration

```javascript name=frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### 3. Socket Utility

```javascript name=frontend/src/utils/socket.js
import { io } from 'socket. io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (! this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console. log('✅ Connected to server:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console. log('❌ Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Host methods
  createRoom(callback) {
    this.socket.emit('host:create-room', callback);
  }

  startGame(roomCode, gameName) {
    this.socket.emit('host:start-game', { roomCode, gameName });
  }

  sendGameState(roomCode, state) {
    this.socket.emit('host:game-state', { roomCode, state });
  }

  endGame(roomCode, finalScores) {
    this.socket.emit('host:end-game', { roomCode, finalScores });
  }

  // Player methods
  joinRoom(roomCode, playerName, callback) {
    this.socket.emit('player:join-room', { roomCode, playerName }, callback);
  }

  sendInput(roomCode, playerId, input) {
    this.socket.emit('controller:input', { roomCode, playerId, input });
  }

  // Event listeners
  on(event, callback) {
    this.socket.on(event, callback);
  }

  off(event, callback) {
    this.socket.off(event, callback);
  }
}

export default new SocketService();
```

### 4. Main App Component

```jsx name=frontend/src/App. jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Host from './pages/Host';
import Controller from './pages/Controller';
import Join from './pages/Join';
import './App.jsx.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<Host />} />
          <Route path="/join" element={<Join />} />
          <Route path="/controller/: roomCode" element={<Controller />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🎮 WeleeConsole</h1>
        <p className="tagline">Your phone is the controller, your screen is the game</p>
      </header>
      
      <div className="home-options">
        <Link to="/host" className="btn btn-primary btn-large">
          🖥️ Host Game
          <span className="btn-subtitle">Start on TV/Desktop</span>
        </Link>
        
        <Link to="/join" className="btn btn-secondary btn-large">
          📱 Join Game
          <span className="btn-subtitle">Connect with phone</span>
        </Link>
      </div>

      <footer className="home-footer">
        <p>No app installation required • Works in any browser</p>
      </footer>
    </div>
  );
}

export default App;
```

### 5. Host Page (Game Screen)

```jsx name=frontend/src/pages/Host.jsx
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import socketService from '../utils/socket. js';
import GameScreen from '../components/GameScreen.jsx';
import PlayerList from '../components/PlayerList.jsx';
import './Host.css';

function Host() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentGame, setCurrentGame] = useState('racing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = socketService.connect();

    // Create room
    socketService.createRoom((response) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setLoading(false);
      } else {
        console.error('Failed to create room:', response.error);
      }
    });

    // Listen for players joining
    socket.on('player:joined', ({ player, players:  updatedPlayers }) => {
      setPlayers(updatedPlayers);
      console.log('Player joined:', player);
    });

    // Listen for players leaving
    socket.on('player:left', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleStartGame = () => {
    if (players.length === 0) {
      alert('Wait for players to join! ');
      return;
    }
    socketService.startGame(roomCode, currentGame);
    setGameStarted(true);
  };

  const handleEndGame = (finalScores) => {
    socketService.endGame(roomCode, finalScores);
    setGameStarted(false);
  };

  const joinUrl = `${window.location.origin}/join`;

  if (loading) {
    return <div className="loading">Creating room...</div>;
  }

  return (
    <div className="host-container">
      {! gameStarted ? (
        <div className="lobby">
          <header className="lobby-header">
            <h1>🎮 Game Lobby</h1>
            <div className="room-info">
              <div className="room-code-display">
                <span className="label">Room Code:</span>
                <span className="code">{roomCode}</span>
              </div>
            </div>
          </header>

          <div className="lobby-content">
            <div className="join-instructions">
              <h2>How to Join: </h2>
              <div className="join-methods">
                <div className="method">
                  <h3>📱 Scan QR Code</h3>
                  <div className="qr-code">
                    <QRCodeSVG 
                      value={`${joinUrl}?code=${roomCode}`} 
                      size={200}
                      level="H"
                    />
                  </div>
                </div>
                
                <div className="method">
                  <h3>🔗 Or visit: </h3>
                  <div className="url-box">
                    <code>{joinUrl}</code>
                  </div>
                  <p>Enter code: <strong>{roomCode}</strong></p>
                </div>
              </div>
            </div>

            <div className="player-section">
              <h2>Connected Players ({players.length})</h2>
              <PlayerList players={players} />
              
              {players.length > 0 && (
                <div className="game-controls">
                  <select 
                    value={currentGame} 
                    onChange={(e) => setCurrentGame(e. target.value)}
                    className="game-select"
                  >
                    <option value="racing">🏎️ Racing Game</option>
                    <option value="trivia">🧠 Trivia Quiz</option>
                    <option value="drawing">🎨 Drawing Game</option>
                  </select>
                  
                  <button 
                    onClick={handleStartGame}
                    className="btn btn-primary btn-large"
                  >
                    Start Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <GameScreen 
          roomCode={roomCode}
          players={players}
          gameName={currentGame}
          onEndGame={handleEndGame}
        />
      )}
    </div>
  );
}

export default Host;
```

### 6. Join Page

```jsx name=frontend/src/pages/Join.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Join.css';

function Join() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(searchParams.get('code') || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    
    if (!roomCode. trim()) {
      setError('Please enter a room code');
      return;
    }
    
    if (!playerName. trim()) {
      setError('Please enter your name');
      return;
    }

    // Navigate to controller page
    navigate(`/controller/${roomCode. toUpperCase()}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>📱 Join Game</h1>
        
        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomCode">Room Code</label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e. target.value. toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary btn-large">
            Join Game
          </button>
        </form>

        <div className="join-footer">
          <a href="/" className="link">← Back to home</a>
        </div>
      </div>
    </div>
  );
}

export default Join;
```

### 7. Controller Page (Mobile UI)

```jsx name=frontend/src/pages/Controller.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import socketService from '../utils/socket.js';
import ControllerUI from '../components/ControllerUI';
import './Controller.css';

function Controller() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [playerName] = useState(searchParams.get('name') || 'Player');
  const [playerId, setPlayerId] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    // Join room
    socketService.joinRoom(roomCode, playerName, (response) => {
      if (response.success) {
        setPlayerId(response.playerId);
        setConnected(true);
        console.log('Joined room successfully');
      } else {
        setError(response.error);
      }
    });

    // Listen for game events
    socket.on('game:started', ({ gameName }) => {
      setGameStarted(true);
      console.log('Game started:', gameName);
    });

    socket.on('game:ended', ({ finalScores }) => {
      setGameStarted(false);
      console.log('Game ended:', finalScores);
    });

    socket.on('room:closed', ({ reason }) => {
      alert(`Room closed: ${reason}`);
      navigate('/join');
    });

    return () => {
      socketService.disconnect();
    };
  }, [roomCode, playerName, navigate]);

  const handleInput = (input) => {
    if (connected && playerId) {
      socketService.sendInput(roomCode, playerId, input);
    }
  };

  if (error) {
    return (
      <div className="controller-error">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/join')} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!connected) {
    return <div className="loading">Connecting... </div>;
  }

  return (
    <div className="controller-container">
      <header className="controller-header">
        <div className="player-info">
          <span className="player-name">{playerName}</span>
          <span className="room-badge">Room: {roomCode}</span>
        </div>
        <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </header>

      {! gameStarted ? (
        <div className="waiting-screen">
          <h2>⏳ Waiting for game to start...</h2>
          <p>The host will start the game soon</p>
        </div>
      ) : (
        <ControllerUI onInput={handleInput} playerName={playerName} />
      )}
    </div>
  );
}

export default Controller;
```

### 8. Controller UI Component

```jsx name=frontend/src/components/ControllerUI.jsx
import React, { useState, useEffect } from 'react';
import './ControllerUI.css';

function ControllerUI({ onInput, playerName }) {
  const [activeButtons, setActiveButtons] = useState(new Set());
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  const handleButtonDown = (button) => {
    setActiveButtons(prev => new Set(prev).add(button));
    onInput({ type: 'button', button, action: 'down' });
  };

  const handleButtonUp = (button) => {
    setActiveButtons(prev => {
      const next = new Set(prev);
      next.delete(button);
      return next;
    });
    onInput({ type: 'button', button, action: 'up' });
  };

  const handleJoystickMove = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect. width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      const x = Math.cos(angle) * maxDistance;
      const y = Math. sin(angle) * maxDistance;
      setJoystick({ x:  x / maxDistance, y: y / maxDistance });
    } else {
      setJoystick({ x: deltaX / maxDistance, y: deltaY / maxDistance });
    }
    
    onInput({ 
      type: 'joystick', 
      x: joystick.x, 
      y: joystick.y 
    });
  };

  const handleJoystickEnd = () => {
    setJoystick({ x: 0, y: 0 });
    onInput({ type: 'joystick', x: 0, y: 0 });
  };

  return (
    <div className="controller-ui">
      <div className="controller-layout">
        {/* Left side - Joystick */}
        <div className="left-controls">
          <div 
            className="joystick-container"
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
          >
            <div className="joystick-base">
              <div 
                className="joystick-stick"
                style={{
                  transform: `translate(${joystick.x * 40}px, ${joystick. y * 40}px)`
                }}
              />
            </div>
            <div className="joystick-label">Joystick</div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="right-controls">
          <div className="button-group">
            <button
              className={`game-button btn-a ${activeButtons.has('A') ? 'active' : ''}`}
              onTouchStart={() => handleButtonDown('A')}
              onTouchEnd={() => handleButtonUp('A')}
              onMouseDown={() => handleButtonDown('A')}
              onMouseUp={() => handleButtonUp('A')}
            >
              A
            </button>
            <button
              className={`game-button btn-b ${activeButtons.has('B') ? 'active' : ''}`}
              onTouchStart={() => handleButtonDown('B')}
              onTouchEnd={() => handleButtonUp('B')}
              onMouseDown={() => handleButtonDown('B')}
              onMouseUp={() => handleButtonUp('B')}
            >
              B
            </button>
          </div>
        </div>
      </div>

      {/* D-Pad */}
      <div className="dpad-container">
        <div className="dpad">
          <button
            className={`dpad-btn dpad-up ${activeButtons.has('UP') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('UP')}
            onTouchEnd={() => handleButtonUp('UP')}
            onMouseDown={() => handleButtonDown('UP')}
            onMouseUp={() => handleButtonUp('UP')}
          >
            ▲
          </button>
          <button
            className={`dpad-btn dpad-left ${activeButtons.has('LEFT') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('LEFT')}
            onTouchEnd={() => handleButtonUp('LEFT')}
            onMouseDown={() => handleButtonDown('LEFT')}
            onMouseUp={() => handleButtonUp('LEFT')}
          >
            ◄
          </button>
          <button
            className={`dpad-btn dpad-right ${activeButtons.has('RIGHT') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('RIGHT')}
            onTouchEnd={() => handleButtonUp('RIGHT')}
            onMouseDown={() => handleButtonDown('RIGHT')}
            onMouseUp={() => handleButtonUp('RIGHT')}
          >
            ►
          </button>
          <button
            className={`dpad-btn dpad-down ${activeButtons.has('DOWN') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('DOWN')}
            onTouchEnd={() => handleButtonUp('DOWN')}
            onMouseDown={() => handleButtonDown('DOWN')}
            onMouseUp={() => handleButtonUp('DOWN')}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

export default ControllerUI;
```

### 9. Player List Component

```jsx name=frontend/src/components/PlayerList. jsx
import React from 'react';
import './PlayerList.jsx.css';

function PlayerList({ players }) {
  if (players.length === 0) {
    return (
      <div className="player-list-empty">
        <p>👥 No players yet</p>
        <p className="subtitle">Waiting for players to join...</p>
      </div>
    );
  }

  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];

  return (
    <div className="player-list">
      {players.map((player, index) => (
        <div key={player.id} className="player-card">
          <div 
            className="player-avatar"
            style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="player-details">
            <span className="player-name">{player.name}</span>
            <span className="player-status">
              {player.connected ? '🟢 Ready' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlayerList;
```

### 10. Game Screen Component (Sample Racing Game)

```jsx name=frontend/src/components/GameScreen. jsx
import React, { useEffect, useState, useRef } from 'react';
import socketService from '../utils/socket.js';
import './GameScreen.jsx.css';

function GameScreen({ roomCode, players, gameName, onEndGame }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    positions: {},
    scores: {},
    countdown: 3
  });
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    // Initialize player positions
    const initialPositions = {};
    const initialScores = {};
    players.forEach((player, index) => {
      initialPositions[player.id] = {
        x: 50,
        y: 100 + (index * 80),
        speed: 0
      };
      initialScores[player.id] = 0;
    });
    
    setGameState(prev => ({
      ...prev,
      positions: initialPositions,
      scores: initialScores
    }));

    // Countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setGameState(prev => ({ ...prev, countdown: count }));
      if (count <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Listen for controller inputs
    socket.on('game:input', ({ playerId, input }) => {
      handlePlayerInput(playerId, input);
    });

    // Start game loop
    startGameLoop();

    return () => {
      socket.off('game:input');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(countdownInterval);
    };
  }, [players]);

  const handlePlayerInput = (playerId, input) => {
    setGameState(prev => {
      const newPositions = { ...prev.positions };
      const playerPos = newPositions[playerId];
      
      if (! playerPos) return prev;

      if (input.type === 'button') {
        if (input.button === 'A' && input.action === 'down') {
          playerPos.speed = Math.min(playerPos.speed + 2, 10);
        } else if (input.button === 'B' && input.action === 'down') {
          playerPos.speed = Math.max(playerPos.speed - 1, 0);
        }
      } else if (input.type === 'joystick') {
        playerPos.y += input.y * 5;
        playerPos.y = Math.max(50, Math.min(playerPos. y, 550));
      }

      return { ...prev, positions: newPositions };
    });
  };

  const startGameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const FINISH_LINE = 1200;

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas. width, canvas.height);
      
      // Draw track
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw lanes
      ctx.strokeStyle = '#ECF0F1';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      for (let i = 1; i < players.length; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 80 + 60);
        ctx.lineTo(canvas.width, i * 80 + 60);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      
      // Draw finish line
      ctx.fillStyle = '#F39C12';
      ctx. fillRect(FINISH_LINE, 0, 5, canvas.height);
      
      // Update and draw players
      const newPositions = { ...gameState.positions };
      const newScores = { ...gameState.scores };
      let someoneFinished = false;

      players. forEach((player, index) => {
        const pos = newPositions[player.id];
        if (! pos) return;

        // Update position
        if (gameState.countdown <= 0 && pos.x < FINISH_LINE) {
          pos.x += pos.speed;
          pos.speed *= 0.98; // Friction
        }

        // Check if finished
        if (pos.x >= FINISH_LINE && newScores[player.id] === 0) {
          newScores[player.id] = players.length - Object.values(newScores).filter(s => s > 0).length;
          someoneFinished = true;
        }

        // Draw car
        const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12', '#1ABC9C'];
        ctx.fillStyle = colors[index % colors.length];
        ctx. fillRect(pos.x, pos.y - 15, 60, 30);
        
        // Draw player name
        ctx.fillStyle = '#ECF0F1';
        ctx.font = '14px Arial';
        ctx.fillText(player.name, pos. x, pos.y - 20);
        
        // Draw score if finished
        if (newScores[player.id] > 0) {
          ctx.fillStyle = '#F39C12';
          ctx. font = 'bold 20px Arial';
          ctx.fillText(`#${newScores[player.id]}`, pos.x + 70, pos.y + 5);
        }
      });

      setGameState(prev => ({
        ...prev,
        positions: newPositions,
        scores: newScores
      }));

      // Check if all finished
      const finishedCount = Object.values(newScores).filter(s => s > 0).length;
      if (finishedCount === players.length) {
        setGameOver(true);
        setTimeout(() => {
          onEndGame(newScores);
        }, 3000);
        return;
      }

      // Draw countdown
      if (gameState.countdown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#F39C12';
        ctx. font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameState. countdown, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
      } else if (gameState.countdown === 0) {
        ctx.fillStyle = '#2ECC71';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <h2>🏎️ Racing Game</h2>
        <div className="game-info">
          <span>Room:  {roomCode}</span>
          <span>Players: {players.length}</span>
        </div>
      </div>
      
      <div className="game-canvas-container">
        <canvas 
          ref={canvasRef} 
          width={1400} 
          height={600}
          className="game-canvas"
        />
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <h2>🏁 Race Finished!</h2>
          <div className="final-scores">
            {players
              .sort((a, b) => gameState.scores[a.id] - gameState.scores[b.id])
              .map((player, index) => (
                <div key={player.id} className="score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{player.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="game-instructions">
        <p>📱 <strong>A Button:</strong> Accelerate | <strong>B Button:</strong> Brake | <strong>Joystick: </strong> Move Up/Down</p>
      </div>
    </div>
  );
}

export default GameScreen;
```

---

## 🎨 CSS Styling

### App.css

```css name=frontend/src/App.css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background:  linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
}

.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
}

.home-header {
  margin-bottom: 60px;
}

.home-header h1 {
  font-size: 4rem;
  color: white;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.tagline {
  font-size:  1.3rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.home-options {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 60px;
}

.btn {
  padding: 15px 30px;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-large {
  padding: 25px 50px;
  font-size:  1.5rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 280px;
}

.btn-subtitle {
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.9;
}

.btn-primary {
  background: #2ECC71;
  color: white;
}

.btn-primary:hover {
  background: #27AE60;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: #3498DB;
  color: white;
}

.btn-secondary:hover {
  background: #2980B9;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.home-footer {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-size: 1.5rem;
  color: white;
}

@media (max-width: 768px) {
  .home-header h1 {
    font-size: 2.5rem;
  }
  
  .tagline {
    font-size:  1rem;
  }
  
  .home-options {
    flex-direction: column;
    gap: 20px;
  }
  
  . btn-large {
    min-width: 100%;
  }
}
```

### Host.css

```css name=frontend/src/pages/Host.css
. host-container {
  min-height: 100vh;
  background: #1a1a2e;
  color: white;
}

.lobby {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.lobby-header {
  text-align:  center;
  margin-bottom:  50px;
}

.lobby-header h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.room-info {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.room-code-display {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px 40px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.room-code-display . label {
  font-size: 1.2rem;
  opacity: 0.8;
}

.room-code-display .code {
  font-size: 2.5rem;
  font-weight: bold;
  color: #F39C12;
  letter-spacing: 5px;
}

.lobby-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.join-instructions,
.player-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius:  20px;
}

.join-instructions h2,
.player-section h2 {
  font-size: 1.8rem;
  margin-bottom: 25px;
}

.join-methods {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.method {
  text-align: center;
}

.method h3 {
  font-size: 1.3rem;
  margin-bottom:  15px;
}

. qr-code {
  background:  white;
  padding: 20px;
  border-radius: 15px;
  display: inline-block;
}

.url-box {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius:  10px;
  margin:  15px 0;
}

.url-box code {
  font-size: 1.1rem;
  color: #3498DB;
}

.game-controls {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap:  15px;
}

.game-select {
  padding: 15px;
  font-size: 1.1rem;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .lobby-content {
    grid-template-columns: 1fr;
  }
}
```

### Controller.css

```css name=frontend/src/pages/Controller.css
.controller-container {
  min-height: 100vh;
  background: #16213e;
  color: white;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.controller-header {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.player-name {
  font-size:  1.2rem;
  font-weight:  bold;
}

.room-badge {
  font-size: 0.9rem;
  opacity: 0.8;
}

.status {
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.status.connected {
  background: rgba(46, 204, 113, 0.2);
  color: #2ECC71;
}

.waiting-screen {
  flex: 1;
  display:  flex;
  flex-direction:  column;
  align-items:  center;
  justify-content:  center;
  text-align: center;
  padding: 40px;
}

.waiting-screen h2 {
  font-size:  2rem;
  margin-bottom: 15px;
}

.controller-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}
```

### ControllerUI.css

```css name=frontend/src/components/ControllerUI.css
.controller-ui {
  flex: 1;
  display:  flex;
  flex-direction:  column;
  padding: 20px;
  gap: 20px;
}

.controller-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex:  1;
}

.left-controls,
.right-controls {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Joystick */
.joystick-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.joystick-base {
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position:  relative;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.joystick-stick {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  transition: transform 0.05s ease;
}

.joystick-label {
  font-size: 0.9rem;
  opacity: 0.7;
}

/* Action Buttons */
.button-group {
  display: flex;
  gap: 20px;
}

.game-button {
  width: 90px;
  height: 90px;
  border-radius:  50%;
  border: none;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  cursor: pointer;
  transition: all 0.1s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.game-button. btn-a {
  background: linear-gradient(135deg, #E74C3C, #C0392B);
}

.game-button.btn-b {
  background: linear-gradient(135deg, #F39C12, #E67E22);
}

.game-button: active,
.game-button.active {
  transform: scale(0.9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

/* D-Pad */
.dpad-container {
  display: flex;
  justify-content: center;
}

.dpad {
  width: 200px;
  height: 200px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 5px;
}

.dpad-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.1s ease;
}

. dpad-up {
  grid-column: 2;
  grid-row: 1;
}

.dpad-left {
  grid-column: 1;
  grid-row:  2;
}

. dpad-right {
  grid-column: 3;
  grid-row: 2;
}

.dpad-down {
  grid-column: 2;
  grid-row: 3;
}

.dpad-btn:active,
.dpad-btn. active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .controller-layout {
    flex-direction: column;
    gap: 40px;
  }
}
```

### Additional CSS files (PlayerList, GameScreen, Join)

```css name=frontend/src/components/PlayerList.css
.player-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.player-list-empty {
  text-align: center;
  padding: 40px;
  opacity: 0.6;
}

.player-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius:  12px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius:  50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 600;
}

.player-status {
  font-size:  0.85rem;
  opacity: 0.8;
}
```

```css name=frontend/src/components/GameScreen.css
.game-screen {
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
}

.game-info {
  display: flex;
  gap: 20px;
  font-size: 1.1rem;
}

.game-canvas-container {
  background: #2C3E50;
  border-radius: 15px;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.game-canvas {
  max-width: 100%;
  height: auto;
}

.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom:  0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1000;
}

.game-over-overlay h2 {
  font-size: 3rem;
  margin-bottom: 40px;
}

.final-scores {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 400px;
}

.score-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius:  12px;
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 1.5rem;
}

.score-item . rank {
  font-weight: bold;
  color: #F39C12;
  font-size: 2rem;
}

.game-instructions {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  text-align: center;
  color: white;
}
```

```css name=frontend/src/pages/Join.css
.join-container {
  min-height:  100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.join-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
}

.join-card h1 {
  color: #2C3E50;
  text-align: center;
  margin-bottom: 30px;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color:  #2C3E50;
}

.form-group input {
  padding: 15px;
  font-size: 1.1rem;
  border: 2px solid #E0E0E0;
  border-radius: 10px

## @ahmedwelee

how can i run it 

## Copilot

# 🚀 How to Run WeleeConsole

Here's a complete step-by-step guide to get your application up and running! 

---

## 📋 Prerequisites

Make sure you have these installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for version control)

Check your installations: 
```bash
node --version
npm --version
```

---

## 🛠️ Setup Instructions

### Step 1: Create the Project Structure

```bash
# Navigate to your repository
cd weleeConsole

# Create the directory structure
mkdir -p backend frontend/src/{pages,components,games,utils} frontend/public
```

### Step 2: Set Up the Backend

```bash
# Navigate to backend folder
cd backend

# Initialize npm and install dependencies
npm init -y
npm install express socket.io cors dotenv nanoid
npm install --save-dev nodemon

# Create the . env file
cat > .env << EOF
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
EOF
```

Create the backend files by copying the code I provided: 
- `server.js`
- `roomManager.js`
- `package.json` (replace with the one I provided)

### Step 3: Set Up the Frontend

```bash
# Navigate to frontend folder
cd ../frontend

# Create a new Vite + React project (or initialize manually)
npm create vite@latest .  -- --template react

# Install dependencies
npm install
npm install react-router-dom socket.io-client qrcode.react framer-motion

# Create environment file
cat > .env << EOF
VITE_SOCKET_URL=http://localhost:3000
EOF
```

Create all the frontend files by copying the code I provided: 
- All `.jsx` files in `src/pages/` and `src/components/`
- All `.css` files
- `src/utils/socket.js`
- Replace `src/App.jsx`

Create the entry point: 

```jsx name=frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx.jsx';

ReactDOM.createRoot(document. getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Update the HTML file:

```html name=frontend/public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>WeleeConsole - Your Phone is the Controller</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## ▶️ Running the Application

### Option 1: Run Locally (Recommended for Development)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

You should see: 
```
🚀 Server running on port 3000
📡 Socket.IO server ready
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:    http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

---

## 📱 Testing the Application

### On Desktop/TV (Host):

1. Open your browser and go to:  `http://localhost:5173`
2. Click **"Host Game"**
3. You'll see a room code and QR code

### On Mobile (Controller):

**Option A - Same Device Testing:**
1. Open a new browser tab/window
2. Go to `http://localhost:5173`
3. Click **"Join Game"**
4. Enter your name and the room code

**Option B - Real Mobile Device (Recommended):**
1. Make sure your phone and computer are on the **same WiFi network**
2. Find your computer's local IP address: 

   **On Mac/Linux:**
   ```bash
   ifconfig | grep "inet "
   ```
   
   **On Windows:**
   ```bash
   ipconfig
   ```
   
   Look for something like `192.168.x.x`

3. On your phone's browser, go to: `http://YOUR_IP:5173`
   - Example: `http://192.168.1.100:5173`
4. Click **"Join Game"** or scan the QR code
5. Enter your name and room code

### Playing the Game:

1. On the **host screen**, wait for players to join
2. Select a game (Racing Game)
3. Click **"Start Game"**
4. On your **phone**, use the controls: 
   - **A Button**:  Accelerate
   - **B Button**: Brake
   - **Joystick**: Move up/down
   - **D-Pad**:  Directional controls

---

## 🐳 Docker Setup (Optional)

If you prefer to use Docker: 

### 1. Create Dockerfile for Backend

```dockerfile name=Dockerfile. backend
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Create Dockerfile for Frontend

```dockerfile name=Dockerfile.frontend
FROM node:18-alpine as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Create Docker Compose

```yaml name=docker-compose.yml
version: '3.8'

services:
  backend: 
    build: 
      context: . 
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - FRONTEND_URL=http://localhost:80
      - NODE_ENV=production
    networks:
      - weleeconsole

  frontend:
    build: 
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - weleeconsole

networks:
  weleeconsole:
    driver:  bridge
```

### Run with Docker: 

```bash
# Build and start
docker-compose up --build

# Access the app at http://localhost
```

---

## 🔧 Troubleshooting

### Issue:  "Cannot connect to server"

**Solution:**
- Check if backend is running on port 3000
- Verify `VITE_SOCKET_URL` in frontend/.env matches backend URL
- Check firewall settings

### Issue: "Mobile can't connect"

**Solution:**
- Ensure devices are on the same network
- Use your computer's **local IP** instead of `localhost`
- Update `FRONTEND_URL` in backend/.env to include your IP: 
  ```bash
  FRONTEND_URL=http://192.168.1.100:5173
  ```

### Issue: "CORS errors"

**Solution:**
- Make sure CORS is configured in `backend/server.js`
- Check that `FRONTEND_URL` in backend/.env is correct

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Issue: "Port already in use"

**Solution:**
```bash
# Kill process on port 3000 (backend)
# Mac/Linux:
lsof -ti: 3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change the port in backend/.env
```

---

## 📊 Project Structure Summary

```
weleeConsole/
├── backend/
│   ├── server.js           ← Main server file
│   ├── roomManager.js      ← Room logic
│   ├── package. json        ← Backend dependencies
│   └── .env                ← Backend config
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         ← Main app component
│   │   ├── main.jsx        ← Entry point
│   │   ├── pages/          ← Page components
│   │   ├── components/     ← Reusable components
│   │   └── utils/          ← Socket utility
│   ├── package.json        ← Frontend dependencies
│   └── .env                ← Frontend config
│
└── docker-compose.yml      ← Docker setup (optional)
```

---

## ✅ Quick Start Checklist

- [ ] Node.js installed
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Frontend running (`cd frontend && npm run dev`)
- [ ] Open `http://localhost:5173` in browser
- [ ] Test host screen
- [ ] Test controller on mobile (using local IP)

---

## 🎮 Next Steps

Once everything is running: 

1. **Test with multiple players** - Open multiple mobile browsers
2. **Try different games** - Implement trivia or drawing games
3. **Deploy to production** - Use platforms like Railway, Render, or Vercel
4. **Add features**:
   - Player avatars
   - Game selection menu
   - Spectator mode
   - Chat functionality
   - More game types

---

Need help with any specific step? Let me know!  🚀
