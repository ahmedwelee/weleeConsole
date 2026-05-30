
import React, { useEffect, useRef, useState } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { broadcast } from '../../../services/broadcast';
import { Bomb } from 'lucide-react';

const HotPotato: React.FC<{ gameState: GameState, updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [holder, setHolder] = useState<string>('');
  const [exploded, setExploded] = useState(false);
  const holderRef = useRef<string>('');
  const finishedRef = useRef(false);

  useEffect(() => {
    holderRef.current = holder;
  }, [holder]);

  useEffect(() => {
    if (gameState.players.length === 0 || holderRef.current || finishedRef.current) return;
    setHolder(gameState.players[0].id);
    holderRef.current = gameState.players[0].id;
    const duration = Math.random() * 8000 + 5000;
    const timer = setTimeout(() => {
      setExploded(true);
      finish();
    }, duration);
    return () => clearTimeout(timer);
  }, [gameState.players]);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'PASS') {
        const others = gameState.players.filter(p => p.id !== msg.senderId);
        if (others.length === 0) return;
        const next = others[Math.floor(Math.random() * others.length)].id;
        setHolder(next);
        holderRef.current = next;
      }
    });
    return () => unsub();
  }, [gameState.players]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setTimeout(() => {
      updateGameState((p: GameState) => ({
        ...p,
        players: p.players.map(pl => pl.id !== holderRef.current ? { ...pl, score: pl.score + 1000 } : pl),
        currentView: 'RESULTS'
      }));
    }, 3000);
  };

  const currentP = gameState.players.find(p => p.id === holder);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12">
      <div className={`relative transition-all duration-300 ${exploded ? 'scale-150 rotate-12' : 'animate-bounce'}`}>
        <Bomb size={300} className={exploded ? 'text-red-600' : 'text-slate-800'} />
        {!exploded && <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500 rounded-full blur-lg animate-pulse" />}
      </div>
      
      {exploded ? (
        <h1 className="text-9xl font-black text-red-500 italic">BOOM!</h1>
      ) : (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-400 mb-4">CURRENT HOLDER:</h2>
          <div className="text-7xl font-black px-12 py-6 rounded-3xl border-4" style={{ borderColor: currentP?.color, color: currentP?.color }}>
            {currentP?.name}
          </div>
        </div>
      )}
    </div>
  );
};

export default HotPotato;
