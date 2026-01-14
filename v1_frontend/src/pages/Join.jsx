import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Join.css';

function Join() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(searchParams.get('code') || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    // Navigate to controller page
    navigate(`/controller/${roomCode.toUpperCase()}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>📱 Join Game</h1>
        
        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomCode">Room Code</label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary btn-large">
            Join Game
          </button>
        </form>

        <div className="join-footer">
          <a href="/" className="link">← Back to home</a>
        </div>
      </div>
    </div>
  );
}

export default Join;