import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import socketService from '../utils/socket.js';
import ControllerUI from '../components/ControllerUI';
import './Controller.css';

function Controller() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [playerName] = useState(searchParams.get('name') || 'Player');
  const [playerId, setPlayerId] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on("connect", () => {
      console.log("🟢 Socket connected, joining room...");

      socketService.joinRoom(roomCode, playerName, (response) => {
        console.log("JOIN RESPONSE:", response);

        if (response.success) {
          setPlayerId(response.playerId);
          setConnected(true);
        } else {
          setError(response.error);
        }
      });
    });


    // Listen for game events
    socket.on('game:started', ({ gameName }) => {
      setGameStarted(true);
      console.log('Game started:', gameName);
    });

    socket.on('game:ended', ({ finalScores }) => {
      setGameStarted(false);
      console.log('Game ended:', finalScores);
    });

    socket.on('room:closed', ({ reason }) => {
      alert(`Room closed: ${reason}`);
      navigate('/join');
    });

    return () => {
      socketService.disconnect();
    };
  }, [roomCode, playerName, navigate]);

  const handleInput = (input) => {
    if (connected && playerId) {
      socketService.sendInput(roomCode, playerId, input);
    }
  };

  if (error) {
    return (
      <div className="controller-error">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/join')} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!connected) {
    return <div className="loading">Connecting... </div>;
  }

  return (
    <div className="controller-container">
      <header className="controller-header">
        <div className="player-info">
          <span className="player-name">{playerName}</span>
          <span className="room-badge">Room: {roomCode}</span>
        </div>
        <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </header>

      {! gameStarted ? (
        <div className="waiting-screen">
          <h2>⏳ Waiting for game to start...</h2>
          <p>The host will start the game soon</p>
        </div>
      ) : (
        <ControllerUI onInput={handleInput} playerName={playerName} />
      )}
    </div>
  );
}

export default Controller;