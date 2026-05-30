import React, { useState, useEffect } from 'react';
import { GameState, GameType } from '@/types.ts';
import { broadcast } from '@/services/broadcast.ts';
import { crossDeviceService } from '@/services/crossDevice.ts';
import { detectDevice } from '@/services/mobile.ts';
import { useRoomStatePoll } from '@/hooks/useRoomStatePoll.ts';
import QuizController from './games/QuizController';
import RaceController from './games/RaceController';
import SoundController from './games/SoundController';
import PotatoController from './games/PotatoController';
import SpyController from './games/SpyController';
import WerewolfController from './games/WerewolfController';
import STKCompanionController from './games/STKCompanionController';
import MobileJoinScreen from './MobileJoinScreen';
import { Smartphone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { ROOM_CODE_LENGTH, normalizeRoomCode } from '../../services/roomCode';

const ControllerView: React.FC<{ gameState: GameState, myId: string }> = ({ gameState: initialGameState, myId }) => {
    // Track room code locally so we can poll even if initial state lacked it
    const [roomCode, setRoomCode] = useState(initialGameState.roomCode || '');
    // Use room state poll for cross-device sync (phones that joined via API)
    const { gameState: polledGameState } = useRoomStatePoll(roomCode || null, initialGameState);

    // Use polled state if we have a room code; otherwise fall back to initial
    const gameState = roomCode ? polledGameState : initialGameState;

    const [name, setName] = useState('');
    const [joined, setJoined] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [color] = useState(() => {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    });

    // Detect device type
    useEffect(() => {
        const device = detectDevice();
        setIsMobile(device.isMobile || device.isTablet);
        console.log('[MOBILE] Device type:', device);
    }, []);

    // Ref for the timeout check - defined early to avoid undefined issues
    const stateRef = React.useRef(gameState);
    useEffect(() => {
        stateRef.current = gameState;
        console.log('[DEBUG-Controller] gameState updated:', { playersCount: gameState.players.length, myId, myInList: gameState.players.some(p => p.id === myId), currentView: gameState.currentView });
    }, [gameState, myId]);


    // Check if we are already in the player list sent by the screen
    const me = gameState.players.find(p => p.id === myId);
    const isHost = gameState.hostId ? gameState.hostId === myId : (gameState.players.length > 0 && gameState.players[0].id === myId);


    // Auto-set joined state if the screen confirms we are in
    useEffect(() => {
        if (me) {
            console.log('[DEBUG-Controller] ✓ Successfully joined! Me found in players list:', me);
            setJoined(true);
            setIsConnecting(false);
            setError(null);
        } else if (isConnecting && gameState.players.length > 0) {
            // If we are trying to connect and the state updated but we aren't in it,
            // check if it's been a while or the code is obviously wrong
            console.log('[DEBUG-Controller] Connecting but not in list yet. Current players:', gameState.players.length);
        }
    }, [me, isConnecting, gameState.players]);

    const handleJoin = async (e: React.FormEvent | string, code?: string) => {
        let finalName = name;
        let finalCode = roomCodeInput;

        if (typeof e === 'string') {
            // Called from MobileJoinScreen with (name, code)
            finalName = e;
            finalCode = code || '';
        } else {
            // Form submission
            (e as React.FormEvent).preventDefault();
        }

        if (!finalName.trim() || !finalCode.trim()) {
            console.log('[DEBUG-Controller] Form incomplete:', { name: !!finalName.trim(), code: !!finalCode.trim() });
            return;
        }

        setError(null);
        setIsConnecting(true);
        finalCode = normalizeRoomCode(finalCode);

        if (finalCode.length !== ROOM_CODE_LENGTH) {
            setError(`Room code must be ${ROOM_CODE_LENGTH} characters.`);
            setIsConnecting(false);
            return;
        }

        try {
            // JOIN via API
            const response = await fetch(`/api/rooms/${finalCode.trim()}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: myId,
                    name: finalName.toUpperCase().trim(),
                    color
                })
            });

            const result = await response.json();
            if (!response.ok || result.error) {
                setError(result.error || 'Could not join room.');
                setIsConnecting(false);
                return;
            }

            // Success: mark joined and remember room code so polling works
            setJoined(true);
            setIsConnecting(false);
            setRoomCode(finalCode.trim());
            setError(null);
            console.log('[API] Joined room successfully:', result);
        } catch (err) {
            console.error('[API] Join error:', err);
            setError('Failed to connect to server');
            setIsConnecting(false);
        }
    };

    // Mobile join screen
    if (!joined && isMobile) {
        return (
            <MobileJoinScreen
                onJoinAttempt={(name, code) => handleJoin(name, code)}
                isConnecting={isConnecting}
                error={error}
            />
        );
    }

    const handleConfigSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const config = {
            language: formData.get('lang') as any,
            difficulty: formData.get('diff') as any
        };
        broadcast.send('CONTROLLER_INPUT', { action: 'CONFIG_START', config }, myId);
    };

    if (!joined) {
        return (
            <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-white">
                <form onSubmit={handleJoin} className="w-full max-w-sm space-y-6">
                    <div className="relative group">
                        <Smartphone size={64} className="mx-auto text-cyan-400 group-hover:rotate-12 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full -z-10 opacity-50" />
                    </div>

                    <div className="text-center">
                        <h1 className="text-4xl font-black tracking-tight">CONTROLLER</h1>
                        <p className="text-slate-500 mt-2 font-medium uppercase text-xs tracking-widest">Local multi-tab sync</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="shrink-0" size={18} />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase ml-2">Display Name</label>
                            <input
                                type="text"
                                placeholder="YOUR NAME"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-900 p-5 rounded-2xl text-xl font-bold outline-none border-2 border-slate-800 focus:border-cyan-500 transition-colors placeholder:opacity-20"
                                required
                                disabled={isConnecting}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase ml-2">Room Code</label>
                            <input
                                type="text"
                                placeholder="A7X2"
                                value={roomCodeInput}
                                onChange={e => setRoomCodeInput(normalizeRoomCode(e.target.value))}
                                className="w-full bg-slate-900 p-5 rounded-2xl text-4xl text-center font-black outline-none border-2 border-slate-800 focus:border-purple-500 transition-colors tracking-[1rem] placeholder:opacity-20 uppercase"
                                maxLength={4}
                                autoCapitalize="characters"
                                required
                                disabled={isConnecting}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isConnecting || !name.trim() || roomCodeInput.length !== ROOM_CODE_LENGTH}
                        className={`w-full p-5 rounded-2xl text-2xl font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${
                            isConnecting || !name.trim() || roomCodeInput.length !== ROOM_CODE_LENGTH
                              ? 'bg-slate-800 cursor-not-allowed text-slate-500'
                              : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:brightness-110 text-white'
                        }`}
                    >
                        {isConnecting ? (
                            <><Loader2 className="animate-spin" /> CONNECTING...</>
                        ) : (
                            'JOIN ROOM'
                        )}
                    </button>
                </form>
            </div>
        );
    }

    if (gameState.currentView === 'CONFIG' && isHost) {
        return (
            <div className="min-h-screen bg-slate-900 p-8 flex flex-col justify-center text-white">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-purple-400 tracking-tight">HOST SETTINGS</h1>
                    <p className="text-slate-500 font-medium">Configure your session, Boss.</p>
                </div>
                <form onSubmit={handleConfigSubmit} className="space-y-8 max-w-md mx-auto w-full">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-500 font-bold mb-4 uppercase text-xs tracking-widest">Language</label>
                            <select name="lang" className="w-full bg-slate-800 p-5 rounded-2xl text-xl font-bold outline-none border-2 border-slate-700 focus:border-cyan-500 appearance-none">
                                <option value="English">English</option>
                                <option value="Arabic">Arabic</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-500 font-bold mb-4 uppercase text-xs tracking-widest">Difficulty</label>
                            <select name="diff" className="w-full bg-slate-800 p-5 rounded-2xl text-xl font-bold outline-none border-2 border-slate-700 focus:border-purple-500 appearance-none">
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                    </div>
                    <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 p-6 rounded-2xl text-2xl font-black shadow-xl active:scale-95 transition-all">
                        START GAME
                    </button>
                </form>
            </div>
        );
    }

    if (gameState.currentView === 'PLAYING') {
        switch (gameState.activeGame) {
            case GameType.QUIZ_BATTLE: return <QuizController gameState={gameState} myId={myId} roomCode={roomCode} />;
            case GameType.RACE_TAP: return <RaceController gameState={gameState} myId={myId} />;
            case GameType.SOUND_REACTION: return <SoundController gameState={gameState} myId={myId} />;
            case GameType.HOT_POTATO: return <PotatoController gameState={gameState} myId={myId} />;
            case GameType.WHO_IS_THE_SPY: return <SpyController gameState={gameState} myId={myId} />;
            case GameType.WEREWOLF: return <WerewolfController gameState={gameState} myId={myId} />;
            case GameType.STK_COMPANION: return <STKCompanionController gameState={gameState} myId={myId} />;
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 blur-[100px] rounded-full" />
                <CheckCircle2 size={120} className="text-green-500 animate-bounce relative z-10" />
            </div>
            <div className="text-center relative z-10">
                <h1 className="text-4xl font-black tracking-tight">YOU'RE CONNECTED</h1>
                <p className="text-slate-400 text-xl mt-4 font-medium opacity-60">Look at the TV to start!</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl w-full max-w-xs flex items-center gap-4 border border-slate-700/50 relative z-10">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 shadow-lg" style={{ backgroundColor: color }} />
                <div>
                    <div className="font-black text-2xl">{me?.name || name}</div>
                    <div className="text-cyan-400 font-mono font-bold">Points: {me?.score || 0}</div>
                </div>
            </div>
        </div>
    );
};

export default ControllerView;
