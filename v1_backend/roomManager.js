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
      hostPlayerId: null, // Will be set when host joins as player
      players: new Map(),
      state: 'WAITING', // WAITING → CONFIG → PLAYING → FINISHED
      gameState: {
        started: false,
        currentGame: null,
        scores: {}
      },
      quizSettings: {
        language: 'English',
        category: 'History',
        difficulty: 'Medium',
        configReady: false
      },
      createdAt: Date.now()
    };
    
    this.rooms.set(roomCode, room);
    console.log(`Room created: ${roomCode}`);
    return room;
  }

  // Get room by code
  getRoom(roomCode) {
    return this.rooms.get(roomCode.toUpperCase());
  }

  // Add player to room
  addPlayer(roomCode, playerId, playerName, socketId) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = {
      id: playerId,
      name: playerName,
      socketId: socketId,
      connected: true,
      joinedAt: Date.now()
    };

    room.players.set(playerId, player);
    room.gameState.scores[playerId] = 0;
    
    // Set first player as HOST
    if (room.players.size === 1) {
      room.hostPlayerId = playerId;
      console.log(`Player ${playerName} is the HOST of room ${roomCode}`);
    }
    
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
    if (room.players.size === 0) {
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
    
    return Array.from(room.players.values());
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
    for (const [code, room] of this.rooms.entries()) {
      if (room.host === socketId) {
        return { code, room, role: 'host' };
      }
      
      for (const player of room.players.values()) {
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

  // Get first player ID in room
  getFirstPlayerId(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room || room.players.size === 0) return null;
    
    const players = Array.from(room.players.values());
    // Sort by joinedAt to get the first player
    players.sort((a, b) => a.joinedAt - b.joinedAt);
    return players[0].id;
  }

  // Update quiz settings
  updateQuizSettings(roomCode, settings) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    room.quizSettings = { ...room.quizSettings, ...settings };
    return room.quizSettings;
  }

  // Confirm quiz settings and move to CONFIG state
  confirmQuizSettings(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    room.quizSettings.configReady = true;
    return true;
  }

  // Change room state
  setRoomState(roomCode, newState) {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    const validStates = ['WAITING', 'CONFIG', 'PLAYING', 'FINISHED'];
    if (!validStates.includes(newState)) return false;

    room.state = newState;
    console.log(`Room ${roomCode} state changed to: ${newState}`);
    return true;
  }

  // Check if player is host
  isHost(roomCode, playerId) {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    return room.hostPlayerId === playerId;
  }

  // Get quiz settings
  getQuizSettings(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    return room.quizSettings;
  }
}

export default RoomManager;