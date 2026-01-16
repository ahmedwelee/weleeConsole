import React, { useEffect, useState } from 'react';
import socketService from '../utils/socket.js';

function QuizGameScreen({ roomCode, players, onEndGame }) {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    const socket = socketService.getSocket();

    // LISTEN FOR BROADCAST
    socket.on('quiz:started', (data) => {
      console.log("📦 Quiz data received:", data);

      // Safety check: ensure data and questions exist
      if (data && data.questions) {
        setQuizData(data.questions);
        setCurrentQuestion(data.questions[0]);
        setLoading(false);
      } else {
        console.error("Malformed quiz data received:", data);
      }
    });

    return () => {
      socket.off('quiz:started');
    };
  }, []);

  if (loading) {
    return (
        <div className="quiz-screen loading-state">
          <div className="spinner"></div>
          <h2>🎯 Generating Your Battle...</h2>
          <p>Gemini is crafting custom questions for you.</p>
        </div>
    );
  }

  return (
      <div className="quiz-screen">
        {/* Question rendering logic goes here */}
        <div className="question-box">
          <span>Question {questionIndex + 1} / {quizData.length}</span>
          <h2>{currentQuestion?.question}</h2>
        </div>
      </div>
  );
}

export default QuizGameScreen;