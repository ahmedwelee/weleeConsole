import React, { useEffect, useState } from 'react';
import socketService from '../utils/socket.js';
import './SpyController.css';

function SpyController({ playerId, roomCode }) {
  const [phase, setPhase] = useState('WAITING');
  const [assignment, setAssignment] = useState(null); // { isSpy, role, location }
  const [uiText, setUIText] = useState({});
  const [language, setLanguage] = useState('en');
  const [players, setPlayers] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const socket = socketService.getSocket();

    // Listen for game started
    socket.on('spy:game-started', (data) => {
      console.log('Spy game started (controller)');
      setPhase(data.phase);
      setUIText(data.uiText || {});
      setHasVoted(false);
      setResult(null);
      setAssignment(null);
    });

    // Listen for role assignment
    socket.on('spy:assignment', (data) => {
      console.log('Received assignment:', data);
      setAssignment(data);
      setPhase('REVEAL');
    });

    // Listen for voting started
    socket.on('spy:voting-started', (data) => {
      console.log('Voting started (controller)');
      setPhase('VOTING');
      setPlayers(data.players || []);
      setHasVoted(false);
    });

    // Listen for game result
    socket.on('spy:game-result', (data) => {
      console.log('Game result (controller):', data);
      setPhase('RESULT');
      setResult(data);
    });

    // Listen for language changes
    socket.on('spy:language-changed', (data) => {
      setLanguage(data.language);
      setUIText(data.uiText || {});
    });

    return () => {
      socket.off('spy:game-started');
      socket.off('spy:assignment');
      socket.off('spy:voting-started');
      socket.off('spy:game-result');
      socket.off('spy:language-changed');
    };
  }, []);

  const handleVote = (votedForId) => {
    socketService.getSocket().emit('spy:submit-vote', {
      roomCode,
      playerId,
      votedForId
    }, (response) => {
      if (response?.success) {
        setHasVoted(true);
      } else {
        console.error('Vote failed:', response?.error);
      }
    });
  };

  const getText = (key) => uiText[key] || key;

  const isRTL = language === 'ar';
  const isSpy = assignment?.isSpy;

  return (
    <div className={`spy-controller ${isRTL ? 'rtl' : 'ltr'} ${isSpy ? 'spy-mode' : 'civilian-mode'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Waiting Phase */}
      {phase === 'WAITING' && (
        <div className="controller-waiting">
          <div className="waiting-icon">⏳</div>
          <h2>{getText('waiting_for_players')}</h2>
          <p>{language === 'ar' ? 'انتظر بداية الجولة' : 'Waiting for the round to start...'}</p>
        </div>
      )}

      {/* Reveal Phase - Show Role */}
      {phase === 'REVEAL' && assignment && (
        <div className={`controller-reveal ${isSpy ? 'spy-reveal' : 'civilian-reveal'}`}>
          {isSpy ? (
            <>
              <div className="reveal-icon spy-icon">🕵️</div>
              <h1 className="reveal-title">{getText('spy_msg')}</h1>
              <p className="reveal-message">{getText('figure_out_location')}</p>
              <div className="spy-warning">
                ⚠️ {language === 'ar' ? 'لا تفضح نفسك!' : 'Don\'t reveal yourself!'}
              </div>
            </>
          ) : (
            <>
              <div className="reveal-icon civilian-icon">✅</div>
              <h1 className="reveal-title">{getText('you_are_safe')}</h1>
              <div className="role-info">
                <div className="info-card location-card">
                  <div className="info-label">{getText('civilian_msg')}</div>
                  <div className="info-value">📍 {assignment.location}</div>
                </div>
                <div className="info-card role-card">
                  <div className="info-label">{getText('role_msg')}</div>
                  <div className="info-value">👤 {assignment.role}</div>
                </div>
              </div>
              <p className="reveal-hint">
                💡 {language === 'ar' ? 'تذكر دورك للمناقشة' : 'Remember your role for the discussion'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Gameplay Phase */}
      {phase === 'GAMEPLAY' && assignment && (
        <div className={`controller-gameplay ${isSpy ? 'spy-gameplay' : 'civilian-gameplay'}`}>
          {isSpy ? (
            <>
              <div className="gameplay-header">
                <h2>🕵️ {getText('spy_msg')}</h2>
              </div>
              <div className="gameplay-info">
                <p>{getText('figure_out_location')}</p>
                <div className="spy-tips">
                  <div className="tip">🎭 {language === 'ar' ? 'تصرف بشكل طبيعي' : 'Act natural'}</div>
                  <div className="tip">👂 {language === 'ar' ? 'استمع جيداً' : 'Listen carefully'}</div>
                  <div className="tip">🤔 {language === 'ar' ? 'اسأل أسئلة غامضة' : 'Ask vague questions'}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="gameplay-header">
                <h2>✅ {getText('you_are_safe')}</h2>
              </div>
              <div className="quick-reference">
                <div className="ref-item">
                  <span className="ref-label">{getText('civilian_msg')}</span>
                  <span className="ref-value">📍 {assignment.location}</span>
                </div>
                <div className="ref-item">
                  <span className="ref-label">{getText('role_msg')}</span>
                  <span className="ref-value">👤 {assignment.role}</span>
                </div>
              </div>
              <div className="civilian-tips">
                <p>💡 {language === 'ar' ? 'ابحث عن الجاسوس!' : 'Find the spy!'}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Voting Phase */}
      {phase === 'VOTING' && (
        <div className="controller-voting">
          <h2>{getText('who_is_spy')}</h2>
          <p className="voting-instruction">{getText('vote_for')}</p>
          
          {hasVoted ? (
            <div className="vote-confirmed">
              <div className="check-icon">✓</div>
              <p>{language === 'ar' ? 'تم التصويت!' : 'Vote Submitted!'}</p>
              <p className="wait-message">{getText('waiting_votes')}</p>
            </div>
          ) : (
            <div className="player-vote-list">
              {players.map(player => (
                player.id !== playerId && (
                  <button
                    key={player.id}
                    className="vote-button"
                    onClick={() => handleVote(player.id)}
                  >
                    <span className="vote-player-avatar">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="vote-player-name">{player.name}</span>
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result Phase */}
      {phase === 'RESULT' && result && assignment && (
        <div className="controller-result">
          <div className={`result-header ${
            (isSpy && result.winner === 'SPY') || (!isSpy && result.winner === 'CIVILIANS') 
              ? 'won' 
              : 'lost'
          }`}>
            <h1>
              {(isSpy && result.winner === 'SPY') || (!isSpy && result.winner === 'CIVILIANS')
                ? getText('you_won')
                : getText('you_lost')}
            </h1>
          </div>

          <div className="result-details">
            <div className="result-card">
              <div className="result-label">{getText('the_spy_was')}</div>
              <div className="result-value">
                {players.find(p => p.id === result.spyId)?.name || result.spyId}
                {result.spyId === playerId && ' (You!)'}
              </div>
            </div>

            <div className="result-card">
              <div className="result-label">{getText('the_location_was')}</div>
              <div className="result-value">📍 {result.location}</div>
            </div>

            {!isSpy && assignment.role && (
              <div className="result-card">
                <div className="result-label">{getText('role_msg')}</div>
                <div className="result-value">👤 {assignment.role}</div>
              </div>
            )}
          </div>

          <div className="waiting-next">
            <p>{language === 'ar' ? 'في انتظار الجولة التالية...' : 'Waiting for next round...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpyController;
