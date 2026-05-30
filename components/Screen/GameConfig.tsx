import React, { useState } from 'react';
import { GameType } from '../../types';
import { Play } from 'lucide-react';

interface GameConfigProps {
  game: GameType | null;
  onStart: (config: any) => void;
}

const GameConfig: React.FC<GameConfigProps> = ({ game, onStart }) => {
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState('Medium');

  const languages = ['English', 'French', 'Arabic'];
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];

  const handleStart = () => {
    onStart({ language, difficulty });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black mb-4 italic tracking-tighter">CONFIGURE {game?.toUpperCase()}</h1>
        <p className="text-slate-400 text-lg">You are the HOST - Set up the game!</p>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Language Selection */}
        <div className="space-y-4">
          <label className="text-2xl font-bold text-cyan-400">Select Language</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`py-3 px-4 rounded-xl font-bold transition-all ${
                  language === lang
                    ? 'bg-cyan-500 text-black scale-105 shadow-lg shadow-cyan-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-4">
          <label className="text-2xl font-bold text-purple-400">Select Difficulty</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`py-3 px-4 rounded-xl font-bold transition-all ${
                  difficulty === diff
                    ? 'bg-purple-500 text-white scale-105 shadow-lg shadow-purple-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="flex items-center gap-3 px-16 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-2xl rounded-full hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30"
      >
        <Play size={32} />
        START GAME
      </button>
    </div>
  );
};

export default GameConfig;
