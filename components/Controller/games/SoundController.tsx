
import React, { useEffect, useState } from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const SoundController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setDisabled(false);
  }, [gameState.gameData?.type]);

  const react = () => {
    if (disabled) return;
    broadcast.send('CONTROLLER_INPUT', { action: 'REACT' }, myId);
    setDisabled(true);
    setTimeout(() => setDisabled(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <button
        onClick={react}
        disabled={disabled}
        className={`w-full h-full rounded-[4rem] text-5xl font-black text-white transition-all ${
          disabled ? 'bg-slate-800 opacity-50' : 'bg-yellow-500'
        }`}
      >
        {disabled ? 'LOCKED' : 'REACT!'}
      </button>
    </div>
  );
};

export default SoundController;
