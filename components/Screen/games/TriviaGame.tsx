
import React, { useEffect, useRef, useState } from 'react';
import { GameState, TriviaQuestion, BroadcastMessage } from '../../../types';
import { generateTriviaQuestions, speakMessage } from '../../../services/gemini';
import { broadcast } from '../../../services/broadcast';

interface TriviaGameProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
}

const TriviaGame: React.FC<TriviaGameProps> = ({ gameState, updateGameState }) => {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const answersRef = useRef<Record<string, number>>({});
  const questionsRef = useRef<TriviaQuestion[]>([]);
  const currentIdxRef = useRef(0);
  const timeLeftRef = useRef(15);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    const init = async () => {
      const themes = ['Video Games', 'Space Exploration', 'Internet Culture', 'Ancient History'];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      const q = await generateTriviaQuestions(theme);
      setQuestions(q);
      questionsRef.current = q;
      setLoading(false);
      updateGameState(prev => ({ ...prev, gameData: { type: 'TRIVIA_QUESTION', q: q[0], total: q.length, current: 0 } }));
    };
    init();
  }, []);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'ANSWER_TRIVIA') {
        setAnswers(prev => {
          const next = { ...prev, [msg.payload.playerId]: msg.payload.choice };
          answersRef.current = next;
          return next;
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading || showingAnswer) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          revealAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, currentIdx, showingAnswer]);

  const revealAnswer = () => {
    setShowingAnswer(true);
    const correct = questionsRef.current[currentIdxRef.current]?.correctAnswer ?? 0;
    const currentTimeLeft = timeLeftRef.current;
    
    // Calculate scores
    updateGameState(prev => {
      const newPlayers = prev.players.map(p => {
        if (answersRef.current[p.id] === correct) {
          return { ...p, score: p.score + (100 + currentTimeLeft * 5) };
        }
        return p;
      });
      return { ...prev, players: newPlayers };
    });

    setTimeout(() => {
      const nextIdx = currentIdxRef.current + 1;
      if (nextIdx < questionsRef.current.length) {
        setShowingAnswer(false);
        currentIdxRef.current = nextIdx;
        setCurrentIdx(nextIdx);
        setTimeLeft(15);
        timeLeftRef.current = 15;
        answersRef.current = {};
        setAnswers({});
        updateGameState(prev => ({ 
          ...prev, 
          gameData: { type: 'TRIVIA_QUESTION', q: questionsRef.current[nextIdx], total: questionsRef.current.length, current: nextIdx } 
        }));
      } else {
        updateGameState(prev => ({ ...prev, currentView: 'RESULTS' }));
      }
    }, 4000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-4xl animate-pulse font-bold">GEMINI IS GENERATING QUESTIONS...</div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="flex-1 flex flex-col p-12 space-y-12">
      <div className="flex justify-between items-center">
        <div className="text-3xl font-bold bg-slate-800 px-6 py-2 rounded-full">
          QUESTION {currentIdx + 1}/{questions.length}
        </div>
        <div className={`text-6xl font-black ${timeLeft < 5 ? 'text-red-500 animate-ping' : 'text-white'}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="text-6xl font-black text-center max-w-6xl mx-auto leading-tight">
        {q.question}
      </div>

      <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        {q.options.map((opt, i) => {
          const isCorrect = showingAnswer && i === q.correctAnswer;
          const isWrong = showingAnswer && answers[Object.keys(answers)[0]] === i && i !== q.correctAnswer;
          
          return (
            <div
              key={i}
              className={`p-10 rounded-3xl text-3xl font-bold border-4 transition-all ${
                isCorrect ? 'bg-green-500 border-green-300 scale-105' :
                isWrong ? 'bg-red-500 border-red-300 opacity-50' :
                showingAnswer ? 'bg-slate-800 border-slate-700 opacity-20' :
                'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-6">
                <span className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">{i + 1}</span>
                {opt}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(answers).filter(([_, choice]) => choice === i).map(([pid]) => {
                  const p = gameState.players.find(pl => pl.id === pid);
                  return <div key={pid} className="w-4 h-4 rounded-full" style={{ backgroundColor: p?.color }} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TriviaGame;
