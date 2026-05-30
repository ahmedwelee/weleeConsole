
import React, { useState } from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const DuelController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      broadcast.send('CONTROLLER_INPUT', { action: 'DUEL_GUESS', guess }, myId);
      setGuess('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col justify-center">
      <h2 className="text-center text-slate-400 font-bold mb-8 uppercase">Type the Word</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder="ENTER WORD..."
          className="w-full bg-slate-800 border-4 border-slate-700 p-6 text-3xl font-black text-center rounded-3xl outline-none focus:border-purple-500 transition-all uppercase"
          autoFocus
        />
        <button type="submit" className="w-full bg-purple-600 p-6 rounded-3xl text-2xl font-black">
          SUBMIT
        </button>
      </form>
    </div>
  );
};

export default DuelController;
