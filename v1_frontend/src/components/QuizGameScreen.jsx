import React, { useEffect, useState } from 'react';
import socketService from '../utils/socket.js';
import './QuizGameScreen.css';

function QuizGameScreen({ roomCode, players, onEndGame }) {
  const [loading, setLoading] = useState(true);
  const [waitingForSettings, setWaitingForSettings] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [scores, setScores] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [playerAnswers, setPlayerAnswers] = useState({});
  const [gameFinished, setGameFinished] = useState(false);
  const [quizSettings, setQuizSettings] = useState(null);

  useEffect(() => {
    const socket = socketService.getSocket();

    const initializeScores = {};
    players.forEach(player => {
      initializeScores[player.id] = 0;
    });
    setScores(initializeScores);

    // Wait for settings to be locked before starting quiz
    const QUIZ_START_DELAY = 500; // ms - allows settings event to propagate
    socket.on('quiz:settings-locked', ({ settings }) => {
      setQuizSettings(settings);
      setWaitingForSettings(false);
      
      // Start quiz after settings are locked
      setTimeout(() => {
        socketService.getSocket().emit('quiz:start', { roomCode }, (response) => {
          if (response.success) {
            setTotalQuestions(response.totalQuestions);
            loadQuestion();
          } else {
            alert('Failed to start quiz: ' + response.error);
          }
        });
      }, QUIZ_START_DELAY);
    });

    socket.on('quiz:answer-submitted', ({ playerId, answerIndex, isCorrect, scores: updatedScores }) => {
      setPlayerAnswers(prev => ({
        ...prev,
        [playerId]: { answerIndex, isCorrect }
      }));
      setScores(updatedScores);
    });

    socket.on('quiz:finished', ({ finalScores }) => {
      setScores(finalScores);
      setGameFinished(true);
    });

    return () => {
      socket.off('quiz:answer-submitted');
      socket.off('quiz:finished');
      socket.off('quiz:settings-locked');
    };
  }, [roomCode, players]);

  useEffect(() => {
    if (currentQuestion && !showingAnswer && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestion, showingAnswer, timeRemaining]);

  const loadQuestion = () => {
    socketService.getSocket().emit('quiz:get-question', { roomCode }, (response) => {
      if (response.success) {
        setCurrentQuestion(response.question);
        setQuestionIndex(response.question.questionIndex);
        setTotalQuestions(response.question.totalQuestions);
        setTimeRemaining(20);
        setShowingAnswer(false);
        setPlayerAnswers({});
        setLoading(false);
      }
    });
  };

  const handleTimeUp = () => {
    setShowingAnswer(true);
    
    socketService.getSocket().emit('quiz:get-question', { roomCode }, (response) => {
      if (response.success && response.question) {
        setCorrectAnswer(response.question.options[currentQuestion.options.indexOf(response.question.options[0]) + (currentQuestion.correctAnswer || 0)]);
      }
    });
  };

  const handleNextQuestion = () => {
    socketService.getSocket().emit('quiz:next-question', { roomCode }, (response) => {
      if (response.success) {
        if (response.finished) {
          setGameFinished(true);
        } else {
          loadQuestion();
        }
      }
    });
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const getSortedPlayers = () => {
    return [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  };

  if (waitingForSettings) {
    return (
      <div className="quiz-screen">
        <div className="loading-message">
          <h2>⚙️ Waiting for Quiz Configuration...</h2>
          <p>Player 1 is setting up the quiz</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quiz-screen">
        <div className="loading-message">
          <h2>🎯 Generating Quiz Questions...</h2>
          {quizSettings && (
            <div className="settings-info">
              <p>Language: {quizSettings.language}</p>
              <p>Category: {quizSettings.category}</p>
              <p>Difficulty: {quizSettings.difficulty}</p>
            </div>
          )}
          <p>Please wait while we prepare your quiz</p>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    const sortedPlayers = getSortedPlayers();
    const winner = sortedPlayers[0];

    return (
      <div className="quiz-screen">
        <div className="quiz-finished">
          <h1>🏆 Quiz Battle Complete!</h1>
          
          <div className="winner-announcement">
            <div className="winner-trophy">👑</div>
            <h2>{getPlayerName(winner.id)} Wins!</h2>
            <p className="winner-score">{scores[winner.id]} / {totalQuestions} correct</p>
          </div>

          <div className="final-rankings">
            <h3>Final Rankings</h3>
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className={`ranking-item rank-${index + 1}`}>
                <span className="rank">#{index + 1}</span>
                <span className="player-name">{player.name}</span>
                <span className="final-score">{scores[player.id] || 0} points</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onEndGame(scores)}
            className="btn btn-primary btn-large"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-screen">
      <div className="quiz-header">
        <div className="quiz-progress">
          <span className="question-counter">
            Question {questionIndex + 1} / {totalQuestions}
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        <div className={`timer ${timeRemaining <= 5 ? 'timer-warning' : ''}`}>
          ⏱️ {timeRemaining}s
        </div>
      </div>

      {currentQuestion && (
        <div className="quiz-content">
          <div className="question-section">
            <h2 className="question-text">{currentQuestion.question}</h2>
            
            <div className="options-grid">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`option-box ${showingAnswer ? (index === currentQuestion.correctAnswer ? 'correct' : 'incorrect') : ''}`}
                >
                  <span className="option-label">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                  {showingAnswer && index === currentQuestion.correctAnswer && (
                    <span className="correct-indicator">✓</span>
                  )}
                </div>
              ))}
            </div>

            {showingAnswer && (
              <button 
                onClick={handleNextQuestion}
                className="btn btn-primary btn-large next-btn"
              >
                {questionIndex + 1 < totalQuestions ? 'Next Question →' : 'Show Results'}
              </button>
            )}
          </div>

          <div className="scoreboard-section">
            <h3>Live Scoreboard</h3>
            <div className="scoreboard">
              {getSortedPlayers().map((player, index) => (
                <div key={player.id} className="score-item">
                  <span className="position">#{index + 1}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="score-value">{scores[player.id] || 0}</span>
                  {playerAnswers[player.id] && (
                    <span className={`answer-indicator ${playerAnswers[player.id].isCorrect ? 'correct' : 'incorrect'}`}>
                      {playerAnswers[player.id].isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="answer-stats">
              <p>
                {Object.keys(playerAnswers).length} / {players.length} answered
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizGameScreen;
