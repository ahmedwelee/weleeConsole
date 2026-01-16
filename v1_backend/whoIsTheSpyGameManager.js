import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhoIsTheSpyGameManager {
  constructor() {
    this.games = new Map(); // roomCode -> gameState
    this.gameData = this.loadGameData();
  }

  loadGameData() {
    try {
      const dataPath = path.join(__dirname, 'whoIsTheSpyData.json');
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load Who Is The Spy data:', error);
      return { locations: [], ui_text: {} };
    }
  }

  /**
   * Create a new game for a room
   * @param {string} roomCode - Room code
   * @param {Array} players - Array of player objects
   * @param {string} language - 'en' or 'ar'
   */
  createGame(roomCode, players, language = 'en') {
    if (players.length < 3) {
      throw new Error('Need at least 3 players to start the game');
    }

    // Pick a random location
    const location = this.getRandomLocation();
    
    // Assign spy and roles
    const { spyId, assignments } = this.assignRoles(players, location, language);

    const gameState = {
      roomCode,
      location,
      language,
      spyId,
      assignments, // Map of playerId -> { role, isSpy, location }
      phase: 'REVEAL', // REVEAL -> GAMEPLAY -> VOTING -> RESULT
      timer: 300, // 5 minutes in seconds
      timerInterval: null,
      votes: new Map(), // playerId -> votedForPlayerId
      startTime: Date.now(),
      winner: null
    };

    this.games.set(roomCode, gameState);
    console.log(`✅ Who Is The Spy game created for room ${roomCode}`);
    console.log(`   Location: ${location.name_en} / ${location.name_ar}`);
    console.log(`   Spy: ${spyId}`);
    
    return gameState;
  }

  /**
   * Get a random location from the game data
   */
  getRandomLocation() {
    const locations = this.gameData.locations;
    if (locations.length === 0) {
      throw new Error('No locations available');
    }
    const randomIndex = Math.floor(Math.random() * locations.length);
    return locations[randomIndex];
  }

  /**
   * Assign roles to players (one spy, others get specific roles)
   * @param {Array} players - Array of player objects
   * @param {Object} location - Location object
   * @param {string} language - 'en' or 'ar'
   * @returns {Object} - { spyId, assignments }
   */
  assignRoles(players, location, language) {
    // Randomly select one player to be the spy
    const spyIndex = Math.floor(Math.random() * players.length);
    const spyId = players[spyIndex].id;

    const assignments = new Map();
    const roleKey = language === 'ar' ? 'roles_ar' : 'roles_en';
    const locationNameKey = language === 'ar' ? 'name_ar' : 'name_en';
    const roles = [...location[roleKey]]; // Copy array

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    players.forEach((player, index) => {
      if (player.id === spyId) {
        // Spy doesn't get location or role
        assignments.set(player.id, {
          isSpy: true,
          role: null,
          location: null
        });
      } else {
        // Civilians get location and a specific role
        const roleIndex = index % roles.length;
        assignments.set(player.id, {
          isSpy: false,
          role: roles[roleIndex],
          location: location[locationNameKey]
        });
      }
    });

    return { spyId, assignments };
  }

  /**
   * Start the game (begin timer)
   */
  startGame(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.phase = 'GAMEPLAY';
    game.startTime = Date.now();
    
    return game;
  }

  /**
   * Get game state
   */
  getGame(roomCode) {
    return this.games.get(roomCode);
  }

  /**
   * Get player assignment (role, location, isSpy)
   */
  getPlayerAssignment(roomCode, playerId) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    return game.assignments.get(playerId);
  }

  /**
   * Move to voting phase
   */
  startVoting(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.phase = 'VOTING';
    game.votes.clear();
    
    return game;
  }

  /**
   * Submit a vote
   * @param {string} roomCode - Room code
   * @param {string} voterId - Player who is voting
   * @param {string} votedForId - Player being voted for
   */
  submitVote(roomCode, voterId, votedForId) {
    const game = this.games.get(roomCode);
    if (!game) return null;
    if (game.phase !== 'VOTING') return null;

    game.votes.set(voterId, votedForId);
    
    return {
      success: true,
      totalVotes: game.votes.size
    };
  }

  /**
   * Process votes and determine winner
   * @param {string} roomCode - Room code
   * @returns {Object} - Result with winner info
   */
  processVotes(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return null;
    if (game.phase !== 'VOTING') return null;

    // Count votes
    const voteCounts = new Map();
    for (const votedForId of game.votes.values()) {
      voteCounts.set(votedForId, (voteCounts.get(votedForId) || 0) + 1);
    }

    // Find player with most votes
    let maxVotes = 0;
    let suspectIds = [];

    for (const [playerId, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        suspectIds = [playerId];
      } else if (count === maxVotes) {
        suspectIds.push(playerId);
      }
    }

    // Determine winner based on voting results
    let winner;
    let reason;

    if (suspectIds.length === 0) {
      // No votes cast - spy wins
      winner = 'SPY';
      reason = 'No votes were cast';
    } else if (suspectIds.length > 1) {
      // Tie - spy wins
      winner = 'SPY';
      reason = 'Vote was tied';
    } else {
      const suspectId = suspectIds[0];
      if (suspectId === game.spyId) {
        // Spy was voted out - civilians win
        winner = 'CIVILIANS';
        reason = 'Spy was identified';
      } else {
        // Civilian was voted out - spy wins
        winner = 'SPY';
        reason = 'A civilian was eliminated';
      }
    }

    game.phase = 'RESULT';
    game.winner = winner;

    const locationNameKey = game.language === 'ar' ? 'name_ar' : 'name_en';

    return {
      winner,
      reason,
      spyId: game.spyId,
      location: game.location[locationNameKey],
      voteCounts: Object.fromEntries(voteCounts),
      suspectIds
    };
  }

  /**
   * Reset game for another round (same players)
   */
  resetGame(roomCode, players) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    const language = game.language;
    
    // Create new game with same settings
    return this.createGame(roomCode, players, language);
  }

  /**
   * Get UI text in the current language
   */
  getUIText(roomCode, key) {
    const game = this.games.get(roomCode);
    if (!game) return '';

    const text = this.gameData.ui_text[key];
    if (!text) return key;

    return text[game.language] || text['en'] || key;
  }

  /**
   * Get all UI text for the game
   */
  getAllUIText(language = 'en') {
    const uiText = {};
    for (const [key, translations] of Object.entries(this.gameData.ui_text)) {
      uiText[key] = translations[language] || translations['en'] || key;
    }
    return uiText;
  }

  /**
   * Change language
   */
  setLanguage(roomCode, language) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.language = language;
    
    // Re-assign roles with new language
    const location = game.location;
    const players = Array.from(game.assignments.keys()).map(id => ({ id }));
    const { assignments } = this.assignRoles(players, location, language);
    
    // Keep the same spy
    game.assignments = assignments;
    
    return game;
  }

  /**
   * Update timer
   */
  updateTimer(roomCode, timeRemaining) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.timer = timeRemaining;
    return game;
  }

  /**
   * Delete game
   */
  deleteGame(roomCode) {
    return this.games.delete(roomCode);
  }
}

export default WhoIsTheSpyGameManager;
