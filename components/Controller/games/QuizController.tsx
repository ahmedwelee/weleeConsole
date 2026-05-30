
import React, { useState, useEffect, useRef } from 'react';
import { GameState, BroadcastMessage } from '../../../types';
import { broadcast } from '../../../services/broadcast';

const QuizController: React.FC<{ gameState: GameState, myId: string, roomCode?: string }> = ({ gameState, myId, roomCode }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; points: number; correctAnswer: number } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{ question: string; options: string[]; idx: number; total: number } | null>(null);
  const [myScore, setMyScore] = useState(0);
  const lastQuestionIdxRef = useRef<number | null>(null);
  const lastScoredQuestionIdxRef = useRef<number | null>(null);
  const roundData = gameState.gameData?.type === 'QUIZ' ? gameState.gameData : null;
  const stateRoundResult = roundData?.phase === 'RESULT' ? roundData.results?.[myId] : null;

  // Listen for question broadcasts from screen
  useEffect(() => {
    const unsub = broadcast.subscribe((msg: BroadcastMessage) => {
      if (msg.type === 'SCREEN_EVENT') {
        if (msg.payload.action === 'QUIZ_QUESTION') {
          // New question received - reset controller state
          const nextQuestionIdx = Number(msg.payload.questionIdx || 0);
          const isNewQuestion = lastQuestionIdxRef.current !== nextQuestionIdx;
          setCurrentQuestion({
            question: msg.payload.question,
            options: msg.payload.options,
            idx: msg.payload.questionIdx,
            total: msg.payload.totalQuestions
          });
          if (isNewQuestion) {
            lastQuestionIdxRef.current = nextQuestionIdx;
            setSelected(null);
            setIsLocked(false);
            setResult(null);
          }
        } else if (msg.payload.action === 'QUIZ_LOCK') {
          // Controller locked - disable further input
          setIsLocked(true);
        } else if (msg.payload.action === 'QUIZ_RESULT' && msg.payload.playerId === myId) {
          // Result for this player
          setResult({
            isCorrect: msg.payload.isCorrect,
            points: msg.payload.points,
            correctAnswer: msg.payload.correctAnswer
          });
          if (msg.payload.isCorrect && lastScoredQuestionIdxRef.current !== msg.payload.questionIdx) {
            lastScoredQuestionIdxRef.current = msg.payload.questionIdx;
            setMyScore(prev => prev + msg.payload.points);
          }
        }
      }
    });
    return () => unsub();
  }, [myId]);

  useEffect(() => {
    if (roundData?.phase === 'QUESTION' && roundData.q) {
      const nextQuestionIdx = Number(roundData.idx || 0);
      const isNewQuestion = lastQuestionIdxRef.current !== nextQuestionIdx;

      if (isNewQuestion) {
        lastQuestionIdxRef.current = nextQuestionIdx;
        setSelected(null);
        setIsLocked(false);
        setResult(null);
      }

      setCurrentQuestion({
        question: roundData.q.question || '',
        options: roundData.q.options || ['A', 'B', 'C', 'D'],
        idx: roundData.idx || 0,
        total: roundData.total || 20
      });
    }

    if (roundData?.phase === 'RESULT' && stateRoundResult) {
      const questionIdx = Number(roundData.idx || 0);
      setResult({
        isCorrect: !!stateRoundResult.isCorrect,
        points: Number(stateRoundResult.points || 0),
        correctAnswer: Number(stateRoundResult.correctAnswer || 0)
      });
      const currentPlayer = gameState.players.find(p => p.id === myId);
      if (currentPlayer && currentPlayer.score > myScore) {
        setMyScore(currentPlayer.score);
      } else if (stateRoundResult.isCorrect && lastScoredQuestionIdxRef.current !== questionIdx) {
        lastScoredQuestionIdxRef.current = questionIdx;
        setMyScore(prev => prev + Number(stateRoundResult.points || 0));
      }
    }
  }, [myId, gameState.players, roundData, stateRoundResult, myScore]);

  const sendAnswer = (idx: number) => {
    if (isLocked || selected !== null) return;
    setSelected(idx);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }
    broadcast.send('CONTROLLER_INPUT', { action: 'QUIZ_ANS', choice: idx }, myId);

    const activeRoomCode = roomCode || gameState.roomCode;
    if (activeRoomCode) {
      fetch(`/api/rooms/${activeRoomCode}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CONTROLLER_INPUT',
          payload: { action: 'QUIZ_ANS', choice: idx },
          senderId: myId
        })
      }).catch(() => {});
    }
  };

  // Fallback to gameData if no broadcast received
  const data = currentQuestion || (roundData ? {
    question: roundData.q?.question || '',
    options: roundData.q?.options || ['A', 'B', 'C', 'D'],
    idx: roundData.idx || 0,
    total: roundData.total || 20
  } : null);

  const stateResult = stateRoundResult ? {
    isCorrect: !!stateRoundResult.isCorrect,
    points: Number(stateRoundResult.points || 0),
    correctAnswer: Number(stateRoundResult.correctAnswer || 0)
  } : null;

  if (!data) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center">
      <div className="text-white text-3xl font-black">Waiting...</div>
    </div>;
  }

  // Color scheme for quadrants: A=Red, B=Green, C=Blue, D=Yellow
  const colorMap = [
    'from-red-600 to-red-700 border-red-500',      // A
    'from-green-600 to-green-700 border-green-500', // B
    'from-blue-600 to-blue-700 border-blue-500',    // C
    'from-yellow-500 to-yellow-600 border-yellow-400' // D
  ];

  // Show result phase (SECRET INFORMATION - not visible on TV)
  if (result || stateResult) {
    const activeResult = result || stateResult!;
    const syncedScore = gameState.players.find(p => p.id === myId)?.score || 0;
    const totalScore = Math.max(syncedScore, myScore);
    return (
      <div className="min-h-screen bg-slate-950 p-4 flex flex-col items-center justify-center space-y-6">
        {/* Result Verdict */}
        <div className={`text-7xl font-black animate-bounce ${activeResult.isCorrect ? 'text-green-400' : 'text-red-500'}`}>
          {activeResult.isCorrect ? '✓' : '✗'}
        </div>

        {/* Points */}
        <div className="text-5xl font-black text-cyan-400">
          +{activeResult.points} pts
        </div>

        {/* Your Score */}
        <div className="bg-slate-900 px-6 py-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-sm mb-2">YOUR TOTAL SCORE</div>
          <div className="text-4xl font-black text-white">{totalScore}</div>
        </div>

        {/* Correct Answer Info */}
        <div className="bg-slate-900 px-6 py-4 rounded-xl border border-slate-800 w-full text-center">
          <div className="text-slate-400 text-sm mb-2">CORRECT ANSWER</div>
          <div className="text-6xl font-black text-white mb-2">
            {['A', 'B', 'C', 'D'][activeResult.correctAnswer]}
          </div>
          {data.options[activeResult.correctAnswer] && (
            <div className="text-slate-300 text-sm">{data.options[activeResult.correctAnswer]}</div>
          )}
        </div>

        {/* Status */}
        <div className="text-slate-500 text-sm font-mono mt-4">Next question incoming...</div>
      </div>
    );
  }

  // ACTIVE QUESTION PHASE: No question text visible on phone
  // Players should focus on TV and use muscle memory for buttons
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col gap-0.5 p-0.5">
      {/* Top row - A and B */}
      <div className="flex gap-0.5 flex-1">
        {/* A - Red (Top Left) */}
        <button
          onClick={() => sendAnswer(0)}
          disabled={isLocked || selected !== null}
          className={`flex-1 rounded-2xl font-black text-7xl transition-all flex items-center justify-center ${
            selected === 0
              ? `bg-gradient-to-br ${colorMap[0]} scale-95 shadow-2xl`
              : isLocked || selected !== null
              ? 'bg-slate-700 opacity-30 cursor-not-allowed'
              : `bg-gradient-to-br ${colorMap[0]} hover:shadow-2xl active:scale-95`
          } border-4 text-white drop-shadow-lg`}
        >
          A
        </button>
        {/* B - Green (Top Right) */}
        <button
          onClick={() => sendAnswer(1)}
          disabled={isLocked || selected !== null}
          className={`flex-1 rounded-2xl font-black text-7xl transition-all flex items-center justify-center ${
            selected === 1
              ? `bg-gradient-to-br ${colorMap[1]} scale-95 shadow-2xl`
              : isLocked || selected !== null
              ? 'bg-slate-700 opacity-30 cursor-not-allowed'
              : `bg-gradient-to-br ${colorMap[1]} hover:shadow-2xl active:scale-95`
          } border-4 text-white drop-shadow-lg`}
        >
          B
        </button>
      </div>

      {/* Bottom row - C and D */}
      <div className="flex gap-0.5 flex-1">
        {/* C - Blue (Bottom Left) */}
        <button
          onClick={() => sendAnswer(2)}
          disabled={isLocked || selected !== null}
          className={`flex-1 rounded-2xl font-black text-7xl transition-all flex items-center justify-center ${
            selected === 2
              ? `bg-gradient-to-br ${colorMap[2]} scale-95 shadow-2xl`
              : isLocked || selected !== null
              ? 'bg-slate-700 opacity-30 cursor-not-allowed'
              : `bg-gradient-to-br ${colorMap[2]} hover:shadow-2xl active:scale-95`
          } border-4 text-white drop-shadow-lg`}
        >
          C
        </button>
        {/* D - Yellow (Bottom Right) */}
        <button
          onClick={() => sendAnswer(3)}
          disabled={isLocked || selected !== null}
          className={`flex-1 rounded-2xl font-black text-7xl transition-all flex items-center justify-center ${
            selected === 3
              ? `bg-gradient-to-br ${colorMap[3]} scale-95 shadow-2xl`
              : isLocked || selected !== null
              ? 'bg-slate-700 opacity-30 cursor-not-allowed'
              : `bg-gradient-to-br ${colorMap[3]} hover:shadow-2xl active:scale-95`
          } border-4 text-white drop-shadow-lg`}
        >
          D
        </button>
      </div>
    </div>
  );
};

export default QuizController;
