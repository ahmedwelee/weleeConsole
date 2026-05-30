
import React, { useEffect, useRef, useState } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const RaceTap: React.FC<{ gameState: GameState, updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState(60);
  const distancesRef = useRef<Record<string, number>>({});
  const finishedRef = useRef(false);

  useEffect(() => {
    distancesRef.current = distances;
  }, [distances]);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'TAP') {
        setDistances(prev => ({ ...prev, [msg.payload.playerId]: (prev[msg.payload.playerId] || 0) + 1 }));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(interval);
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    updateGameState((p: GameState) => ({
      ...p,
      players: p.players.map(pl => ({ ...pl, score: pl.score + (distancesRef.current[pl.id] || 0) * 10 })),
      currentView: 'RESULTS'
    }));
  };

  return (
    <div className="flex-1 flex flex-col p-12 relative overflow-hidden">
       <div className="text-center mb-12">
          <h1 className="text-7xl font-black italic">MASH TO WIN!</h1>
          <div className="text-5xl font-mono mt-4 text-cyan-400">{timer}s</div>
       </div>

       <div className="flex-1 space-y-6 relative border-l-8 border-r-8 border-white/10 px-8">
          {gameState.players.map((p, idx) => {
             const dist = distances[p.id] || 0;
             const progress = Math.min((dist / 100) * 100, 100);
             return (
               <div key={p.id} className="relative h-16 bg-slate-900 rounded-full border border-white/5">
                  <div className="absolute left-0 h-full rounded-full transition-all duration-100 ease-out flex items-center px-4" 
                       style={{ width: `${progress}%`, backgroundColor: p.color }}>
                     <div className="text-white font-black whitespace-nowrap drop-shadow-md">{p.name}</div>
                  </div>
                  <div className="absolute right-0 h-full px-4 flex items-center font-mono text-xl opacity-50">
                    {dist} taps
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );
};

export default RaceTap;
