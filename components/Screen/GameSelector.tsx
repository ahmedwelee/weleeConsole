import React from 'react';
import { GameType } from '../../types';
import { Brain, Zap, Bomb, Ghost, Rocket, Moon, Flag } from 'lucide-react';

interface GameSelectorProps {
  onSelect: (game: GameType) => void;
  isHost: boolean;
}

const GameSelector: React.FC<GameSelectorProps> = ({ onSelect, isHost }) => {
  const games = [
    { type: GameType.QUIZ_BATTLE, name: 'Quiz Battle', desc: 'Host picks difficulty & language', icon: <Brain />, color: '#3b82f6' },
    { type: GameType.RACE_TAP, name: 'Race Tap', desc: 'Rapid tap to victory', icon: <Rocket />, color: '#ef4444' },
    { type: GameType.SOUND_REACTION, name: 'Sound Reaction', desc: 'Listen for the right beep', icon: <Zap />, color: '#eab308' },
    { type: GameType.HOT_POTATO, name: 'Hot Potato', desc: 'Pass the bomb, stay alive', icon: <Bomb />, color: '#f97316' },
    { type: GameType.WHO_IS_THE_SPY, name: 'Who is the Spy', desc: 'Find the traitor among you', icon: <Ghost />, color: '#8b5cf6' },
    { type: GameType.WEREWOLF, name: 'Werewolf', desc: 'Social deduction game - Find the wolves!', icon: <Moon />, color: '#8b5cf6' },
    { type: GameType.STK_COMPANION, name: 'SuperTuxKart Mode', desc: 'Companion race room for STK', icon: <Flag />, color: '#10b981' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-black mb-8 italic tracking-tighter">SELECT GAME</h1>
      {!isHost && <div className="mb-8 text-2xl font-bold text-slate-400 animate-pulse">Waiting for host to select...</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {games.map((g) => (
          <button
            key={g.type}
            onClick={() => isHost && onSelect(g.type)}
            className={`group relative p-8 bg-slate-900 border-2 rounded-3xl text-left transition-all ${
              isHost ? 'hover:scale-105 border-slate-800 hover:border-white' : 'border-slate-800 opacity-60 cursor-default'
            }`}
          >
            <div className="mb-4" style={{ color: g.color }}>
              {React.cloneElement(g.icon as any, { size: 40 })}
            </div>
            <h2 className="text-2xl font-black mb-1">{g.name}</h2>
            <p className="text-sm text-slate-500">{g.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameSelector;
