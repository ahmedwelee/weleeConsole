
import React, { useEffect, useState } from 'react';
import { GameState, TriviaQuestion, BroadcastMessage } from '../../../types';
import { generateQuizBattle } from '../../../services/gemini';
import { broadcast } from '../../../services/broadcast';

const QuizBattle: React.FC<{ gameState: GameState, updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timer, setTimer] = useState(15);
  const [loading, setLoading] = useState(true);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { choice: number, time: number }>>({});
  const answersRef = React.useRef<Record<string, { choice: number, time: number }>>({});
  const questionsRef = React.useRef<TriviaQuestion[]>([]);
  const currentIdxRef = React.useRef(0);
  const revealLockRef = React.useRef(false);
  const participatingPlayers = React.useMemo(
    () => gameState.players.filter(p => p.id !== gameState.hostId),
    [gameState.players, gameState.hostId]
  );

   useEffect(() => {
     if (gameState.config) {
       generateQuizBattle(gameState.config.language, gameState.config.difficulty).then(q => {
         setQuestions(q);
         questionsRef.current = q;
         setLoading(false);
         updateGameState((p: any) => ({
           ...p,
           gameData: {
             type: 'QUIZ',
             phase: 'QUESTION',
             q: q[0],
             idx: 0,
             total: q.length,
             results: {}
           }
         }));
         // Broadcast question to all controllers via BOTH channels
         const questionPayload = {
           action: 'QUIZ_QUESTION', 
           question: q[0].question,
           options: q[0].options,
           questionIdx: 0,
           totalQuestions: q.length
         };
         broadcast.send('SCREEN_EVENT', questionPayload, 'SCREEN');
       });
     }
   }, [gameState.config]);

  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT' && msg.payload.action === 'QUIZ_ANS' && !showingAnswer) {
        setAnswers(prev => {
          const next = { ...prev, [msg.payload.playerId]: { choice: msg.payload.choice, time: timer } };
          answersRef.current = next;
          return next;
        });
      }
    });
    return () => unsub();
  }, [timer, showingAnswer]);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

   useEffect(() => {
     if (loading || showingAnswer) return;

     const allAnswered = participatingPlayers.length > 0 && participatingPlayers.every(p => answersRef.current[p.id] !== undefined);
     if (allAnswered && !revealLockRef.current) {
       reveal();
       return;
     }

     const interval = setInterval(() => {
       setTimer(t => {
         const newTimer = t - 0.1;
         
         // Check if all players have answered
         const allAnsweredNow = participatingPlayers.length > 0 && participatingPlayers.every(p => answersRef.current[p.id] !== undefined);
         
         // Reveal immediately if all answered OR timer reaches 0
         if (newTimer <= 0 || allAnsweredNow) {
           clearInterval(interval);
           reveal();
           return 0;
         }
         return newTimer;
       });
     }, 100);
     return () => clearInterval(interval);
   }, [loading, showingAnswer, currentIdx, answers, participatingPlayers]);

   const reveal = () => {
     if (revealLockRef.current) return;
     revealLockRef.current = true;
     setShowingAnswer(true);
     // Lock all controllers - send signal to show waiting/results
     broadcast.send('SCREEN_EVENT', { action: 'QUIZ_LOCK' }, 'SCREEN');
     
     const activeQuestion = questionsRef.current[currentIdxRef.current];
     const correct = activeQuestion
       ? (() => {
           const optionIndex = activeQuestion.correctOption
             ? activeQuestion.options.findIndex(option => option.trim() === activeQuestion.correctOption?.trim())
             : -1;
           if (optionIndex >= 0) return optionIndex;
           const fallback = Number(activeQuestion.correctAnswer);
           return Number.isFinite(fallback) && fallback >= 0 && fallback < activeQuestion.options.length ? fallback : 0;
         })()
       : 0;
     const roundResults: Record<string, { isCorrect: boolean; points: number; correctAnswer: number; yourAnswer?: number }> = {};
     
     updateGameState((prev: GameState) => {
       const newPlayers = prev.players.map(p => {
         const ans = answersRef.current[p.id];
         const isCorrect = !!(ans && ans.choice === correct);
         const points = isCorrect ? 100 + Math.floor(ans.time * 10) : 0;
         roundResults[p.id] = {
           isCorrect,
           points,
           correctAnswer: correct,
           yourAnswer: ans?.choice
         };
         if (ans && ans.choice === correct) {
           // Base 100 + speed bonus (remaining time * 10)
           const bonus = Math.floor(ans.time * 10);
           return { ...p, score: p.score + 100 + bonus };
         }
         return p;
       });
       return {
         ...prev,
         players: newPlayers,
         gameData: {
           ...(prev.gameData || {}),
           type: 'QUIZ',
           phase: 'RESULT',
           idx: currentIdxRef.current,
           total: questionsRef.current.length,
           q: activeQuestion,
           correctAnswer: correct,
           results: roundResults
         }
       };
     });

     // Send feedback to each player showing correct answer and their answer via BOTH channels
     participatingPlayers.forEach(p => {
       const playerAnswer = answersRef.current[p.id];
       const isCorrect = playerAnswer && playerAnswer.choice === correct;
       const points = (playerAnswer && playerAnswer.choice === correct) ? (100 + Math.floor(playerAnswer.time * 10)) : 0;
       
       const resultPayload = { 
         action: 'QUIZ_RESULT', 
         playerId: p.id,
         questionIdx: currentIdxRef.current,
         correctAnswer: correct,
         playerAnswer: playerAnswer?.choice,
         isCorrect,
         points
       };
       
       // Send via broadcast (for same-browser web players)
       broadcast.send('SCREEN_EVENT', resultPayload, 'SCREEN');
       
     });

     setTimeout(() => {
       const nextIdx = currentIdxRef.current + 1;
       if (nextIdx < questionsRef.current.length) {
         setShowingAnswer(false);
         revealLockRef.current = false;
         currentIdxRef.current = nextIdx;
         setCurrentIdx(nextIdx);
         setTimer(15);
         answersRef.current = {};
         setAnswers({});
         const nextQ = questionsRef.current[nextIdx];
         updateGameState((p: any) => ({
           ...p,
           gameData: {
             type: 'QUIZ',
             phase: 'QUESTION',
             q: nextQ,
             idx: nextIdx,
             total: questionsRef.current.length,
             results: {}
           }
         }));
         // Broadcast next question to all controllers via BOTH channels
         const questionPayload = { 
           action: 'QUIZ_QUESTION', 
           question: nextQ.question,
           options: nextQ.options,
           questionIdx: nextIdx,
           totalQuestions: questionsRef.current.length
         };
         broadcast.send('SCREEN_EVENT', questionPayload, 'SCREEN');
       } else {
         updateGameState((p: any) => ({ ...p, currentView: 'RESULTS' }));
       }
     }, 3500);
   };

  if (loading) return <div className="flex-1 flex items-center justify-center text-4xl font-black">LOADING AI QUIZ...</div>;

  const q = questions[currentIdx];
  return (
    <div className="flex-1 flex flex-col p-8 space-y-12">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div className="text-2xl font-black text-slate-400">QUESTION {currentIdx + 1}/20</div>
        <div className={`text-6xl font-black font-mono ${timer < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {timer.toFixed(1)}s
        </div>
      </div>

      <h1 className="text-6xl font-black text-center leading-tight py-12">{q.question}</h1>

      <div className="grid grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        {q.options.map((opt, i) => {
          const isCorrect = showingAnswer && i === q.correctAnswer;
          const label = ['A', 'B', 'C', 'D'][i];
          return (
            <div key={i} className={`p-8 rounded-3xl text-3xl font-bold flex items-center gap-6 border-4 transition-all ${
              isCorrect ? 'bg-green-600 border-green-400 scale-105' : 
              showingAnswer ? 'bg-slate-900 border-slate-800 opacity-30' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">{label}</div>
              {opt}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4 mt-auto">
        {gameState.players.map(p => (
          <div key={p.id} className="bg-slate-900 p-4 rounded-2xl flex items-center gap-4">
             <div className="w-12 h-12 rounded-full" style={{ backgroundColor: p.color }} />
             <div>
               <div className="font-bold truncate">{p.name}</div>
               <div className="text-cyan-400 font-mono text-xl">{p.score}</div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizBattle;
