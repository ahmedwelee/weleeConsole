import React, { useEffect, useState, useRef } from 'react';
import socketService from '../utils/socket.js';
import './GameScreen.css';

function GameScreen({ roomCode, players, gameName, onEndGame }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    positions: {},
    scores: {},
    countdown: 3
  });
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    // Initialize player positions
    const initialPositions = {};
    const initialScores = {};
    players.forEach((player, index) => {
      initialPositions[player.id] = {
        x: 50,
        y: 100 + (index * 80),
        speed: 0
      };
      initialScores[player.id] = 0;
    });
    
    setGameState(prev => ({
      ...prev,
      positions: initialPositions,
      scores: initialScores
    }));

    // Countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setGameState(prev => ({ ...prev, countdown: count }));
      if (count <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Listen for controller inputs
    socket.on('game:input', ({ playerId, input }) => {
      handlePlayerInput(playerId, input);
    });

    // Start game loop
    startGameLoop();

    return () => {
      socket.off('game:input');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(countdownInterval);
    };
  }, [players]);

  const handlePlayerInput = (playerId, input) => {
    setGameState(prev => {
      const newPositions = { ...prev.positions };
      const playerPos = newPositions[playerId];
      
      if (! playerPos) return prev;

      if (input.type === 'button') {
        if (input.button === 'A' && input.action === 'down') {
          playerPos.speed = Math.min(playerPos.speed + 2, 10);
        } else if (input.button === 'B' && input.action === 'down') {
          playerPos.speed = Math.max(playerPos.speed - 1, 0);
        }
      } else if (input.type === 'joystick') {
        playerPos.y += input.y * 5;
        playerPos.y = Math.max(50, Math.min(playerPos. y, 550));
      }

      return { ...prev, positions: newPositions };
    });
  };

  const startGameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const FINISH_LINE = 1200;

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas. width, canvas.height);
      
      // Draw track
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw lanes
      ctx.strokeStyle = '#ECF0F1';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      for (let i = 1; i < players.length; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 80 + 60);
        ctx.lineTo(canvas.width, i * 80 + 60);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      
      // Draw finish line
      ctx.fillStyle = '#F39C12';
      ctx. fillRect(FINISH_LINE, 0, 5, canvas.height);
      
      // Update and draw players
      const newPositions = { ...gameState.positions };
      const newScores = { ...gameState.scores };
      let someoneFinished = false;

      players. forEach((player, index) => {
        const pos = newPositions[player.id];
        if (! pos) return;

        // Update position
        if (gameState.countdown <= 0 && pos.x < FINISH_LINE) {
          pos.x += pos.speed;
          pos.speed *= 0.98; // Friction
        }

        // Check if finished
        if (pos.x >= FINISH_LINE && newScores[player.id] === 0) {
          newScores[player.id] = players.length - Object.values(newScores).filter(s => s > 0).length;
          someoneFinished = true;
        }

        // Draw car
        const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12', '#1ABC9C'];
        ctx.fillStyle = colors[index % colors.length];
        ctx. fillRect(pos.x, pos.y - 15, 60, 30);
        
        // Draw player name
        ctx.fillStyle = '#ECF0F1';
        ctx.font = '14px Arial';
        ctx.fillText(player.name, pos. x, pos.y - 20);
        
        // Draw score if finished
        if (newScores[player.id] > 0) {
          ctx.fillStyle = '#F39C12';
          ctx. font = 'bold 20px Arial';
          ctx.fillText(`#${newScores[player.id]}`, pos.x + 70, pos.y + 5);
        }
      });

      setGameState(prev => ({
        ...prev,
        positions: newPositions,
        scores: newScores
      }));

      // Check if all finished
      const finishedCount = Object.values(newScores).filter(s => s > 0).length;
      if (finishedCount === players.length) {
        setGameOver(true);
        setTimeout(() => {
          onEndGame(newScores);
        }, 3000);
        return;
      }

      // Draw countdown
      if (gameState.countdown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#F39C12';
        ctx. font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameState. countdown, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
      } else if (gameState.countdown === 0) {
        ctx.fillStyle = '#2ECC71';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <h2>🏎️ Racing Game</h2>
        <div className="game-info">
          <span>Room:  {roomCode}</span>
          <span>Players: {players.length}</span>
        </div>
      </div>
      
      <div className="game-canvas-container">
        <canvas 
          ref={canvasRef} 
          width={1400} 
          height={600}
          className="game-canvas"
        />
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <h2>🏁 Race Finished!</h2>
          <div className="final-scores">
            {players
              .sort((a, b) => gameState.scores[a.id] - gameState.scores[b.id])
              .map((player, index) => (
                <div key={player.id} className="score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{player.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="game-instructions">
        <p>📱 <strong>A Button:</strong> Accelerate | <strong>B Button:</strong> Brake | <strong>Joystick: </strong> Move Up/Down</p>
      </div>
    </div>
  );
}

export default GameScreen;