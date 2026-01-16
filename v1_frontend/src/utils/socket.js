import { io } from 'socket.io-client';

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to server:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
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
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  /* ===================== HOST ===================== */

  createRoom(callback) {
    this.getSocket().emit('host:create-room', callback);
  }

  startGame(roomCode, gameName) {
    this.getSocket().emit('host:start-game', { roomCode, gameName });
  }

  sendGameState(roomCode, state) {
    this.getSocket().emit('host:game-state', { roomCode, state });
  }

  endGame(roomCode, finalScores) {
    this.getSocket().emit('host:end-game', { roomCode, finalScores });
  }

  /* ===================== PLAYER ===================== */

  joinRoom(roomCode, playerName, callback) {
    this.getSocket().emit(
        'player:join-room',
        { roomCode, playerName },
        callback
    );
  }

  sendInput(roomCode, playerId, input) {
    this.getSocket().emit('controller:input', {
      roomCode,
      playerId,
      input
    });
  }

  /* ===================== QUIZ ===================== */

  updateQuizSettings(roomCode, playerId, settings, callback) {
    this.getSocket().emit(
        'quiz:update-settings',
        { roomCode, playerId, settings },
        callback
    );
  }

  lockQuizSettings(roomCode, playerId, callback) {
    this.getSocket().emit(
        'quiz:lock-settings',
        { roomCode, playerId },
        callback
    );
  }

  startQuiz(roomCode, callback) {
    this.getSocket().emit('quiz:start', { roomCode }, callback);
  }

  getQuestion(roomCode, callback) {
    this.getSocket().emit(
        'quiz:get-question',
        { roomCode },
        callback
    );
  }

  submitAnswer(roomCode, playerId, answerIndex, callback) {
    this.getSocket().emit(
        'quiz:submit-answer',
        { roomCode, playerId, answerIndex },
        callback
    );
  }

  /* ===================== EVENTS ===================== */

  on(event, callback) {
    this.getSocket().on(event, callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
