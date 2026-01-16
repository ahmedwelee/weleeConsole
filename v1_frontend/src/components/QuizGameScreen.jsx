import React, { useEffect, useState, useCallback } from 'react';
import socketService from '../utils/socket.js';
import './QuizGameScreen.css';

function QuizGameScreen({ roomCode, players, onEndGame }) {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState([]); // Store all questions here
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [playerAnswers, setPlayerAnswers] = useState({});
  const [gameFinished, setGameFinished] = useState(false);

  // 1. Listen for the Quiz Data Broadcast
  useEffect(() => {
    const socket = socketService.getSocket();

    // Initialize scores
    const initializeScores = {};
    players.forEach(player => { initializeScores[player.id] = 0; });
    setScores(initializeScores);

    // This catches the broadcast sent by the server after Gemini finishes
    socket.on('quiz:started', (data) => {
      // Safe destructuring with fallback for missing data
      const questions = data?.questions || [];
      console.log("Quiz received in Game Screen:", questions);
      
      if (Array.isArray(questions) && questions.length > 0) {
        setQuizData(questions);
        setCurrentQuestion(questions[0]);
        setLoading(false);
      } else {
        console.error('❌ Received invalid questions data:', data);
      }
    });

    socket.on('quiz:answer-submitted', (data) => {
      if (!data) {
        console.error('❌ Received invalid answer data');
        return;
      }
      const { playerId, answerIndex, isCorrect, scores: updatedScores } = data;
      
      if (playerId && updatedScores) {
        setPlayerAnswers(prev => ({ ...prev, [playerId]: { answerIndex, isCorrect } }));
        setScores(updatedScores);
      }
    });
    
    // Listen for new question events to stay in sync with controller
    socket.on('quiz:new-question', (data) => {
      if (!data || !data.question) {
        console.error('❌ Received invalid question data:', data);
        return;
      }
      
      const question = data.question;
      
      // Find the index of this question in our quiz data
      setQuizData(currentQuizData => {
        const nextIndex = currentQuizData.findIndex(q => 
          q.question === question.question
        );
        
        if (nextIndex !== -1) {
          setQuestionIndex(nextIndex);
          setCurrentQuestion(currentQuizData[nextIndex]);
          setTimeRemaining(20);
          setShowingAnswer(false);
          setPlayerAnswers({});
        }
        
        return currentQuizData;
      });
    });

    socket.on('quiz:finished', (data) => {
      const finalScores = data?.finalScores || {};
      setScores(finalScores);
      setGameFinished(true);
    });

    return () => {
      socket.off('quiz:started');
      socket.off('quiz:answer-submitted');
      socket.off('quiz:new-question');
      socket.off('quiz:finished');
    };
  }, [players]);

  // 2. Timer Logic
  useEffect(() => {
    if (currentQuestion && !showingAnswer && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setShowingAnswer(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentQuestion, showingAnswer, timeRemaining]);

  // 3. Navigation Logic
  const handleNextQuestion = () => {
    const nextIndex = questionIndex + 1;
    if (nextIndex < quizData.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(quizData[nextIndex]);
      setTimeRemaining(20);
      setShowingAnswer(false);
      setPlayerAnswers({});
      
      // Emit to server to sync all players to the next question
      socketService.getSocket().emit('quiz:next-question', { roomCode }, (response) => {
        if (!response?.success) {
          console.error('❌ Failed to advance to next question');
        }
      });
    } else {
      setGameFinished(true);
    }
  };

  const getSortedPlayers = () => {
    return [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  };

  if (loading) {
    return (
        <div className="quiz-screen">
          <div className="loading-message">
            <div className="spinner"></div>
            <h2>🎯 Preparing Your Battle...</h2>
            <p>Gemini is generating custom questions for you.</p>
          </div>
        </div>
    );
  }

  if (gameFinished) {
    const sortedPlayers = getSortedPlayers();
    return (
        <div className="quiz-screen">
          <div className="quiz-finished">
            <h1>🏆 Results</h1>
            <div className="winner-announcement">
              <h2>{sortedPlayers[0].name} Wins!</h2>
            </div>
            <button onClick={() => onEndGame(scores)} className="btn btn-primary">Back to Lobby</button>
          </div>
        </div>
    );
  }

  return (
      <div className="quiz-screen">
        <div className="quiz-header">
          <div className="quiz-progress">
            <span>Question {questionIndex + 1} / {quizData.length}</span>
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
                      <button
                          key={index}
                          disabled={showingAnswer}
                          className={`option-box ${showingAnswer ? (index === currentQuestion.correctAnswer ? 'correct' : 'incorrect') : ''}`}
                      >
                        {option}
                      </button>
                  ))}
                </div>
                {showingAnswer && (
                    <button onClick={handleNextQuestion} className="btn next-btn">
                      {questionIndex + 1 < quizData.length ? 'Next Question' : 'Finish'}
                    </button>
                )}
              </div>
            </div>
        )}
      </div>
  );
}

export default QuizGameScreen;