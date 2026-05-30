
import React from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const RhythmController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const handleTap = (btn: number) => {
    broadcast.send('CONTROLLER_INPUT', { action: 'TAP', btn }, myId);
    // Simple feedback haptic if supported
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const colors = [
    'bg-red-500 active:bg-red-600',
    'bg-blue-500 active:bg-blue-600',
    'bg-green-500 active:bg-green-600',
    'bg-yellow-500 active:bg-yellow-600'
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-4 grid grid-cols-2 grid-rows-2 gap-4">
      {colors.map((c, i) => (
        <button
          key={i}
          onClick={() => handleTap(i)}
          className={`${c} rounded-[3rem] shadow-2xl transition-transform active:scale-90 border-t-8 border-white/20`}
        />
      ))}
    </div>
  );
};

export default RhythmController;
