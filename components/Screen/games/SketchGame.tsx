
import React, { useEffect, useRef, useState } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { generateSketchPrompt, speakMessage } from '../../../services/gemini';
import { broadcast } from '../../../services/broadcast';

interface SketchGameProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
}

const SketchGame: React.FC<SketchGameProps> = ({ gameState, updateGameState }) => {
  const [prompt, setPrompt] = useState('');
  const [timeLeft, setTimeLeft] = useState(45);
  const [submissions, setSubmissions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const submissionsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    submissionsRef.current = submissions;
  }, [submissions]);

  useEffect(() => {
    const init = async () => {
      const p = await generateSketchPrompt();
      setPrompt(p);
      setLoading(false);
      updateGameState(prev => ({ ...prev, gameData: { type: 'SKETCH_PROMPT', prompt: p } }));
      speakMessage(`Draw: ${p}. You have 45 seconds!`);
    };
    init();
  }, []);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'SUBMIT_SKETCH') {
        setSubmissions(prev => {
          const next = { ...prev, [msg.payload.playerId]: msg.payload.imageData };
          submissionsRef.current = next;
          return next;
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const finishGame = () => {
    // For demo purposes, we randomly score based on participation
    // Real app could use Gemini-3-Vision to rate drawings
    updateGameState(prev => {
      const newPlayers = prev.players.map(p => {
        if (submissionsRef.current[p.id]) return { ...p, score: p.score + 500 };
        return p;
      });
      return { ...prev, players: newPlayers };
    });

    setTimeout(() => {
       updateGameState(prev => ({ ...prev, currentView: 'RESULTS' }));
    }, 5000);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-4xl">Thinking of something for you to draw...</div>;

  return (
    <div className="flex-1 flex flex-col space-y-8">
      <div className="text-center">
        <h2 className="text-3xl text-slate-400 uppercase font-bold mb-4">YOUR PROMPT:</h2>
        <h1 className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">
          {prompt.toUpperCase()}
        </h1>
        <div className="text-5xl font-mono mt-8">{timeLeft}s</div>
      </div>

      <div className="grid grid-cols-4 gap-6 flex-1 px-12">
        {gameState.players.map(p => (
          <div key={p.id} className="bg-white/5 rounded-3xl border-2 border-slate-800 p-4 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
              <div className="font-bold text-xl">{p.name}</div>
              {submissions[p.id] && <div className="ml-auto text-green-500 font-bold uppercase text-xs">Submitted</div>}
            </div>
            <div className="flex-1 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-700">
              {submissions[p.id] ? (
                <img src={submissions[p.id]} alt="drawing" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700">
                  <span className="animate-pulse">DRAWING...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SketchGame;
