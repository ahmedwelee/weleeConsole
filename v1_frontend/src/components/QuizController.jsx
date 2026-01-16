import React, { useEffect, useState } from 'react';
import socketService from '../utils/socket.js';
import './QuizController.css';

function QuizController({ playerId, roomCode }) {
  const [roomState, setRoomState] = useState('WAITING');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !roomCode) return;

    // Listen for room state changes
    socket.on('room:state-changed', (data) => {
      console.log('Room state changed:', data.state);
      setRoomState(data.state);
      
      if (data.state === 'PLAYING') {
        setHasAnswered(false);
        setFeedbackMessage('');
      }
    });

    // Listen for new questions
    socket.on('quiz:new-question', () => {
      setHasAnswered(false);
      setFeedbackMessage('');
    });

    // Listen for quiz finished
    socket.on('quiz:finished', (data) => {
      const finalScore = data?.finalScores?.[playerId] || 0;
      setScore(finalScore);
      setRoomState('FINISHED');
    });

    return () => {
      socket.off('room:state-changed');
      socket.off('quiz:new-question');
      socket.off('quiz:finished');
    };
  }, [roomCode, playerId]);

  const handleAnswerClick = (letter) => {
    if (hasAnswered || roomState !== 'PLAYING') return;

    setHasAnswered(true);
    setFeedbackMessage('Answer submitted!');

    socketService.getSocket().emit('quiz:submit-answer', {
      roomCode,
      playerId,
      answerLetter: letter
    }, (response) => {
      if (response?.success) {
        if (response.isCorrect) {
          setFeedbackMessage('✅ Correct!');
          setScore(response.score);
        } else {
          setFeedbackMessage('❌ Wrong!');
        }
      }
    });
  };

  // Render based on room state
  if (roomState === 'WAITING' || roomState === 'CONFIG') {
    return (
      <div className="quiz-controller waiting-state">
        <div className="status-card">
          <div className="loader"></div>
          <h2>🎯 Room: {roomCode}</h2>
          <p>{roomState === 'WAITING' ? 'Waiting for host to select game...' : 'Host is configuring the game...'}</p>
        </div>
      </div>
    );
  }

  if (roomState === 'FINISHED') {
    return (
      <div className="quiz-controller result-state">
        <h1>🏆 Game Over!</h1>
        <div className="score-circle">
          <span className="final-score">{score}</span>
          <p>Points</p>
        </div>
        <p>Check the main screen for rankings!</p>
      </div>
    );
  }

  // PLAYING STATE - Show only A/B/C/D buttons
  return (
    <div className="quiz-controller playing-state">
      <div className="controller-header">
        <h2>Room: {roomCode}</h2>
        <div className="score-badge">Score: {score}</div>
      </div>

      <div className="letter-buttons-grid">
        <button
          className={`letter-btn ${hasAnswered ? 'disabled' : ''}`}
          onClick={() => handleAnswerClick('A')}
          disabled={hasAnswered}
        >
          A
        </button>
        <button
          className={`letter-btn ${hasAnswered ? 'disabled' : ''}`}
          onClick={() => handleAnswerClick('B')}
          disabled={hasAnswered}
        >
          B
        </button>
        <button
          className={`letter-btn ${hasAnswered ? 'disabled' : ''}`}
          onClick={() => handleAnswerClick('C')}
          disabled={hasAnswered}
        >
          C
        </button>
        <button
          className={`letter-btn ${hasAnswered ? 'disabled' : ''}`}
          onClick={() => handleAnswerClick('D')}
          disabled={hasAnswered}
        >
          D
        </button>
      </div>

      {feedbackMessage && (
        <div className="feedback-message">
          {feedbackMessage}
        </div>
      )}
    </div>
  );
}

export default QuizController;
