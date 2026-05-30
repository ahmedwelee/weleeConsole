
import React from 'react';
import { GameState } from '../../types';
import { Users, QrCode } from 'lucide-react';
import QRCodeDisplay from '../QRCodeDisplay';
import { generateJoinURL, getNetworkInfo } from '../../services/mobile';

interface LobbyProps {
  gameState: GameState;
  onStart: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ gameState, onStart }) => {
  const network = getNetworkInfo();
  const joinURL = generateJoinURL(gameState.roomCode);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl text-slate-400 uppercase tracking-widest font-bold">Join the Game</h1>
      </div>

      {/* QR Code & Join Instructions */}
      <div className="w-full max-w-2xl">
        <QRCodeDisplay
          roomCode={gameState.roomCode}
          joinURL={joinURL}
          hostIP={network.hostIP}
        />
      </div>

      {/* Player Grid */}
      <div className="w-full max-w-5xl">
        <h2 className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-4">Connected Players ({gameState.players.length}/4)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              className={`p-4 rounded-2xl border-b-4 transition-all animate-bounce relative ${
                index === 0 ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
              }`}
              style={{ backgroundColor: `${player.color}22`, borderColor: player.color }}
            >
              {index === 0 && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-black px-2 py-1 rounded-full">
                  HOST
                </div>
              )}
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-3 overflow-hidden border-2 border-white/20">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt="avatar" />
              </div>
              <div className="text-center font-bold text-sm md:text-base truncate">{player.name}</div>
              <div className="text-xs text-slate-500 text-center mt-1">✓ Connected</div>
            </div>
          ))}
          {gameState.players.length < 4 && Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700 min-h-32 md:min-h-40">
              <Users size={32} />
              <span className="text-xs mt-2">Waiting...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-4">
        <button
          onClick={onStart}
          disabled={gameState.players.length === 0}
          className={`px-12 md:px-16 py-4 md:py-6 rounded-full text-xl md:text-3xl font-black transition-all ${
            gameState.players.length > 0 
            ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:scale-110 shadow-lg shadow-cyan-500/20 cursor-pointer' 
            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          {gameState.players.length > 0 ? 'START SESSION' : 'WAITING FOR PLAYERS...'}
        </button>
      </div>

      {/* Connection Info */}
      <div className="text-center text-xs text-slate-500 space-y-1 mt-4">
        <p>📱 Players can scan the QR code or enter the room code on their phones</p>
        {network.hostIP && (
          <p>🌐 Network: {network.protocol}://{network.hostIP}:{network.port}</p>
        )}
      </div>
    </div>
  );
};

export default Lobby;
