import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://192.168.1.108:3000';

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