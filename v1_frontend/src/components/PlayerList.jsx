import React from 'react';
import './PlayerList.css';

function PlayerList({ players }) {
  if (players.length === 0) {
    return (
      <div className="player-list-empty">
        <p>👥 No players yet</p>
        <p className="subtitle">Waiting for players to join...</p>
      </div>
    );
  }

  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];

  return (
    <div className="player-list">
      {players.map((player, index) => (
        <div key={player.id} className="player-card">
          <div 
            className="player-avatar"
            style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="player-details">
            <span className="player-name">{player.name}</span>
            <span className="player-status">
              {player.connected ? '🟢 Ready' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlayerList;