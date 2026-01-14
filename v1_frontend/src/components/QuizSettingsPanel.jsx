import React, { useState, useEffect } from 'react';
import './QuizSettingsPanel.css';

function QuizSettingsPanel({ roomCode, playerId, isFirstPlayer, onSettingsLocked, socketService }) {
  const [language, setLanguage] = useState('English');
  const [category, setCategory] = useState('History');
  const [difficulty, setDifficulty] = useState('Medium');
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = socketService.getSocket();

    // Listen for settings updates from other sources
    socket.on('quiz:settings-updated', ({ settings }) => {
      setLanguage(settings.language);
      setCategory(settings.category);
      setDifficulty(settings.difficulty);
    });

    socket.on('quiz:settings-locked', ({ settings }) => {
      setLocked(true);
      if (onSettingsLocked) {
        onSettingsLocked(settings);
      }
    });

    return () => {
      socket.off('quiz:settings-updated');
      socket.off('quiz:settings-locked');
    };
  }, [socketService, onSettingsLocked]);

  const handleSettingChange = (setting, value) => {
    if (!isFirstPlayer || locked) return;

    const newSettings = { language, category, difficulty };
    newSettings[setting] = value;

    // Update local state
    if (setting === 'language') setLanguage(value);
    if (setting === 'category') setCategory(value);
    if (setting === 'difficulty') setDifficulty(value);

    // Emit to server
    socketService.getSocket().emit('quiz:update-settings', {
      roomCode,
      playerId,
      settings: { [setting]: value }
    }, (response) => {
      if (!response.success) {
        console.error('Failed to update settings:', response.error);
      }
    });
  };

  const handleConfirm = () => {
    if (!isFirstPlayer || locked) return;

    setLoading(true);
    socketService.getSocket().emit('quiz:lock-settings', {
      roomCode,
      playerId
    }, (response) => {
      setLoading(false);
      if (response.success) {
        setLocked(true);
        if (onSettingsLocked) {
          onSettingsLocked({ language, category, difficulty, locked: true });
        }
      } else {
        alert('Failed to lock settings: ' + response.error);
      }
    });
  };

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
          {locked && <p className="locked-message">✓ Settings locked. Starting soon...</p>}
        </div>
      </div>
    );
  }

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

        {!locked && (
          <button
            onClick={handleConfirm}
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Starting Quiz...' : 'Confirm & Start Quiz'}
          </button>
        )}

        {locked && (
          <div className="locked-indicator">
            <p>✓ Settings locked</p>
            <p>Starting quiz...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizSettingsPanel;
