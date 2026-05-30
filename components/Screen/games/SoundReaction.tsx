
import React, { useEffect, useRef, useState } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const SoundReaction: React.FC<{ gameState: GameState, updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [state, setState] = useState<'WAITING' | 'READY' | 'GO' | 'RESULT'>('WAITING');
  const [winner, setWinner] = useState<string | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const winnerRef = useRef<string | null>(null);
  const goTimeoutRef = useRef<number | null>(null);
  const resultTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    return () => {
      if (goTimeoutRef.current) window.clearTimeout(goTimeoutRef.current);
      if (resultTimeoutRef.current) window.clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  const playBeep = (freq: number) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.current.currentTime + 0.5);
    setTimeout(() => osc.stop(), 500);
  };

  useEffect(() => {
    const nextRound = () => {
      setState('READY');
      const delay = Math.random() * 5000 + 2000;
      goTimeoutRef.current = window.setTimeout(() => {
        setState('GO');
        playBeep(880); // Success beep
        resultTimeoutRef.current = window.setTimeout(() => {
          if (!winnerRef.current) {
            setState('RESULT');
            updateGameState((p: GameState) => ({ ...p, currentView: 'RESULTS' }));
          }
        }, 5000);
      }, delay);
    };
    nextRound();
  }, []);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'REACT') {
        if (state === 'GO' && !winnerRef.current) {
          setWinner(msg.senderId);
          setState('RESULT');
          if (resultTimeoutRef.current) window.clearTimeout(resultTimeoutRef.current);
          updateGameState((p: GameState) => ({
            ...p,
            players: p.players.map(pl => pl.id === msg.senderId ? { ...pl, score: pl.score + 500 } : pl)
          }));
          setTimeout(() => updateGameState((p: GameState) => ({ ...p, currentView: 'RESULTS' })), 3000);
        }
      }
    });
    return () => unsub();
  }, [state, winner]);

  return (
    <div className={`flex-1 flex items-center justify-center transition-colors duration-100 ${state === 'GO' ? 'bg-cyan-500' : 'bg-slate-950'}`}>
      <div className="text-center">
        {state === 'READY' && <h1 className="text-6xl font-black animate-pulse opacity-50">SHHH... LISTEN...</h1>}
        {state === 'GO' && <h1 className="text-9xl font-black animate-bounce">NOW!</h1>}
        {state === 'RESULT' && (
          <div className="space-y-4">
             <h2 className="text-4xl font-bold">REACTION WINNER:</h2>
             <h1 className="text-8xl font-black" style={{ color: winner ? gameState.players.find(p => p.id === winner)?.color : '#eab308' }}>
                {winner ? gameState.players.find(p => p.id === winner)?.name : 'NO WINNER'}
             </h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundReaction;
