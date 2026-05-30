
import React from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const PotatoController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const pass = () => {
    broadcast.send('CONTROLLER_INPUT', { action: 'PASS' }, myId);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center">
      <button
        onClick={pass}
        className="w-full h-1/2 bg-orange-600 rounded-3xl text-4xl font-black text-white active:scale-90 transition-transform"
      >
        PASS BOMB
      </button>
      <div className="mt-12 text-slate-500 font-bold uppercase tracking-widest animate-pulse">
        Don't let it explode on you!
      </div>
    </div>
  );
};

export default PotatoController;
