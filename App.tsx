
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppRole, GameState, BroadcastMessage, Player } from './types';
import { broadcast } from './services/broadcast';
import { crossDeviceService } from './services/crossDevice';
import ScreenView from './components/Screen/ScreenView';
import ControllerView from './components/Controller/ControllerView';
import { Monitor, Gamepad2, Info } from 'lucide-react';
import { generateRoomCode, normalizeRoomCode } from './services/roomCode';

const App: React.FC = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [roomSetupComplete, setRoomSetupComplete] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentView: 'LOBBY',
    activeGame: null,
    players: [],
    roomCode: '',
    hostId: '',
    round: 0,
    gameData: null
  });

  const [myId] = useState(() => Math.random().toString(36).substring(7));
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const processedServerEventIdsRef = useRef<Set<string>>(new Set());

  // Ref to track latest state for the heartbeat interval to avoid stale closures
  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Initialize cross-device service and load any existing room state on app load
  useEffect(() => {
    console.log('[APP] Initializing app - checking for existing room state');

    // Try to load existing room state from localStorage (for phones joining existing room)
    try {
      const storedRoomData = localStorage.getItem('gemini_room_data');
      if (storedRoomData) {
        const roomData = JSON.parse(storedRoomData);
        console.log('[APP] Found existing room data in localStorage:', roomData);

        // If there's a room, set it as the current game state
        if (roomData.roomCode) {
          console.log('[APP] Loading room:', roomData.roomCode);
          setGameState(prev => ({
            ...prev,
            roomCode: roomData.roomCode,
            hostId: roomData.hostId || roomData.gameState?.hostId || prev.hostId || '',
            players: roomData.players || [],
            gameState: roomData.gameState
          }));
        }
      }
    } catch (err) {
      console.error('[APP] Error loading room state:', err);
    }

    // Start cross-device polling immediately (before role is set)
    // This ensures phones can receive messages as soon as they load
    const unsubscribeBootstrapCrossDevice = crossDeviceService.subscribe((msg: any) => {
      console.log('[APP] Cross-device polling active, received:', msg.type);
    });

    return () => {
      unsubscribeBootstrapCrossDevice();
    };
  }, []); // Only run once on mount

  useEffect(() => {
    if (role !== 'SCREEN' || !gameState.roomCode) return;
    crossDeviceService.initializeRoom(gameState.roomCode);
  }, [role, gameState.roomCode]);

  // Check if current player is the host (first player) and update role accordingly
  useEffect(() => {
    if (role === 'CONTROLLER' && gameState.players.length > 0) {
      const firstPlayer = gameState.players[0];
      if (firstPlayer.id === myId) {
        console.log('[APP] Current player is host! Switching role to SCREEN');
        setRole('SCREEN');
      }
    }
  }, [gameState.players, role, myId]);

  // Sync state helper - sends via both channels for compatibility
  const syncState = useCallback((state: GameState) => {
    const syncId = `SYNC_STATE_${myId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Send via BroadcastChannel (for same-browser tabs)
    broadcast.send('SYNC_STATE', state, myId, syncId);

    // Send via cross-device service (for phones on WiFi)
    crossDeviceService.send('SYNC_STATE', state, myId, syncId);

    // Send to API server so phones can poll it
    if (state.roomCode) {
      fetch(`/api/rooms/${state.roomCode}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).catch(err => console.error('[API] Error syncing state:', err));
    }

    console.log('[APP] State synced to all devices:', { players: state.players.length, currentView: state.currentView });
  }, [myId]);

  useEffect(() => {
    // Subscribe to BroadcastChannel messages (for same-browser tabs)
    const unsubscribeBroadcast = broadcast.subscribe((msg: BroadcastMessage) => {
      // Ignore our own messages
      if (msg.senderId === myId) return;
      if (msg.id && processedMessageIdsRef.current.has(msg.id)) return;
      if (msg.id) {
        processedMessageIdsRef.current.add(msg.id);
        if (processedMessageIdsRef.current.size > 1000) {
          processedMessageIdsRef.current.clear();
        }
      }

      if (role === 'SCREEN') {
        handleScreenReceive(msg);
      } else if (role === 'CONTROLLER') {
        handleControllerReceive(msg);
      }
    });

    // Subscribe to cross-device messages (for phones on same WiFi)
    const unsubscribeCrossDevice = crossDeviceService.subscribe((msg: any) => {
      // Ignore our own messages
      if (msg.senderId === myId) return;
      if (msg.id && processedMessageIdsRef.current.has(msg.id)) return;
      if (msg.id) {
        processedMessageIdsRef.current.add(msg.id);
        if (processedMessageIdsRef.current.size > 1000) {
          processedMessageIdsRef.current.clear();
        }
      }

      console.log('[APP] Cross-device message received:', { type: msg.type, senderId: msg.senderId });

      if (role === 'SCREEN') {
        handleScreenReceive(msg);
      } else if (role === 'CONTROLLER') {
        handleControllerReceive(msg);
      }
    });

     // Heartbeat to keep all devices in sync.
     // CRITICAL: Must use stateRef.current to avoid stale closure.
     let heartbeat: number | undefined;
     if (role === 'SCREEN') {
       heartbeat = window.setInterval(async () => {
         const currentState = stateRef.current;

         // Poll server to get room updates (players joining, etc)
         if (currentState.roomCode) {
           try {
             const response = await fetch(`/api/rooms/${currentState.roomCode}`);
             if (response.ok) {
               const responseText = await response.text();

               // Check if response is HTML (error page) instead of JSON
               if (responseText.startsWith('<')) {
                 console.error('[POLL] Received HTML instead of JSON - API endpoint not working');
                 return;
               }

               const roomData = JSON.parse(responseText);

               // If players list changed, update state
               if (roomData.players && JSON.stringify(roomData.players) !== JSON.stringify(currentState.players)) {
                 console.log('[POLL] Room players updated from server:', roomData.players.length);
                 setGameState(prev => ({
                   ...prev,
                   players: roomData.players
                 }));
               }

               if (Array.isArray(roomData.events) && roomData.events.length > 0) {
                 roomData.events.forEach((event: any) => {
                   const eventId = event.id || `${event.type}_${event.senderId}_${event.timestamp}`;
                   if (processedServerEventIdsRef.current.has(eventId)) return;
                   processedServerEventIdsRef.current.add(eventId);
                   if (processedServerEventIdsRef.current.size > 1000) {
                     processedServerEventIdsRef.current.clear();
                   }

                   if (event.type === 'CONTROLLER_INPUT') {
                     handleScreenReceive({
                       type: 'CONTROLLER_INPUT',
                       payload: event.payload,
                       senderId: event.senderId,
                       id: eventId,
                       timestamp: event.timestamp
                     });
                   }
                 });
               }
             }
           } catch (err) {
             console.error('[POLL] Error fetching room:', err);
           }
         }
       }, 500);
     }

    return () => {
      unsubscribeBroadcast();
      unsubscribeCrossDevice();
      if (heartbeat) clearInterval(heartbeat);
    };
  }, [role, myId]);

  const handleScreenReceive = (msg: BroadcastMessage) => {
    // 1. Handle Join Requests
    if (msg.type === 'CONTROLLER_INPUT' && msg.payload.action === 'JOIN_REQUEST') {
      const { name, color, code } = msg.payload;
      console.log('[DEBUG] JOIN_REQUEST received:', { senderId: msg.senderId, name, code, currentRoomCode: stateRef.current.roomCode });

      // Validate Room Code (Case Insensitive)
      const submittedCode = normalizeRoomCode(code || '');
      const storedCode = normalizeRoomCode(stateRef.current.roomCode || '');

      console.log('[DEBUG] Room code validation:', {
        submitted: submittedCode,
        stored: storedCode,
        match: submittedCode === storedCode,
        submittedLength: submittedCode?.length,
        storedLength: storedCode?.length
      });

      if (submittedCode && submittedCode === storedCode) {
        console.log('[DEBUG] Room code VALID - Processing join');
        setGameState(prev => {
          // Check if player already exists
          if (prev.players.find(p => p.id === msg.senderId)) {
            console.log('[DEBUG] Player already exists, ignoring duplicate');
            return prev;
          }

          const newPlayer: Player = {
            id: msg.senderId,
            name: name || `Player ${prev.players.length + 1}`,
            color: color || '#ffffff',
            score: 0,
            isConnected: true
          };

          const newState = {
            ...prev,
            players: [...prev.players, newPlayer]
          };

          console.log('[DEBUG] Player added:', newPlayer);
          console.log('[DEBUG] Broadcasting updated state with', newState.players.length, 'players');
          return newState;
        });
      } else {
        console.log('[DEBUG] ❌ Room code INVALID');
        console.log('[DEBUG] Submitted code:', submittedCode, '(length:', submittedCode?.length + ')');
        console.log('[DEBUG] Stored code:', storedCode, '(length:', storedCode?.length + ')');
        console.log('[DEBUG] Character comparison:');
        if (submittedCode && storedCode) {
          for (let i = 0; i < Math.max(submittedCode.length, storedCode.length); i++) {
            console.log(`[DEBUG]   Position ${i}: submitted='${submittedCode[i]}' vs stored='${storedCode[i]}'`);
          }
        }
      }
    }

    // 2. Handle Game Config from Host (First player in list)
    if (msg.type === 'CONTROLLER_INPUT' && msg.payload.action === 'CONFIG_START') {
      const currentPlayers = stateRef.current.players;
      if (currentPlayers.length > 0 && currentPlayers[0].id === msg.senderId) {
        setGameState(prev => {
          const next = {
            ...prev,
            currentView: 'PLAYING' as const,
            config: msg.payload.config
          };
          return next;
        });
      }
    }

    // 2.5 Handle STK Ready
    if (msg.type === 'CONTROLLER_INPUT' && msg.payload.action === 'STK_READY') {
      setGameState(prev => {
        const readyPlayers = prev.gameData?.readyPlayers || {};
        readyPlayers[msg.senderId] = true;
        const next = {
          ...prev,
          gameData: {
            ...prev.gameData,
            readyPlayers
          }
        };
        return next;
      });
    }

    // 2.6 Handle STK Lap Increment
    if (msg.type === 'CONTROLLER_INPUT' && msg.payload.action === 'STK_LAP_INCREMENT') {
      setGameState(prev => {
        const lapGoal = Number(prev.gameData?.lapGoal || 3);
        const progress = { ...(prev.gameData?.lapProgress || {}) };
        const currentLap = Number(progress[msg.senderId] || 0);
        const nextLap = Math.min(lapGoal, currentLap + 1);
        progress[msg.senderId] = nextLap;
        const next = {
          ...prev,
          gameData: {
            ...prev.gameData,
            lapProgress: progress
          }
        };
        return next;
      });
    }

    // 3. Handle General Game Events (exclude STK and config actions)
    if (msg.type === 'CONTROLLER_INPUT' && !['JOIN_REQUEST', 'CONFIG_START', 'STK_READY', 'STK_LAP_INCREMENT'].includes(msg.payload.action)) {
      broadcast.send('SCREEN_EVENT', { ...msg.payload, playerId: msg.senderId }, myId);
    }
  };

   const handleControllerReceive = (msg: BroadcastMessage) => {
     if (msg.type === 'SYNC_STATE') {
       console.log('[DEBUG] CONTROLLER received SYNC_STATE:', { playersCount: msg.payload.players?.length, senderId: msg.senderId, roomCode: msg.payload.roomCode });
       setGameState(msg.payload);
     }
     
     // Dispatch SCREEN_EVENT messages to listeners without re-broadcasting to storage
     // (important for phones using cross-device communication)
     if (msg.type === 'SCREEN_EVENT') {
       console.log('[DEBUG] CONTROLLER received SCREEN_EVENT:', msg.payload.action);
       broadcast.dispatchToListeners(msg);
     }
   };

  if (!role) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-white overflow-hidden font-sans">
          <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-600 animate-pulse">
                WELEECONSOLE
              </h1>
              <p className="text-slate-500 text-xl font-medium tracking-widest uppercase">The ultimate local multi-tab console</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <button
                  onClick={async () => {
                    setRole('SCREEN');
                    setRoomSetupComplete(false);
                    const code = generateRoomCode();
                    const initial = { ...gameState, roomCode: code, hostId: myId };
                    console.log('[DEBUG] SCREEN role selected with room code:', code);

                    setGameState(initial);

                    // Create room on HTTP API server
                    try {
                        console.log('[API] Creating room:', code);
                        const response = await fetch('/api/rooms/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                code,
                                hostId: myId
                            })
                        });

                        console.log('[API] Response status:', response.status);
                        const responseText = await response.text();
                        console.log('[API] Response:', responseText);

                        if (!response.ok) {
                            console.error('[API] Failed to create room:', response.status, responseText);
                            return;
                        }

                        const roomData = JSON.parse(responseText);
                        console.log('[API] Room created successfully:', roomData);
                        setRoomSetupComplete(true);

                    } catch (err) {
                        console.error('[API] Error creating room:', err);
                    }
                  }}
                  className="group p-8 bg-slate-900/50 backdrop-blur-md border-2 border-slate-800 rounded-3xl transition-all hover:scale-105 hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
              >
                <Monitor className="w-16 h-16 mx-auto mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <h2 className="text-3xl font-bold">Host TV</h2>
                <p className="text-slate-500 mt-2">Open this in a primary tab</p>
              </button>
              <button
                  onClick={() => setRole('CONTROLLER')}
                  className="group p-8 bg-slate-900/50 backdrop-blur-md border-2 border-slate-800 rounded-3xl transition-all hover:scale-105 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
              >
                <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <h2 className="text-3xl font-bold">Join Game</h2>
                <p className="text-slate-500 mt-2">Open this in a second tab</p>
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 text-slate-600 bg-slate-900/30 px-6 py-3 rounded-full border border-slate-800/50 max-w-fit mx-auto">
              <Info size={18} />
              <p className="text-sm">Works across multiple tabs in the same browser.</p>
            </div>
          </div>
        </div>
    );
  }

  return role === 'SCREEN' ? (
      <ScreenView
          gameState={gameState}
          setGameState={setGameState}
          myId={myId}
          syncToControllers={syncState}
          syncEnabled={roomSetupComplete}
      />
  ) : (
      <ControllerView
          gameState={gameState}
          myId={myId}
      />
  );
};

export default App;
