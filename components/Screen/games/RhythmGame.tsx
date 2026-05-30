
import React, { useEffect, useRef, useState } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const RhythmGame: React.FC<{ gameState: GameState, updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [activeButton, setActiveButton] = useState<number>(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(15);
  const scoresRef = useRef<Record<string, number>>({});
  const finishedRef = useRef(false);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveButton(Math.floor(Math.random() * 4));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timer);
          finish();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'TAP') {
        if (msg.payload.btn === activeButton) {
          setScores(prev => ({ ...prev, [msg.payload.playerId]: (prev[msg.payload.playerId] || 0) + 50 }));
        }
      }
    });
    return () => unsub();
  }, [activeButton]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    updateGameState((p: GameState) => ({
      ...p,
      players: p.players.map(pl => ({ ...pl, score: pl.score + (scoresRef.current[pl.id] || 0) })),
      currentView: 'RESULTS'
    }));
  };

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12">
      <h1 className="text-6xl font-black">MASH THE COLOR!</h1>
      <div className="text-4xl font-mono">{timeLeft}s</div>
      
      <div className={`w-64 h-64 rounded-full transition-colors duration-200 border-8 border-white ${colors[activeButton]} shadow-2xl`}>
         <div className="w-full h-full rounded-full bg-white/20 animate-ping" />
      </div>

      <div className="flex gap-12">
        {gameState.players.map(p => (
          <div key={p.id} className="text-center">
            <div className="text-2xl font-bold mb-2">{p.name}</div>
            <div className="text-4xl font-black text-cyan-400">{(scores[p.id] || 0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RhythmGame;
