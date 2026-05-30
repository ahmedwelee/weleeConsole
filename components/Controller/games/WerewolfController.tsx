import React, { useState, useEffect } from 'react';
import { GameState, WerewolfRole, GamePhase } from '../../../types';
import { Moon, Sun, AlertCircle, Eye, Heart, Wand2 } from 'lucide-react';

const WerewolfController: React.FC<{ gameState: GameState; myId: string }> = ({ gameState, myId }) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const phase = gameState.gameData?.phase;
  const roles = gameState.gameData?.roles;
  const myRole = roles?.[myId];
  const eliminated = gameState.gameData?.eliminated || [];

  // Get available targets (alive players excluding self)
  const availableTargets = gameState.players.filter(
    p => p.id !== myId && !eliminated.includes(p.id)
  );

  const canPerformAction = (phase: GamePhase): boolean => {
    if (phase !== GamePhase.NIGHT) return false;

    switch (myRole) {
      case WerewolfRole.SEER:
      case WerewolfRole.DOCTOR:
      case WerewolfRole.INVESTIGATOR:
      case WerewolfRole.WITCH:
      case WerewolfRole.WOLF_SEER:
      case WerewolfRole.SERIAL_KILLER:
        return true;
      case WerewolfRole.WEREWOLF:
      case WerewolfRole.ALPHA_WOLF:
      case WerewolfRole.YOUNG_WOLF:
      case WerewolfRole.HIDDEN_WOLF:
      case WerewolfRole.HYPNOTIST_WOLF:
        return true;
      default:
        return false;
    }
  };

  const getActionName = (): string => {
    switch (myRole) {
      case WerewolfRole.SEER:
        return 'Investigate';
      case WerewolfRole.DOCTOR:
        return 'Protect';
      case WerewolfRole.WEREWOLF:
      case WerewolfRole.ALPHA_WOLF:
        return 'Eliminate';
      case WerewolfRole.WITCH:
        return 'Use Potion';
      case WerewolfRole.SERIAL_KILLER:
        return 'Kill';
      case WerewolfRole.WOLF_SEER:
        return 'Investigate';
      case WerewolfRole.INVESTIGATOR:
        return 'Check Connection';
      default:
        return 'Action';
    }
  };

  const getRoleIcon = () => {
    switch (myRole) {
      case WerewolfRole.SEER:
        return <Eye className="mr-2" />;
      case WerewolfRole.DOCTOR:
        return <Heart className="mr-2" />;
      case WerewolfRole.WITCH:
        return <Wand2 className="mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full p-4">
      {/* Phase Indicator */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 text-5xl font-black">
          {phase === GamePhase.NIGHT ? (
            <Moon size={50} className="text-slate-300" />
          ) : (
            <Sun size={50} className="text-yellow-400" />
          )}
        </div>
        <p className="text-2xl font-bold">{phase === GamePhase.NIGHT ? '🌙 Night Phase' : '☀️ Day Phase'}</p>
      </div>

      {/* Role Card */}
      <div className="w-full max-w-sm bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border-2 border-slate-700 space-y-4">
        <div className="text-center">
          <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">Your Role</p>
          <p className="text-3xl font-black mt-2" style={{ color: myRole ? getRoleColor(myRole) : '#9ca3af' }}>
            {myRole ? myRole.replace(/_/g, ' ') : 'Unknown'}
          </p>
        </div>

        {myRole && (
          <div className="text-sm text-slate-300 text-center space-y-2">
            <p className="font-bold">Objective:</p>
            <p>{getRoleObjective(myRole)}</p>
          </div>
        )}
      </div>

      {/* Action Section */}
      {canPerformAction(phase as GamePhase) && (
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => setShowActions(!showActions)}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center"
          >
            {getRoleIcon()}
            {getActionName()}
          </button>

          {showActions && (
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-2">
              <p className="text-sm text-slate-400 font-bold mb-3">Select a target:</p>
              {availableTargets.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    setSelectedTarget(player.id);
                    // Send action to server
                    console.log(`[WEREWOLF] ${getActionName()} selected: ${player.name}`);
                  }}
                  className={`w-full p-3 rounded-lg transition-all text-left ${
                    selectedTarget === player.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  style={{
                    borderLeft: `4px solid ${player.color}`,
                  }}
                >
                  <div className="font-bold">{player.name}</div>
                  <div className="text-xs text-slate-300">
                    {selectedTarget === player.id ? '✓ Selected' : 'Tap to select'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Players Status */}
      <div className="w-full max-w-sm space-y-3">
        <p className="text-sm text-slate-400 font-bold uppercase">Players</p>
        <div className="space-y-2">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`p-3 rounded-lg flex items-center justify-between ${
                eliminated.includes(player.id)
                  ? 'bg-slate-800/50 opacity-50'
                  : 'bg-slate-800'
              }`}
              style={{
                borderLeft: `4px solid ${player.color}`,
              }}
            >
              <span className="font-bold text-white">{player.name}</span>
              <span className="text-xs text-slate-400">
                {eliminated.includes(player.id) ? '✗' : '✓'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="w-full max-w-sm bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-2">
        <div className="flex gap-2 text-sm text-slate-300">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            {phase === GamePhase.NIGHT
              ? 'Perform your action if you have one!'
              : 'Wait for the night phase to act.'}
          </div>
        </div>
      </div>
    </div>
  );
};

function getRoleColor(role: WerewolfRole): string {
  const werewolfRoles = [
    WerewolfRole.WEREWOLF,
    WerewolfRole.ALPHA_WOLF,
    WerewolfRole.WOLF_SEER,
    WerewolfRole.YOUNG_WOLF,
    WerewolfRole.HIDDEN_WOLF,
    WerewolfRole.HYPNOTIST_WOLF,
  ];

  const independentRoles = [
    WerewolfRole.TANNER,
    WerewolfRole.WHITE_WEREWOLF,
    WerewolfRole.SERIAL_KILLER,
  ];

  if (werewolfRoles.includes(role)) return '#ef4444';
  if (independentRoles.includes(role)) return '#f97316';
  return '#3b82f6';
}

function getRoleObjective(role: WerewolfRole): string {
  switch (role) {
    case WerewolfRole.VILLAGER:
      return 'Find and eliminate all werewolves';
    case WerewolfRole.SEER:
      return 'Investigate players to find werewolves';
    case WerewolfRole.DOCTOR:
      return 'Protect villagers from werewolf attacks';
    case WerewolfRole.WEREWOLF:
      return 'Eliminate villagers until wolves equal or outnumber villagers';
    case WerewolfRole.ALPHA_WOLF:
      return 'Lead the wolf team to victory';
    case WerewolfRole.SERIAL_KILLER:
      return 'Be the last survivor standing';
    case WerewolfRole.WHITE_WEREWOLF:
      return 'Eliminate everyone to be alone';
    case WerewolfRole.TANNER:
      return 'Get voted out by the village';
    default:
      return 'Survive and complete your team\'s objective';
  }
}

export default WerewolfController;
