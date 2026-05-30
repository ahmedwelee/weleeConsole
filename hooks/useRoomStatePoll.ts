import { useEffect, useState } from 'react';
import { GameState } from '../types';

/**
 * Hook to poll the server for room state updates
 * Used by phones/controllers to get the latest game state
 */
export function useRoomStatePoll(roomCode: string | null, initialState: GameState) {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [lastSync, setLastSync] = useState(0);

  useEffect(() => {
    if (!roomCode) return;

    console.log(`[POLL] Starting room state poll for room: ${roomCode}`);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rooms/${roomCode}/state`);
        if (response.ok) {
          const responseText = await response.text();

          // Check if response is HTML (error page)
          if (responseText.startsWith('<')) {
            console.error('[POLL] Received HTML instead of JSON');
            return;
          }

          const roomData = JSON.parse(responseText);

          // Update state if room data is different
          if (roomData && roomData !== gameState) {
            console.log('[POLL] Received updated room state:', {
              currentView: roomData.currentView,
              activeGame: roomData.activeGame,
              playersCount: roomData.players?.length
            });

            setGameState(roomData);
            setLastSync(Date.now());
          }
        }
      } catch (err) {
        // Silently fail - we'll retry on the next poll
        // console.error('[POLL] Error fetching room state:', err);
      }
    }, 500); // Poll every 500ms

    return () => {
      clearInterval(pollInterval);
      console.log(`[POLL] Stopped room state poll for room: ${roomCode}`);
    };
  }, [roomCode]);

  return { gameState, lastSync };
}

export default useRoomStatePoll;
