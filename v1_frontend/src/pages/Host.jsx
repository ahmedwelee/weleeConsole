import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import socketService from '../utils/socket.js';
import GameScreen from '../components/GameScreen.jsx';
import PlayerList from '../components/PlayerList.jsx';
import './Host.css';

function Host() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentGame, setCurrentGame] = useState('racing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = socketService.connect();

    // Create room
    socketService.createRoom((response) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setLoading(false);
      } else {
        console.error('Failed to create room:', response.error);
      }
    });

    // Listen for players joining
    socket.on('player:joined', ({ player, players:  updatedPlayers }) => {
      setPlayers(updatedPlayers);
      console.log('Player joined:', player);
    });

    // Listen for players leaving
    socket.on('player:left', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleStartGame = () => {
    if (players.length === 0) {
      alert('Wait for players to join! ');
      return;
    }
    socketService.startGame(roomCode, currentGame);
    setGameStarted(true);
  };

  const handleEndGame = (finalScores) => {
    socketService.endGame(roomCode, finalScores);
    setGameStarted(false);
  };

  const joinUrl = `${window.location.origin}/join`;

  if (loading) {
    return <div className="loading">Creating room...</div>;
  }

  return (
    <div className="host-container">
      {! gameStarted ? (
        <div className="lobby">
          <header className="lobby-header">
            <h1>🎮 Game Lobby</h1>
            <div className="room-info">
              <div className="room-code-display">
                <span className="label">Room Code:</span>
                <span className="code">{roomCode}</span>
              </div>
            </div>
          </header>

          <div className="lobby-content">
            <div className="join-instructions">
              <h2>How to Join: </h2>
              <div className="join-methods">
                <div className="method">
                  <h3>📱 Scan QR Code</h3>
                  <div className="qr-code">
                    <QRCodeSVG 
                      value={`${joinUrl}?code=${roomCode}`} 
                      size={200}
                      level="H"
                    />
                  </div>
                </div>
                
                <div className="method">
                  <h3>🔗 Or visit: </h3>
                  <div className="url-box">
                    <code>{joinUrl}</code>
                  </div>
                  <p>Enter code: <strong>{roomCode}</strong></p>
                </div>
              </div>
            </div>

            <div className="player-section">
              <h2>Connected Players ({players.length})</h2>
              <PlayerList players={players} />
              
              {players.length > 0 && (
                <div className="game-controls">
                  <select 
                    value={currentGame} 
                    onChange={(e) => setCurrentGame(e.target.value)}
                    className="game-select"
                  >
                    <option value="racing">🏎️ Racing Game</option>
                    <option value="trivia">🧠 Trivia Quiz</option>
                    <option value="drawing">🎨 Drawing Game</option>
                  </select>
                  
                  <button 
                    onClick={handleStartGame}
                    className="btn btn-primary btn-large"
                  >
                    Start Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <GameScreen 
          roomCode={roomCode}
          players={players}
          gameName={currentGame}
          onEndGame={handleEndGame}
        />
      )}
    </div>
  );
}

export default Host;