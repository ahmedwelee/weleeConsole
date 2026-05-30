
import React, { useEffect, useState } from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const SpyController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const [voted, setVoted] = useState(false);
  const me = gameState.players.find(p => p.id === myId);

  const vote = (targetId: string) => {
    setVoted(true);
    broadcast.send('CONTROLLER_INPUT', { action: 'VOTE', targetId }, myId);
  };

  const data = gameState.gameData;

  useEffect(() => {
    setVoted(false);
  }, [data?.type]);

  if (data?.type === 'SPY_VOTE') {
    return (
      <div className="min-h-screen bg-slate-950 p-4 space-y-4 overflow-auto text-white">
        <h2 className="text-2xl font-black text-center mb-4">WHO IS THE SPY?</h2>
        {gameState.players.filter(p => p.id !== myId).map(p => (
          <button
            key={p.id}
            onClick={() => !voted && vote(p.id)}
            disabled={voted}
            className={`w-full p-6 rounded-2xl text-xl font-bold border-2 transition-all ${
              voted ? 'opacity-30 border-slate-800' : 'bg-slate-900 border-slate-800 active:border-purple-500'
            }`}
          >
            {p.name}
          </button>
        ))}
        {voted && <div className="text-center text-green-500 font-bold uppercase tracking-widest mt-8">Vote Recorded</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-white space-y-8">
      <div className="text-center">
        <div className="text-slate-500 font-bold uppercase mb-2">Your Secret Word:</div>
        <div className="text-5xl font-black text-purple-400 bg-slate-900 px-8 py-4 rounded-3xl border-2 border-slate-800">
           {me?.gameWord}
        </div>
      </div>
      <p className="text-center text-slate-400 font-medium">
        Describe this word without being too obvious. If you are the spy, blend in!
      </p>
    </div>
  );
};

export default SpyController;
