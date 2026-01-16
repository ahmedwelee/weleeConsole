import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import socketService from '../utils/socket.js';
import QuizController from '../components/QuizController';
import './Controller.css';

function Controller() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [playerName] = useState(searchParams.get('name') || 'Player');
  const [playerId, setPlayerId] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = socketService.connect();

    console.log(`🔄 Attempting to join room: ${roomCode} as ${playerName}`);
    console.log('🔍 DEBUG - URL params:', { roomCode, playerName });
    console.log('🔍 DEBUG - searchParams.get("name"):', searchParams.get('name'));

    // Join Room Logic
    socketService.joinRoom(roomCode, playerName, (response) => {
      if (response.success) {
        console.log('✅ Successfully joined room:', response);
        console.log('🔍 DEBUG - Player ID assigned:', response.playerId);
        console.log('🔍 DEBUG - Is Host?:', response.isHost);
        setPlayerId(response.playerId);
        setConnected(true);
        // Store for QuizController component
        localStorage.setItem('playerName', playerName);
      } else {
        console.error('❌ Failed to join room:', response.error);
        setError(response.error || 'Failed to join room');
      }
    });

    socket.on('room:closed', () => {
      alert('Room was closed by host');
      navigate('/join');
    });

    return () => {
      socket.off('room:closed');
      // Don't disconnect, QuizController needs the connection
    };
  }, [roomCode, playerName, navigate]);

  if (error) {
    return (
      <div className="controller-error">
        <h2>❌ Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/join')} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <h2>Connecting to Room {roomCode}...</h2>
        <p>Player: {playerName}</p>
      </div>
    );
  }

  // Connected - Show the QuizController (handles all states internally)
  return (
    <QuizController 
      playerId={playerId}
      roomCode={roomCode}
    />
  );
}

export default Controller;
