import React, { useState, useEffect } from 'react';
import './QuizSettingsPanel.css';

// Added onQuizStart to the destructured props
function QuizSettingsPanel({ roomCode, playerId, isFirstPlayer, onSettingsLocked, onQuizStart, socketService }) {
  const [language, setLanguage] = useState('English');
  const [category, setCategory] = useState('History');
  const [difficulty, setDifficulty] = useState('Medium');
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = socketService.getSocket();

    // 1. Listen for settings updates (for Player 2)
    socket.on('quiz:settings-updated', ({ settings }) => {
      if (settings.language) setLanguage(settings.language);
      if (settings.category) setCategory(settings.category);
      if (settings.difficulty) setDifficulty(settings.difficulty);
    });

    // 2. Listen for settings being locked
    socket.on('quiz:settings-locked', ({ settings }) => {
      setLocked(true);
      if (onSettingsLocked) {
        onSettingsLocked(settings);
      }
    });

    // 3. IMPORTANT: Listen for the actual quiz data (Broadcasted to everyone)
    socket.on('quiz:started', (data) => {
      console.log("🚀 Quiz data arrived for all players:", data.questions);
      setLoading(false);

      if (onQuizStart) {
        onQuizStart(data.questions);
      }
    });

    return () => {
      socket.off('quiz:settings-updated');
      socket.off('quiz:settings-locked');
      socket.off('quiz:started');
    };
  }, [socketService, onSettingsLocked, onQuizStart]);

  const handleSettingChange = (setting, value) => {
    if (!isFirstPlayer || locked) return;

    // Update local state immediately for responsiveness
    if (setting === 'language') setLanguage(value);
    if (setting === 'category') setCategory(value);
    if (setting === 'difficulty') setDifficulty(value);

    // Sync with server
    socketService.updateQuizSettings(
        roomCode,
        playerId,
        { [setting]: value },
        (response) => {
          if (!response.success) {
            console.error('Failed to update settings:', response.error);
          }
        }
    );
  };

  const handleConfirm = () => {
    if (!isFirstPlayer || locked) return;

    setLoading(true);

    // 1️⃣ LOCK SETTINGS
    socketService.lockQuizSettings(
        roomCode,
        playerId,
        (response) => {
          if (!response.success) {
            setLoading(false);
            alert('Failed to lock settings: ' + response.error);
            return;
          }

          setLocked(true);

          // 2️⃣ TRIGGER QUIZ GENERATION
          // We don't wait for the questions in this callback because
          // the 'quiz:started' listener above will handle it for everyone.
          socketService.startQuiz(roomCode, (startRes) => {
            if (!startRes.success) {
              setLoading(false);
              console.error('Failed to start quiz:', startRes.error);
              alert(startRes.error);
            }
          });
        }
    );
  };

  // UI for Player 2 (Waiting)
  if (!isFirstPlayer) {
    return (
        <div className="quiz-settings-panel">
          <div className="settings-waiting">
            <h2>⚙️ Quiz Configuration</h2>
            <p>Player 1 is configuring the quiz settings...</p>
            <div className="current-settings">
              <div className="setting-display">
                <span className="setting-label">Language:</span>
                <span className="setting-value">{language}</span>
              </div>
              <div className="setting-display">
                <span className="setting-label">Category:</span>
                <span className="setting-value">{category}</span>
              </div>
              <div className="setting-display">
                <span className="setting-label">Difficulty:</span>
                <span className="setting-value">{difficulty}</span>
              </div>
            </div>
            {locked ? (
                <div className="loading-container">
                  <p className="locked-message">✓ Settings locked. Generating questions...</p>
                  <div className="spinner"></div>
                </div>
            ) : (
                <p className="waiting-pulse">Waiting for Player 1 to confirm...</p>
            )}
          </div>
        </div>
    );
  }

  // UI for Player 1 (Configuring)
  return (
      <div className="quiz-settings-panel">
        <div className="settings-header">
          <h2>⚙️ Configure Quiz Battle</h2>
          <p>As Player 1, you control the quiz settings</p>
        </div>

        <div className="settings-form">
          <div className="setting-group">
            <label>Language</label>
            <select
                value={language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                disabled={locked}
            >
              <option value="English">English</option>
              <option value="Arabic">Arabic</option>
              <option value="French">French</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Category</label>
            <select
                value={category}
                onChange={(e) => handleSettingChange('category', e.target.value)}
                disabled={locked}
            >
              <option value="History">History</option>
              <option value="Geography">Geography</option>
              <option value="Football">Football</option>
              <option value="Countries and Capitals">Countries and Capitals</option>
              <option value="Electronics">Electronics</option>
              <option value="Famous People">Famous People</option>
              <option value="Movies and Music">Movies and Music</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Difficulty</label>
            <select
                value={difficulty}
                onChange={(e) => handleSettingChange('difficulty', e.target.value)}
                disabled={locked}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {!locked ? (
              <button
                  onClick={handleConfirm}
                  className="btn btn-primary btn-large"
                  disabled={loading}
              >
                {loading ? 'Starting...' : 'Confirm & Start Quiz'}
              </button>
          ) : (
              <div className="locked-indicator">
                <p>✓ Settings locked</p>
                <p>{loading ? '🤖 Generating Quiz via Gemini...' : 'Ready!'}</p>
              </div>
          )}
        </div>
      </div>
  );
}

export default QuizSettingsPanel;