
import React, { useEffect, useState } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { generateSpyWord } from '../../../services/gemini';
import { broadcast } from '../../../services/broadcast';

const WhoIsTheSpy: React.FC<{ gameState: GameState, updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [phase, setPhase] = useState<'SETUP' | 'DISCUSS' | 'VOTE' | 'REVEAL'>('SETUP');
  const [votes, setVotes] = useState<Record<string, string>>({});
  const requiredVotes = Math.max(0, gameState.players.length - 1);

  useEffect(() => {
    if (gameState.players.length === 0) return;
    generateSpyWord().then(word => {
      const spyIdx = Math.floor(Math.random() * gameState.players.length);
      const playersWithRoles = gameState.players.map((p, i) => ({
        ...p,
        role: i === spyIdx ? 'SPY' : 'NORMAL',
        gameWord: i === spyIdx ? 'You are the SPY!' : word
      }));
      
      updateGameState((p: GameState) => ({ 
        ...p, 
        players: playersWithRoles,
        gameData: { type: 'SPY_ROLES' } 
      }));
      setPhase('DISCUSS');
    });
  }, []);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'VOTE') {
        setVotes(v => ({ ...v, [msg.senderId]: msg.payload.targetId }));
      }
    });
    return () => unsub();
  }, []);

  if (gameState.players.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-black">WAITING FOR PLAYERS...</h1>
          <p className="text-slate-400 text-2xl">Spy mode will begin as soon as the room fills up.</p>
        </div>
      </div>
    );
  }

  const startVoting = () => {
    setPhase('VOTE');
    updateGameState((p: any) => ({ ...p, gameData: { type: 'SPY_VOTE' } }));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
       {phase === 'DISCUSS' && (
         <div className="space-y-12">
           <h1 className="text-8xl font-black italic">DISCUSSION PHASE</h1>
           <p className="text-4xl text-slate-400 max-w-4xl mx-auto">
             Everyone has received their word. Talk and find out who describes their word strangely.
           </p>
           <button onClick={startVoting} className="px-12 py-6 bg-purple-600 rounded-2xl text-3xl font-black animate-pulse">
             START VOTING
           </button>
         </div>
       )}
       {phase === 'VOTE' && (
         <div className="space-y-8">
            <h1 className="text-7xl font-black">VOTING IN PROGRESS...</h1>
            <div className="flex gap-4">
              {gameState.players.map(p => (
                <div key={p.id} className={`p-4 rounded-xl border-2 ${votes[p.id] ? 'border-green-500' : 'border-slate-800 opacity-30'}`}>
                  {p.name}
                </div>
              ))}
            </div>
            {Object.keys(votes).length >= requiredVotes && (
              <button onClick={() => setPhase('REVEAL')} className="px-12 py-6 bg-white text-black rounded-2xl text-2xl font-black">
                 REVEAL SPY
              </button>
            )}
         </div>
       )}
       {phase === 'REVEAL' && (
         <div className="space-y-12 animate-in slide-in-from-bottom duration-1000">
           <h1 className="text-9xl font-black text-purple-500">THE SPY WAS</h1>
           <div className="text-8xl font-black underline">
             {gameState.players.find(p => p.role === 'SPY')?.name}
           </div>
           <button onClick={() => updateGameState((p: any) => ({ ...p, currentView: 'RESULTS' }))} className="px-12 py-6 bg-slate-900 rounded-2xl text-2xl font-black">
             FINISH
           </button>
         </div>
       )}
    </div>
  );
};

export default WhoIsTheSpy;
