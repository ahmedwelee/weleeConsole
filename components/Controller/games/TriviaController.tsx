
import React, { useEffect, useState } from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const TriviaController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const data = gameState.gameData;

  useEffect(() => {
    setSelected(null);
  }, [data?.current, data?.q?.question]);

  const handleSelect = (idx: number) => {
    setSelected(idx);
    broadcast.send('CONTROLLER_INPUT', { action: 'ANSWER_TRIVIA', choice: idx }, myId);
  };

  if (!data || data.type !== 'TRIVIA_QUESTION') return <div className="p-8 text-center font-bold">Waiting for question...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col gap-4">
      <div className="text-center py-4">
        <div className="text-slate-400 font-bold uppercase tracking-widest">Question {data.current + 1}</div>
      </div>
      <div className="grid grid-cols-1 gap-4 flex-1">
        {data.q.options.map((opt: string, i: number) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={selected !== null}
            className={`p-6 rounded-2xl text-xl font-bold transition-all border-4 text-left ${
              selected === i 
              ? 'bg-cyan-500 border-cyan-300 scale-95 shadow-inner' 
              : selected !== null 
              ? 'bg-slate-800 border-slate-700 opacity-50'
              : 'bg-slate-800 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">{i + 1}</span>
              {opt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TriviaController;
