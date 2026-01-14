import React, { useEffect, useState } from 'react';
import './QuizController.css';

function QuizController({ onInput, playerId, roomCode }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [waitingForNext, setWaitingForNext] = useState(false);

  useEffect(() => {
    const socket = onInput;

    if (socket && socket.getSocket) {
      const socketInstance = socket.getSocket();

      socketInstance.on('quiz:new-question', ({ question }) => {
        setCurrentQuestion(question);
        setSelectedAnswer(null);
        setHasAnswered(false);
        setIsCorrect(null);
        setTimeRemaining(20);
        setWaitingForNext(false);
      });

      socketInstance.on('quiz:finished', ({ finalScores }) => {
        setScore(finalScores[playerId] || 0);
        setCurrentQuestion(null);
        setWaitingForNext(true);
      });

      loadInitialQuestion();
    }

    return () => {
      if (socket && socket.getSocket) {
        const socketInstance = socket.getSocket();
        socketInstance.off('quiz:new-question');
        socketInstance.off('quiz:finished');
      }
    };
  }, [playerId, roomCode]);

  useEffect(() => {
    if (currentQuestion && !hasAnswered && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestion, hasAnswered, timeRemaining]);

  const loadInitialQuestion = () => {
    if (onInput && onInput.getSocket) {
      const socket = onInput.getSocket();
      socket.emit('quiz:get-question', { roomCode }, (response) => {
        if (response.success && response.question) {
          setCurrentQuestion(response.question);
          setTimeRemaining(20);
        }
      });
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (hasAnswered || timeRemaining === 0) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);

    if (onInput && onInput.getSocket) {
      const socket = onInput.getSocket();
      socket.emit('quiz:submit-answer', { roomCode, playerId, answerIndex }, (response) => {
        if (response.success) {
          setIsCorrect(response.isCorrect);
          setScore(response.score);
          setWaitingForNext(true);
        }
      });
    }
  };

  if (!currentQuestion && !waitingForNext) {
    return (
      <div className="quiz-controller">
        <div className="waiting-state">
          <h2>🎯 Quiz Battle</h2>
          <p>Waiting for quiz to start...</p>
        </div>
      </div>
    );
  }

  if (waitingForNext && !currentQuestion) {
    return (
      <div className="quiz-controller">
        <div className="result-state">
          <h2>🏆 Quiz Complete!</h2>
          <div className="score-display">
            <p>Your Score</p>
            <div className="score-big">{score}</div>
          </div>
          <p className="result-message">Great job! Waiting for final results...</p>
        </div>
      </div>
    );
  }

  if (waitingForNext) {
    return (
      <div className="quiz-controller">
        <div className="result-state">
          {isCorrect !== null && (
            <>
              <div className={`result-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? '✓' : '✗'}
              </div>
              <h2>{isCorrect ? 'Correct!' : 'Incorrect'}</h2>
              <div className="score-display">
                <p>Your Score</p>
                <div className="score-big">{score}</div>
              </div>
            </>
          )}
          <p className="waiting-text">Waiting for next question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-controller">
      <div className="controller-header">
        <div className="question-info">
          <span className="question-number">
            Q{currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}
          </span>
          <div className={`timer-display ${timeRemaining <= 5 ? 'urgent' : ''}`}>
            ⏱️ {timeRemaining}s
          </div>
        </div>
        <div className="score-info">
          Score: <strong>{score}</strong>
        </div>
      </div>

      <div className="question-display">
        <h3>{currentQuestion.question}</h3>
      </div>

      <div className="answers-grid">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            className={`answer-btn ${selectedAnswer === index ? 'selected' : ''} ${hasAnswered ? 'disabled' : ''}`}
            onClick={() => handleAnswerSelect(index)}
            disabled={hasAnswered || timeRemaining === 0}
          >
            <span className="answer-label">{String.fromCharCode(65 + index)}</span>
            <span className="answer-text">{option}</span>
          </button>
        ))}
      </div>

      {timeRemaining === 0 && !hasAnswered && (
        <div className="timeout-message">
          ⏰ Time's up!
        </div>
      )}
    </div>
  );
}

export default QuizController;
