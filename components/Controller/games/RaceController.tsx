
import React from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const RaceController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const tap = () => {
    broadcast.send('CONTROLLER_INPUT', { action: 'TAP' }, myId);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
      <button
        onClick={tap}
        className="w-80 h-80 rounded-full bg-red-600 text-8xl font-black text-white shadow-2xl active:scale-90 transition-transform flex items-center justify-center hover:bg-red-500"
        aria-label="Tap"
      >
        TAP
      </button>
    </div>
  );
};

export default RaceController;
