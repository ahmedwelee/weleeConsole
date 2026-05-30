import React, { useMemo } from 'react';
import { GameState, Player } from '../../../types';
import { Flag, Trophy, Timer, Download, Gamepad2 } from 'lucide-react';

interface STKCompanionGameData {
  phase?: 'SETUP' | 'COUNTDOWN' | 'RACING' | 'FINISHED';
  lapGoal?: number;
  trackName?: string;
  startedAt?: number;
}

interface STKCompanionGameProps {
  gameState: GameState;
  updateGameState: (updater: (prev: GameState) => GameState) => void;
}

const getLapProgress = (playerId: string, gameData: any, lapGoal: number) => {
  const map = gameData?.lapProgress || {};
  const value = Number(map[playerId] || 0);
  return Math.max(0, Math.min(lapGoal, value));
};

const sortByProgress = (players: Player[], gameData: any, lapGoal: number) => {
  return [...players].sort((a, b) => {
    const bLap = getLapProgress(b.id, gameData, lapGoal);
    const aLap = getLapProgress(a.id, gameData, lapGoal);
    if (bLap !== aLap) return bLap - aLap;
    return b.score - a.score;
  });
};

const STKCompanionGame: React.FC<STKCompanionGameProps> = ({ gameState, updateGameState }) => {
  const data = (gameState.gameData || {}) as STKCompanionGameData & {
    lapProgress?: Record<string, number>;
    raceOrder?: string[];
  };

  const phase = data.phase || 'SETUP';
  const lapGoal = Number(data.lapGoal || 3);
  const trackName = data.trackName || 'Zen Garden';

  const leaderboard = useMemo(
    () => sortByProgress(gameState.players, gameState.gameData, lapGoal),
    [gameState.players, gameState.gameData, lapGoal]
  );

  const startCountdown = () => {
    updateGameState((prev) => ({
      ...prev,
      gameData: {
        ...prev.gameData,
        phase: 'COUNTDOWN',
        startedAt: Date.now(),
        lapProgress: prev.players.reduce((acc: Record<string, number>, p) => {
          acc[p.id] = 0;
          return acc;
        }, {})
      }
    }));

    // Move to race phase after a short host countdown.
    setTimeout(() => {
      updateGameState((prev) => ({
        ...prev,
        gameData: {
          ...prev.gameData,
          phase: 'RACING'
        }
      }));
    }, 3200);
  };

  const finishRace = () => {
    updateGameState((prev) => ({
      ...prev,
      gameData: {
        ...prev.gameData,
        phase: 'FINISHED'
      }
    }));
  };

  const resetRace = () => {
    updateGameState((prev) => ({
      ...prev,
      gameData: {
        phase: 'SETUP',
        lapGoal,
        trackName,
        lapProgress: prev.players.reduce((acc: Record<string, number>, p) => {
          acc[p.id] = 0;
          return acc;
        }, {})
      }
    }));
  };

  return (
    <div className="flex-1 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-emerald-400">SUPER TUX KART MODE</h1>
              <p className="text-slate-400 mt-2">Use this room as the race companion while STK runs on desktop.</p>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Flag className="text-emerald-400" />
              <span className="font-bold">Track: {trackName}</span>
              <span className="text-slate-600">|</span>
              <span className="font-bold">Laps: {lapGoal}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-slate-300"><Download size={18} /> Run STK locally</div>
              <p className="text-sm text-slate-400 mt-2">Open SuperTuxKart on PC and choose a local race with this room players.</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-slate-300"><Gamepad2 size={18} /> Controller side</div>
              <p className="text-sm text-slate-400 mt-2">Players tap READY and then LAP+ from phones after each completed lap.</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-slate-300"><Timer size={18} /> Phase</div>
              <p className="text-sm text-slate-200 mt-2 font-bold">{phase}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {phase === 'SETUP' && (
              <button onClick={startCountdown} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black">
                START COUNTDOWN
              </button>
            )}
            {phase === 'RACING' && (
              <button onClick={finishRace} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black">
                FINISH RACE
              </button>
            )}
            {phase === 'FINISHED' && (
              <button onClick={resetRace} className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black">
                NEW RACE
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-400" />
            <h2 className="text-2xl font-black">Companion Leaderboard</h2>
          </div>
          <div className="space-y-3">
            {leaderboard.map((p, idx) => {
              const laps = getLapProgress(p.id, gameState.gameData, lapGoal);
              const percent = Math.round((laps / lapGoal) * 100);
              return (
                <div key={p.id} className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-black text-slate-300">#{idx + 1}</div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                      <div className="font-bold">{p.name}</div>
                    </div>
                    <div className="font-mono text-slate-300">{laps}/{lapGoal} laps</div>
                  </div>
                  <div className="mt-3 h-3 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default STKCompanionGame;
