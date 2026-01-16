import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import socketService from '../utils/socket.js';
import QuizGameScreen from '../components/QuizGameScreen.jsx';
import QuizConfigPanel from '../components/QuizConfigPanel.jsx';
import SpyGameScreen from '../components/SpyGameScreen.jsx';
import PlayerList from '../components/PlayerList.jsx';
import './Host.css';

function Host() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [roomState, setRoomState] = useState('WAITING'); // WAITING → CONFIG → PLAYING → FINISHED
  const [hostPlayerId, setHostPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configReady, setConfigReady] = useState(false);
  const [currentGame, setCurrentGame] = useState(null); // 'quiz' or 'spy'

  useEffect(() => {
    const socket = socketService.connect();

    // Create room
    socketService.createRoom((response) => {
      if (response.success) {
        const code = response.roomCode;
        setRoomCode(code);
        
        // Host must join their own room as the first player
        socketService.joinRoom(code, 'Host', (joinResponse) => {
          if (joinResponse.success) {
            console.log('✅ Host joined as player:', joinResponse);
            setHostPlayerId(joinResponse.playerId);
            setIsHost(joinResponse.isHost);
            setLoading(false);
          } else {
            console.error('❌ Failed to join room:', joinResponse.error);
          }
        });
      } else {
        console.error('Failed to create room:', response.error);
      }
    });

    // Listen for players joining
    socket.on('player:joined', ({ player, players: updatedPlayers, hostPlayerId: hpId, roomState: rState }) => {
      console.log('Player joined event:', player, 'Host ID:', hpId, 'State:', rState);
      setPlayers(updatedPlayers);
      
      if (hpId) {
        setHostPlayerId(hpId);
      }
      
      if (rState) {
        setRoomState(rState);
      }
      
      // Update isHost status if this socket matches the host
      if (socket.id === player.socketId && player.id === hpId) {
        setIsHost(true);
        console.log('✅ This socket is the HOST');
      }
    });

    // Listen for room state changes
    socket.on('room:state-changed', (data) => {
      console.log('Room state changed:', data.state);
      setRoomState(data.state);
      if (data.hostPlayerId) setHostPlayerId(data.hostPlayerId);
      if (data.gameType) setCurrentGame(data.gameType);
    });

    // Listen for config ready
    socket.on('quiz:config-ready', () => {
      setConfigReady(true);
    });

    // Listen for players leaving
    socket.on('player:left', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleSelectQuiz = () => {
    if (players.length === 0) {
      alert('Wait for players to join!');
      return;
    }

    socketService.getSocket().emit('game:select', {
      roomCode,
      playerId: hostPlayerId,
      gameType: 'quiz'
    }, (response) => {
      if (!response?.success) {
        console.error('Failed to select game:', response?.error);
      } else {
        setCurrentGame('quiz');
      }
    });
  };

  const handleSelectSpy = () => {
    if (players.length < 3) {
      alert('Need at least 3 players for Who Is The Spy!');
      return;
    }

    // For spy game, we go directly to PLAYING, no config needed
    setCurrentGame('spy');
    setRoomState('PLAYING');
  };

  const handleConfigConfirmed = () => {
    setConfigReady(true);
  };

  const handleStartGame = () => {
    if (!configReady) {
      alert('Please confirm settings first!');
      return;
    }

    socketService.getSocket().emit('quiz:start', {
      roomCode,
      playerId: hostPlayerId
    }, (response) => {
      if (!response?.success) {
        console.error('Failed to start quiz:', response?.error);
        alert(response?.error || 'Failed to start game');
      }
    });
  };

  const handleEndGame = (finalScores) => {
    setRoomState('WAITING');
    setConfigReady(false);
    setCurrentGame(null);
  };

  const joinUrl = `${window.location.origin}/join`;

  if (loading) {
    return <div className="loading">Creating room...</div>;
  }

  // WAITING STATE - Show game selection
  if (roomState === 'WAITING') {
    return (
      <div className="host-container">
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
              <h2>How to Join:</h2>
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
                  <h3>🔗 Or visit:</h3>
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
              
              {/* Debug info */}
              <div style={{ margin: '20px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                <small>Debug: isHost={isHost ? 'YES' : 'NO'} | hostPlayerId={hostPlayerId} | players={players.length}</small>
              </div>
              
              {players.length > 0 && (
                <div className="game-controls">
                  <button 
                    onClick={handleSelectQuiz}
                    className="btn btn-primary btn-large"
                    disabled={!isHost}
                    style={{ opacity: isHost ? 1 : 0.5, marginBottom: '1rem' }}
                  >
                    {isHost ? '🎯 Quiz Battle' : 'Waiting for Host...'}
                  </button>
                  
                  <button 
                    onClick={handleSelectSpy}
                    className="btn btn-warning btn-large"
                    disabled={!isHost || players.length < 3}
                    style={{ opacity: isHost && players.length >= 3 ? 1 : 0.5 }}
                  >
                    {isHost ? '🕵️ Who Is The Spy' : 'Waiting for Host...'}
                  </button>
                  
                  {!isHost && <p style={{ color: '#ff6b6b', marginTop: '10px' }}>Only the host can start the game</p>}
                  {isHost && players.length < 3 && <p style={{ color: '#ffd93d', marginTop: '10px' }}>Need at least 3 players for Who Is The Spy</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CONFIG STATE - Show configuration panel (HOST ONLY)
  if (roomState === 'CONFIG') {
    return (
      <div className="host-container">
        <header className="config-header">
          <h1>Room: {roomCode}</h1>
          <p>{players.length} Players Connected</p>
        </header>

        {isHost ? (
          <>
            <QuizConfigPanel 
              roomCode={roomCode}
              playerId={hostPlayerId}
              onConfigConfirmed={handleConfigConfirmed}
            />
            
            {configReady && (
              <div className="start-game-section">
                <button 
                  onClick={handleStartGame}
                  className="btn btn-primary btn-large"
                >
                  Start Game Now! 🚀
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="waiting-for-host">
            <h2>Host is configuring the game...</h2>
            <p>Please wait</p>
          </div>
        )}
      </div>
    );
  }

  // PLAYING STATE - Show game screen
  if (roomState === 'PLAYING') {
    if (currentGame === 'spy') {
      return (
        <SpyGameScreen 
          roomCode={roomCode}
          playerId={hostPlayerId}
          players={players}
          onBackToLobby={() => {
            setRoomState('WAITING');
            setCurrentGame(null);
          }}
        />
      );
    }
    
    return (
      <QuizGameScreen 
        roomCode={roomCode}
        players={players}
        onEndGame={handleEndGame}
      />
    );
  }

  // FINISHED STATE
  if (roomState === 'FINISHED') {
    return (
      <div className="host-container">
        <h1>🏆 Game Finished!</h1>
        <button onClick={() => setRoomState('WAITING')} className="btn btn-primary">
          Back to Lobby
        </button>
      </div>
    );
  }

  return null;
}

export default Host;
