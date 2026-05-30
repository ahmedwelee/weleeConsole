
import React, { useEffect, useState } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const DuelGame: React.FC<{ gameState: GameState, updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [word, setWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [winner, setWinner] = useState<string | null>(null);

  const words = ['ALGORITHM', 'QUANTUM', 'NEURAL', 'GALAXY', 'DYNAMICS', 'REACTION', 'CONSOLE', 'MULTIPLAYER'];

  useEffect(() => {
    const w = words[Math.floor(Math.random() * words.length)];
    setWord(w);
    setScrambled(w.split('').sort(() => Math.random() - 0.5).join(''));
    
    updateGameState((p: any) => ({ ...p, gameData: { type: 'DUEL_INIT' } }));
  }, []);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'DUEL_GUESS') {
        if (msg.payload.guess.toUpperCase() === word && !winner) {
          setWinner(msg.senderId);
          updateGameState((p: GameState) => ({
            ...p,
            players: p.players.map(pl => pl.id === msg.senderId ? { ...pl, score: pl.score + 1000 } : pl)
          }));
          setTimeout(() => updateGameState((p: GameState) => ({ ...p, currentView: 'RESULTS' })), 3000);
        }
      }
    });
    return () => unsub();
  }, [word, winner]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12">
      <h1 className="text-4xl font-bold text-slate-400">UNSCRAMBLE THE WORD</h1>
      <div className="flex gap-4">
        {scrambled.split('').map((char, i) => (
          <div key={i} className="w-24 h-32 bg-slate-800 rounded-2xl flex items-center justify-center text-6xl font-black border-b-8 border-slate-900">
            {char}
          </div>
        ))}
      </div>
      {winner && (
        <div className="text-5xl font-black text-green-500 animate-bounce">
          {gameState.players.find(p => p.id === winner)?.name} GOT IT!
        </div>
      )}
    </div>
  );
};

export default DuelGame;
