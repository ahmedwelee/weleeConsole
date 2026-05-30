import React, { useEffect, useState } from 'react';
import { GameState, GameType } from '../../types';
import Lobby from './Lobby';
import GameSelector from './GameSelector';
import GameConfig from './GameConfig';
import QuizBattle from './games/QuizBattle';
import RaceTap from './games/RaceTap';
import SoundReaction from './games/SoundReaction';
import HotPotato from './games/HotPotato';
import WhoIsTheSpy from './games/WhoIsTheSpy';
import WerewolfGame from './games/WerewolfGame';
import STKCompanionGame from './games/STKCompanionGame';
import { Menu, Home, Gamepad2, X } from 'lucide-react';

interface ScreenViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  myId: string;
  syncToControllers: (state: GameState) => void;
  syncEnabled: boolean;
}

const ScreenView: React.FC<ScreenViewProps> = ({ gameState, setGameState, syncToControllers, syncEnabled }) => {
  const [showMenu, setShowMenu] = useState(false);

  const updateGameState = (updater: (prev: GameState) => GameState) => {
    setGameState(prev => updater(prev));
  };

  useEffect(() => {
    if (!syncEnabled) return;
    syncToControllers(gameState);
  }, [gameState, syncToControllers, syncEnabled]);

  const handleChangeGame = () => {
    updateGameState(p => ({ ...p, currentView: 'GAME_SELECT', activeGame: null }));
    setShowMenu(false);
  };

  const handleGoHome = () => {
    updateGameState(p => ({ ...p, currentView: 'LOBBY', activeGame: null, gameData: null }));
    setShowMenu(false);
  };

  const handleGameSelect = (game: GameType) => {
    // Werewolf, STK companion and Race Tap do not require config.
    if (game === GameType.WEREWOLF || game === GameType.STK_COMPANION || game === GameType.RACE_TAP) {
      updateGameState(prev => ({
        ...prev,
        currentView: 'PLAYING',
        activeGame: game,
        gameData: game === GameType.STK_COMPANION
          ? {
              phase: 'SETUP',
              lapGoal: 3,
              trackName: 'Zen Garden',
              lapProgress: prev.players.reduce((acc: Record<string, number>, p) => {
                acc[p.id] = 0;
                return acc;
              }, {})
            }
          : prev.gameData
      }));
    } else {
      // Other games need configuration
      updateGameState(prev => ({
        ...prev,
        currentView: 'CONFIG',
        activeGame: game
      }));
    }
  };

  // Player #1 (first in array) is always the host
  const isHost = gameState.players.length > 0 && gameState.players[0].id;

  const renderActiveGame = () => {
    switch (gameState.activeGame) {
      case GameType.QUIZ_BATTLE: return <QuizBattle gameState={gameState} updateGameState={updateGameState} />;
      case GameType.RACE_TAP: return <RaceTap gameState={gameState} updateGameState={updateGameState} />;
      case GameType.SOUND_REACTION: return <SoundReaction gameState={gameState} updateGameState={updateGameState} />;
      case GameType.HOT_POTATO: return <HotPotato gameState={gameState} updateGameState={updateGameState} />;
      case GameType.WHO_IS_THE_SPY: return <WhoIsTheSpy gameState={gameState} updateGameState={updateGameState} />;
      case GameType.WEREWOLF: return <WerewolfGame gameState={gameState} updateGameState={updateGameState} />;
      case GameType.STK_COMPANION: return <STKCompanionGame gameState={gameState} updateGameState={updateGameState} />;
      default: return null;
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-auto relative text-white font-sans">
      {/* Menu Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors border border-slate-700 hover:border-cyan-500"
          title="Menu"
        >
          {showMenu ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-16 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden w-56 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={handleChangeGame}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-800 transition-colors border-b border-slate-700"
            >
              <Gamepad2 size={20} className="text-cyan-400" />
              <span className="font-bold">Change Game</span>
            </button>
            <button
              onClick={handleGoHome}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-800 transition-colors"
            >
              <Home size={20} className="text-purple-400" />
              <span className="font-bold">Exit to Home</span>
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 w-full min-h-full p-8 flex flex-col">
        {gameState.currentView === 'LOBBY' && (
          <Lobby gameState={gameState} onStart={() => updateGameState(p => ({ ...p, currentView: 'GAME_SELECT' }))} />
        )}

        {gameState.currentView === 'GAME_SELECT' && (
          <GameSelector isHost={true} onSelect={handleGameSelect} />
        )}

        {gameState.currentView === 'CONFIG' && (
          <GameConfig
            game={gameState.activeGame}
            onStart={(config) => {
              updateGameState(p => ({ ...p, currentView: 'PLAYING', config }));
            }}
          />
        )}

        {gameState.currentView === 'PLAYING' && renderActiveGame()}

        {gameState.currentView === 'RESULTS' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-500">
            <h1 className="text-8xl font-black italic tracking-tighter">GAME OVER</h1>
            <div className="flex items-end gap-6 h-64">
               {[...gameState.players].sort((a, b) => b.score - a.score).map((p, i) => (
                 <div key={p.id} className="flex flex-col items-center">
                    <div className="text-2xl font-bold mb-2">{p.name}</div>
                    <div className="w-32 rounded-t-2xl transition-all duration-1000" 
                         style={{ backgroundColor: p.color, height: `${250 - i * 60}px` }}>
                      <div className="h-full flex items-center justify-center text-5xl font-black">#{i+1}</div>
                    </div>
                    <div className="mt-4 text-3xl font-mono">{p.score}</div>
                 </div>
               ))}
            </div>
            <button 
              onClick={() => updateGameState(p => ({ ...p, currentView: 'GAME_SELECT', activeGame: null }))}
              className="px-12 py-5 bg-white text-black font-black text-2xl rounded-2xl hover:scale-110 transition-transform"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenView;
