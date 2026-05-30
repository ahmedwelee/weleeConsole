import React from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';
import { Flag, CheckCircle2, Plus } from 'lucide-react';

interface STKCompanionControllerProps {
  gameState: GameState;
  myId: string;
}

const STKCompanionController: React.FC<STKCompanionControllerProps> = ({ gameState, myId }) => {
  const me = gameState.players.find((p) => p.id === myId);
  const phase = gameState.gameData?.phase || 'SETUP';
  const lapGoal = Number(gameState.gameData?.lapGoal || 3);
  const myLaps = Number(gameState.gameData?.lapProgress?.[myId] || 0);
  const done = myLaps >= lapGoal;

  const sendReady = () => {
    broadcast.send('CONTROLLER_INPUT', { action: 'STK_READY' }, myId);
  };

  const addLap = () => {
    if (phase !== 'RACING' || done) return;
    broadcast.send('CONTROLLER_INPUT', { action: 'STK_LAP_INCREMENT' }, myId);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-black text-emerald-400">STK COMPANION</h1>
          <p className="text-slate-400 mt-1">Player: <span className="font-bold text-white">{me?.name || 'Unknown'}</span></p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300"><Flag size={18} /> Race Phase</div>
            <div className="font-black">{phase}</div>
          </div>
          <div className="mt-3 text-sm text-slate-400">Lap Progress: {myLaps}/{lapGoal}</div>
          <div className="mt-2 h-3 w-full rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.min(100, Math.round((myLaps / lapGoal) * 100))}%` }} />
          </div>
        </div>

        <button
          onClick={sendReady}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black"
        >
          <CheckCircle2 size={20} /> READY
        </button>

        <button
          onClick={addLap}
          disabled={phase !== 'RACING' || done}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black ${
            phase === 'RACING' && !done
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus size={20} /> LAP +1
        </button>
      </div>
    </div>
  );
};

export default STKCompanionController;
