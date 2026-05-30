import React, { useState, useEffect } from 'react';
import { GameState, WerewolfRole, GamePhase } from '../../../types';
import { Moon, Sun, Users, Skull } from 'lucide-react';

const WerewolfGame: React.FC<{ gameState: GameState; updateGameState: any }> = ({ gameState, updateGameState }) => {
  const [timer, setTimer] = useState(30);
  const [revealed, setRevealed] = useState(false);

  // Get data from gameState
  const phase = gameState.gameData?.phase || GamePhase.NIGHT;
  const day = gameState.gameData?.day || 1;

  // Initialize roles on first load
  useEffect(() => {
    if (!gameState.gameData?.roles) {
      console.log('[WEREWOLF] Initializing game data with roles');
      const roles = assignRoles(gameState.players);
      const teams = getTeams(roles);

      updateGameState((prev: any) => ({
        ...prev,
        gameData: {
          phase: GamePhase.NIGHT,
          day: 1,
          roles,
          teams,
          nightActions: {},
          votes: {},
          eliminated: [],
          alive: gameState.players.map((p: any) => p.id),
          winner: null
        }
      }));

      console.log('[WEREWOLF] Roles assigned:', roles);
      console.log('[WEREWOLF] Teams:', teams);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      handlePhaseTransition();
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, phase]);

  const assignRoles = (players: any[]) => {
    const roleList = [
      WerewolfRole.WEREWOLF,
      WerewolfRole.WEREWOLF,
      WerewolfRole.SEER,
      WerewolfRole.DOCTOR,
      WerewolfRole.VILLAGER,
      WerewolfRole.VILLAGER,
      WerewolfRole.VILLAGER,
      WerewolfRole.VILLAGER,
    ];

    const roles: Record<string, WerewolfRole> = {};
    const shuffled = roleList.sort(() => Math.random() - 0.5);

    players.forEach((player, idx) => {
      roles[player.id] = shuffled[idx] || WerewolfRole.VILLAGER;
    });

    return roles;
  };

  const getTeams = (roles: Record<string, WerewolfRole>) => {
    const teams: Record<string, 'VILLAGE' | 'WEREWOLF' | 'INDEPENDENT'> = {};

    Object.entries(roles).forEach(([playerId, role]) => {
      if ([WerewolfRole.WEREWOLF, WerewolfRole.ALPHA_WOLF, WerewolfRole.WOLF_SEER, WerewolfRole.YOUNG_WOLF, WerewolfRole.HIDDEN_WOLF, WerewolfRole.HYPNOTIST_WOLF].includes(role)) {
        teams[playerId] = 'WEREWOLF';
      } else if ([WerewolfRole.TANNER, WerewolfRole.WHITE_WEREWOLF, WerewolfRole.SERIAL_KILLER, WerewolfRole.REPENTANT_WEREWOLF, WerewolfRole.PIED_PIPER, WerewolfRole.THIEF, WerewolfRole.SOUL_COLLECTOR].includes(role)) {
        teams[playerId] = 'INDEPENDENT';
      } else {
        teams[playerId] = 'VILLAGE';
      }
    });

    return teams;
  };

  const handlePhaseTransition = () => {
    let nextPhase: GamePhase;
    let nextDay = day;

    if (phase === GamePhase.NIGHT) {
      nextPhase = GamePhase.DAY;
      setTimer(60); // 1 minute for day discussion
    } else if (phase === GamePhase.DAY) {
      nextPhase = GamePhase.VOTING;
      setTimer(30); // 30 seconds for voting
    } else if (phase === GamePhase.VOTING) {
      nextPhase = GamePhase.NIGHT;
      nextDay = day + 1;
      setTimer(20); // 20 seconds for night actions
    } else {
      return;
    }

    // Update gameState with new phase and day
    updateGameState((prev: any) => ({
      ...prev,
      gameData: {
        ...prev.gameData,
        phase: nextPhase,
        day: nextDay
      }
    }));
  };

  const getRoleDescription = (role: WerewolfRole): string => {
    const descriptions: Record<WerewolfRole, string> = {
      [WerewolfRole.VILLAGER]: 'No special abilities',
      [WerewolfRole.WEREWOLF]: 'Eliminate villagers at night',
      [WerewolfRole.SEER]: 'Investigate one player each night',
      [WerewolfRole.DOCTOR]: 'Protect one player each night',
      [WerewolfRole.HUNTER]: 'Eliminate another player when you die',
      [WerewolfRole.WITCH]: 'Two potions: revive or poison',
      [WerewolfRole.CUPID]: 'Link two players as lovers',
      [WerewolfRole.MAYOR]: 'Your vote counts as two',
      [WerewolfRole.LITTLE_GIRL]: 'Watch the wolves at night',
      [WerewolfRole.TAVERN_KEEPER]: 'Sacrifice yourself to protect another',
      [WerewolfRole.INVESTIGATOR]: 'Learn if two players are on same team',
      [WerewolfRole.FOOL]: 'Survive the first elimination',
      [WerewolfRole.KNIGHT]: 'Kill the wolf to your left if attacked',
      [WerewolfRole.ELDER]: 'Survive two wolf attacks',
      [WerewolfRole.ALPHA_WOLF]: 'Final decision on wolf elimination',
      [WerewolfRole.WOLF_SEER]: 'Investigate players like the Seer',
      [WerewolfRole.YOUNG_WOLF]: 'Wolves eliminate 2 players when you die',
      [WerewolfRole.HIDDEN_WOLF]: 'Appear as villager to Seers',
      [WerewolfRole.HYPNOTIST_WOLF]: 'Revealed when first wolf dies',
      [WerewolfRole.TANNER]: 'Win by being voted out',
      [WerewolfRole.WHITE_WEREWOLF]: 'Kill anyone to win',
      [WerewolfRole.SERIAL_KILLER]: 'Eliminate one player each night',
      [WerewolfRole.REPENTANT_WEREWOLF]: 'Become werewolf if mentor dies',
      [WerewolfRole.PIED_PIPER]: 'Charm all players to win',
      [WerewolfRole.THIEF]: 'Choose between two extra roles',
      [WerewolfRole.SOUL_COLLECTOR]: 'Convert players into servants',
    };
    return descriptions[role] || '';
  };

  const getRoleColor = (role: WerewolfRole | undefined): string => {
    if (!role) return '#6b7280';
    if ([WerewolfRole.WEREWOLF, WerewolfRole.ALPHA_WOLF, WerewolfRole.WOLF_SEER, WerewolfRole.YOUNG_WOLF, WerewolfRole.HIDDEN_WOLF, WerewolfRole.HYPNOTIST_WOLF].includes(role)) {
      return '#ef4444'; // Red for werewolves
    }
    if ([WerewolfRole.TANNER, WerewolfRole.WHITE_WEREWOLF, WerewolfRole.SERIAL_KILLER].includes(role)) {
      return '#f97316'; // Orange for independent killers
    }
    return '#3b82f6'; // Blue for village
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-6xl font-black">
          {phase === GamePhase.NIGHT ? <Moon size={60} className="text-slate-300" /> : <Sun size={60} className="text-yellow-400" />}
          <span>{phase}</span>
        </div>
        <p className="text-4xl font-bold">Day {day}</p>
        <p className="text-2xl text-slate-400">Time: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</p>
      </div>

      {/* Players Grid */}
      <div className="w-full max-w-6xl grid grid-cols-3 md:grid-cols-5 gap-4">
        {gameState.players.map((player) => {
          const role = gameState.gameData?.roles[player.id] as WerewolfRole | undefined;
          const isAlive = !gameState.gameData?.eliminated.includes(player.id);

          return (
            <div
              key={player.id}
              className={`p-4 rounded-2xl border-b-4 text-center transition-all ${
                !isAlive ? 'opacity-50 grayscale' : ''
              }`}
              style={{
                backgroundColor: `${player.color}22`,
                borderColor: player.color,
              }}
            >
              {!isAlive && <Skull className="mx-auto mb-2 text-red-500" size={24} />}
              <div className="text-xs font-bold text-slate-400 mb-1">
                {role && revealed ? role.replace(/_/g, ' ') : '?'}
              </div>
              <div className="text-sm font-bold truncate">{player.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                {isAlive ? '✓ Alive' : '✗ Eliminated'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase Info */}
      <div className="w-full max-w-2xl bg-slate-900/50 p-6 rounded-2xl border border-slate-700 space-y-4">
        <h3 className="text-2xl font-bold text-center">
          {phase === GamePhase.NIGHT ? '🌙 Night Phase' : phase === GamePhase.DAY ? '☀️ Day Phase' : '🗳️ Voting Time'}
        </h3>

        {phase === GamePhase.NIGHT && (
          <div className="text-center space-y-2 text-slate-300">
            <p>Special roles are performing their actions...</p>
            <p className="text-sm">Seers investigate, Doctors protect, Wolves eliminate</p>
          </div>
        )}

        {phase === GamePhase.DAY && (
          <div className="text-center space-y-2 text-slate-300">
            <p>Discuss and figure out who the werewolves are!</p>
            <p className="text-sm">Look for suspicious behavior and vote someone out</p>
          </div>
        )}

        {phase === GamePhase.VOTING && (
          <div className="text-center space-y-2 text-slate-300">
            <p>It's time to vote!</p>
            <p className="text-sm">Who will be eliminated?</p>
          </div>
        )}
      </div>

      {/* Reveal Roles Button */}
      <button
        onClick={() => setRevealed(!revealed)}
        className={`px-8 py-3 rounded-full font-bold text-lg transition-all ${
          revealed 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        {revealed ? '🔒 Hide Roles' : '👁️ Show Roles'}
      </button>
    </div>
  );
};

export default WerewolfGame;
