import React, { useState } from 'react';
import './QuizConfigPanel.css';

function QuizConfigPanel({ roomCode, playerId, onConfigConfirmed }) {
  const [settings, setSettings] = useState({
    language: 'English',
    category: 'History',
    difficulty: 'Medium'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    // Emit settings update and confirm
    import('../utils/socket.js').then(({ default: socketService }) => {
      socketService.getSocket().emit('quiz:update-settings', {
        roomCode,
        playerId,
        settings
      }, (response) => {
        if (response?.success) {
          // Now confirm the config
          socketService.getSocket().emit('quiz:confirm-config', {
            roomCode,
            playerId
          }, (confirmResponse) => {
            if (confirmResponse?.success) {
              onConfigConfirmed();
            }
          });
        }
      });
    });
  };

  return (
    <div className="quiz-config-panel">
      <h2>⚙️ Configure Quiz</h2>
      
      <div className="config-section">
        <label>Language:</label>
        <select 
          value={settings.language} 
          onChange={(e) => handleSettingChange('language', e.target.value)}
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Arabic">Arabic</option>
        </select>
      </div>

      <div className="config-section">
        <label>Category:</label>
        <select 
          value={settings.category} 
          onChange={(e) => handleSettingChange('category', e.target.value)}
        >
          <option value="History">History</option>
          <option value="Science">Science</option>
          <option value="Geography">Geography</option>
          <option value="Sports">Sports</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Technology">Technology</option>
          <option value="General Knowledge">General Knowledge</option>
        </select>
      </div>

      <div className="config-section">
        <label>Difficulty:</label>
        <div className="difficulty-buttons">
          <button 
            className={`diff-btn ${settings.difficulty === 'Easy' ? 'active' : ''}`}
            onClick={() => handleSettingChange('difficulty', 'Easy')}
          >
            Easy
          </button>
          <button 
            className={`diff-btn ${settings.difficulty === 'Medium' ? 'active' : ''}`}
            onClick={() => handleSettingChange('difficulty', 'Medium')}
          >
            Medium
          </button>
          <button 
            className={`diff-btn ${settings.difficulty === 'Hard' ? 'active' : ''}`}
            onClick={() => handleSettingChange('difficulty', 'Hard')}
          >
            Hard
          </button>
        </div>
      </div>

      <button className="confirm-btn" onClick={handleConfirm}>
        Confirm Settings & Continue
      </button>
    </div>
  );
}

export default QuizConfigPanel;
