import React, { useEffect, useState, useRef } from 'react';
import socketService from '../utils/socket.js';
import './SpyGameScreen.css';

function SpyGameScreen({ roomCode, playerId, players, onBackToLobby }) {
  const [phase, setPhase] = useState('WAITING'); // WAITING -> REVEAL -> GAMEPLAY -> VOTING -> RESULT
  const [timer, setTimer] = useState(300);
  const [language, setLanguage] = useState('en');
  const [uiText, setUIText] = useState({});
  const [voteCount, setVoteCount] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const socket = socketService.getSocket();

    // Listen for game started event
    socket.on('spy:game-started', (data) => {
      console.log('Spy game started:', data);
      setPhase(data.phase);
      setTimer(data.timer);
      setUIText(data.uiText || {});
    });

    // Listen for voting started
    socket.on('spy:voting-started', (data) => {
      console.log('Voting started:', data);
      setPhase('VOTING');
      setVoteCount(0);
    });

    // Listen for vote updates
    socket.on('spy:vote-update', (data) => {
      setVoteCount(data.totalVotes);
    });

    // Listen for game results
    socket.on('spy:game-result', (data) => {
      console.log('Game result:', data);
      setPhase('RESULT');
      setResult(data);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    });

    // Listen for language changes
    socket.on('spy:language-changed', (data) => {
      setLanguage(data.language);
      setUIText(data.uiText || {});
    });

    return () => {
      socket.off('spy:game-started');
      socket.off('spy:voting-started');
      socket.off('spy:vote-update');
      socket.off('spy:game-result');
      socket.off('spy:language-changed');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (phase === 'GAMEPLAY' || phase === 'REVEAL') {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 0) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [phase]);

  const handleStartGame = () => {
    if (players.length < 3) {
      alert('Need at least 3 players to start!');
      return;
    }

    socketService.getSocket().emit('spy:start-game', {
      roomCode,
      playerId,
      language
    }, (response) => {
      if (!response?.success) {
        console.error('Failed to start game:', response?.error);
        alert(response?.error || 'Failed to start game');
      }
    });
  };

  const handleStartVoting = () => {
    socketService.getSocket().emit('spy:start-voting', {
      roomCode,
      playerId
    }, (response) => {
      if (!response?.success) {
        console.error('Failed to start voting:', response?.error);
      }
    });
  };

  const handleProcessVotes = () => {
    socketService.getSocket().emit('spy:process-votes', {
      roomCode,
      playerId
    }, (response) => {
      if (!response?.success) {
        console.error('Failed to process votes:', response?.error);
      }
    });
  };

  const handleNextRound = () => {
    socketService.getSocket().emit('spy:next-round', {
      roomCode,
      playerId
    }, (response) => {
      if (!response?.success) {
        console.error('Failed to start next round:', response?.error);
      }
    });
  };

  const handleLanguageToggle = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
    
    socketService.getSocket().emit('spy:change-language', {
      roomCode,
      playerId,
      language: newLanguage
    }, (response) => {
      if (!response?.success) {
        console.error('Failed to change language:', response?.error);
      }
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getText = (key) => uiText[key] || key;

  const isRTL = language === 'ar';

  return (
    <div className={`spy-game-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="spy-header">
        <div className="spy-title">
          <h1>🕵️ Who Is The Spy</h1>
          <div className="spy-room-code">
            {getText('room_code')}: <strong>{roomCode}</strong>
          </div>
        </div>
        <button 
          className="language-toggle"
          onClick={handleLanguageToggle}
        >
          {language === 'en' ? '🇸🇦 AR' : '🇬🇧 EN'}
        </button>
      </div>

      {/* Waiting Phase */}
      {phase === 'WAITING' && (
        <div className="spy-waiting">
          <div className="player-list-container">
            <h2>{getText('players')} ({players.length})</h2>
            <div className="player-avatars">
              {players.map(player => (
                <div key={player.id} className="player-avatar">
                  <div className="avatar-circle">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-name">{player.name}</div>
                </div>
              ))}
            </div>
          </div>
          <button 
            className="btn btn-primary btn-large"
            onClick={handleStartGame}
            disabled={players.length < 3}
          >
            {getText('start_game')}
          </button>
          {players.length < 3 && (
            <p className="warning">{getText('waiting_for_players')}</p>
          )}
        </div>
      )}

      {/* Reveal & Gameplay Phase */}
      {(phase === 'REVEAL' || phase === 'GAMEPLAY') && (
        <div className="spy-gameplay">
          <div className="timer-display">
            <div className="timer-icon">⏱️</div>
            <div className="timer-value">{formatTime(timer)}</div>
          </div>

          <div className="gameplay-message">
            <h2>{phase === 'REVEAL' ? getText('round_starting') : '💬 ' + (language === 'ar' ? 'الآن اسأل الأسئلة!' : 'Ask Questions Now!')}</h2>
            <p>{language === 'ar' ? 'اللاعبون ينظرون إلى هواتفهم' : 'Players check their phones for roles'}</p>
          </div>

          <div className="player-list-container">
            <h3>{getText('players')}</h3>
            <div className="player-grid">
              {players.map(player => (
                <div key={player.id} className="player-card">
                  <div className="player-avatar-small">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-warning btn-large"
            onClick={handleStartVoting}
          >
            {getText('vote_now')}
          </button>
        </div>
      )}

      {/* Voting Phase */}
      {phase === 'VOTING' && (
        <div className="spy-voting">
          <h2>{getText('voting')}</h2>
          <div className="voting-status">
            <p>{getText('waiting_votes')}</p>
            <div className="vote-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(voteCount / players.length) * 100}%` }}
                ></div>
              </div>
              <span>{voteCount} / {players.length} {getText('votes')}</span>
            </div>
          </div>

          <div className="player-list-container">
            <div className="player-grid">
              {players.map(player => (
                <div key={player.id} className="player-card voting">
                  <div className="player-avatar-small">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-primary btn-large"
            onClick={handleProcessVotes}
            disabled={voteCount < players.length}
          >
            {language === 'ar' ? 'عرض النتائج' : 'Show Results'}
          </button>
        </div>
      )}

      {/* Result Phase */}
      {phase === 'RESULT' && result && (
        <div className="spy-result">
          <div className={`result-banner ${result.winner === 'SPY' ? 'spy-wins' : 'civilians-win'}`}>
            <h1>{result.winner === 'SPY' ? getText('spy_wins') : getText('civilians_win')}</h1>
            <p className="reason">{result.reason}</p>
          </div>

          <div className="reveal-info">
            <div className="reveal-card spy-reveal">
              <h3>{getText('the_spy_was')}</h3>
              <div className="reveal-player">
                {players.find(p => p.id === result.spyId)?.name || 'Unknown'}
              </div>
            </div>

            <div className="reveal-card location-reveal">
              <h3>{getText('the_location_was')}</h3>
              <div className="reveal-location">
                📍 {result.location}
              </div>
            </div>
          </div>

          {result.voteCounts && (
            <div className="vote-results">
              <h3>{getText('votes')}</h3>
              <div className="vote-list">
                {Object.entries(result.voteCounts).map(([playerId, count]) => (
                  <div key={playerId} className="vote-item">
                    <span>{players.find(p => p.id === playerId)?.name}</span>
                    <span className="vote-count">{count} {getText('votes')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={handleNextRound}
            >
              {getText('play_again')}
            </button>
            <button 
              className="btn btn-secondary btn-large"
              onClick={onBackToLobby}
            >
              {getText('back_to_lobby')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpyGameScreen;
