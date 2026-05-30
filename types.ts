export type AppRole = 'SCREEN' | 'CONTROLLER';

export enum GameType {
  QUIZ_BATTLE = 'QUIZ_BATTLE',
  RACE_TAP = 'RACE_TAP',
  SOUND_REACTION = 'SOUND_REACTION',
  HOT_POTATO = 'HOT_POTATO',
  WHO_IS_THE_SPY = 'WHO_IS_THE_SPY',
  WEREWOLF = 'WEREWOLF',
  STK_COMPANION = 'STK_COMPANION'
}

// Werewolf Game Types
export enum WerewolfRole {
  // Village Team
  VILLAGER = 'VILLAGER',
  SEER = 'SEER',
  DOCTOR = 'DOCTOR',
  HUNTER = 'HUNTER',
  WITCH = 'WITCH',
  CUPID = 'CUPID',
  MAYOR = 'MAYOR',
  LITTLE_GIRL = 'LITTLE_GIRL',
  TAVERN_KEEPER = 'TAVERN_KEEPER',
  INVESTIGATOR = 'INVESTIGATOR',
  FOOL = 'FOOL',
  KNIGHT = 'KNIGHT',
  ELDER = 'ELDER',

  // Werewolf Team
  WEREWOLF = 'WEREWOLF',
  ALPHA_WOLF = 'ALPHA_WOLF',
  WOLF_SEER = 'WOLF_SEER',
  YOUNG_WOLF = 'YOUNG_WOLF',
  HIDDEN_WOLF = 'HIDDEN_WOLF',
  HYPNOTIST_WOLF = 'HYPNOTIST_WOLF',

  // Independent Roles
  TANNER = 'TANNER',
  WHITE_WEREWOLF = 'WHITE_WEREWOLF',
  SERIAL_KILLER = 'SERIAL_KILLER',
  REPENTANT_WEREWOLF = 'REPENTANT_WEREWOLF',
  PIED_PIPER = 'PIED_PIPER',
  THIEF = 'THIEF',
  SOUL_COLLECTOR = 'SOUL_COLLECTOR'
}

export enum GamePhase {
  NIGHT = 'NIGHT',
  DAY = 'DAY',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS'
}

export interface WerewolfPlayer extends Player {
  role?: WerewolfRole;
  team?: 'VILLAGE' | 'WEREWOLF' | 'INDEPENDENT';
  isAlive: boolean;
  abilities: {
    seer?: boolean;
    protection?: boolean;
    vote?: number; // 1 or 2
    investigated?: string[];
  };
  lovers?: string[]; // IDs of lovers (Cupid)
}

export interface WerewolfGameData {
  phase: GamePhase;
  day: number;
  nightActions: Record<string, any>;
  votes: Record<string, string>; // playerId -> votedFor
  eliminated: string[];
  alive: string[];
  roles: Record<string, WerewolfRole>;
  teams: Record<string, 'VILLAGE' | 'WEREWOLF' | 'INDEPENDENT'>;
  winner?: 'VILLAGE' | 'WEREWOLF' | 'INDEPENDENT' | null;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
  isConnected: boolean;
  isEliminated?: boolean;
  role?: string;
  distance?: number;
  gameWord?: string;
}

export interface GameState {
  currentView: 'LOBBY' | 'GAME_SELECT' | 'CONFIG' | 'PLAYING' | 'RESULTS';
  activeGame: GameType | null;
  players: Player[];
  roomCode: string;
  hostId?: string;
  round: number;
  gameData: any;
  config?: {
    language: 'English' | 'Arabic';
    //difficulty: 'Easy' | 'Medium' | 'Hard';
  };
}

export interface BroadcastMessage {
  type: string;
  payload: any;
  senderId: string;
  id?: string;
  timestamp?: number;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  correctOption?: string;
}
