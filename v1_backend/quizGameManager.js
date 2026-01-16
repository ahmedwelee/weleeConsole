class QuizGameManager {
  constructor() {
    this.activeGames = new Map();
  }

  createGame(roomCode, questions) {
    const game = {
      roomCode,
      questions,
      currentQuestionIndex: 0,
      playerAnswers: new Map(),
      scores: {},
      started: false,
      finished: false,
      questionStartTime: null,
      timeLimit: 20000
    };

    this.activeGames.set(roomCode, game);
    return game;
  }

  getGame(roomCode) {
    return this.activeGames.get(roomCode);
  }

  startGame(roomCode) {
    const game = this.getGame(roomCode);
    if (game) {
      game.started = true;
      game.questionStartTime = Date.now();
    }
    return game;
  }

  submitAnswer(roomCode, playerId, answerIndex) {
    const game = this.getGame(roomCode);
    if (!game || game.finished) return null;

    const questionKey = `${game.currentQuestionIndex}`;
    
    if (!game.playerAnswers.has(questionKey)) {
      game.playerAnswers.set(questionKey, new Map());
    }

    const questionAnswers = game.playerAnswers.get(questionKey);
    
    if (questionAnswers.has(playerId)) {
      return { alreadyAnswered: true };
    }

    const currentQuestion = game.questions[game.currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const answerTime = Date.now();

    questionAnswers.set(playerId, {
      answerIndex,
      isCorrect,
      answeredAt: answerTime
    });

    if (isCorrect) {
      game.scores[playerId] = (game.scores[playerId] || 0) + 1;
    }

    return {
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      score: game.scores[playerId] || 0
    };
  }

  nextQuestion(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return null;

    game.currentQuestionIndex++;
    game.questionStartTime = Date.now();

    if (game.currentQuestionIndex >= game.questions.length) {
      game.finished = true;
      return { finished: true, finalScores: game.scores };
    }

    const q = game.questions[game.currentQuestionIndex];
    return {
      finished: false,
      questionIndex: game.currentQuestionIndex,
      totalQuestions: game.questions.length,
      question: {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      },
      timeLimit: game.timeLimit
    };
  }

  getCurrentQuestion(roomCode) {
    const game = this.getGame(roomCode);
    if (!game || game.finished) return null;

    const q = game.questions[game.currentQuestionIndex];
    return {
      questionIndex: game.currentQuestionIndex,
      totalQuestions: game.questions.length,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      timeLimit: game.timeLimit
    };
  }

  getPlayerAnswerForCurrentQuestion(roomCode, playerId) {
    const game = this.getGame(roomCode);
    if (!game) return null;

    const questionKey = `${game.currentQuestionIndex}`;
    const questionAnswers = game.playerAnswers.get(questionKey);
    
    if (!questionAnswers) return null;
    return questionAnswers.get(playerId);
  }

  getFinalScores(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return null;

    return game.scores;
  }

  endGame(roomCode) {
    const game = this.getGame(roomCode);
    if (game) {
      game.finished = true;
    }
    return game;
  }

  deleteGame(roomCode) {
    this.activeGames.delete(roomCode);
  }
}

export default QuizGameManager;
