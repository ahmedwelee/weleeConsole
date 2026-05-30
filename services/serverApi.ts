/**
 * HTTP API service for cross-device communication
 * Replaces localStorage with actual server endpoints
 */

/**
 * Create a new game room on the server
 */
export async function createRoomOnServer(roomCode: string, hostId: string): Promise<Response> {
  return fetch('/api/rooms/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: roomCode,
      hostId
    })
  });
}

/**
 * Get room details from server
 */
export async function getRoomFromServer(roomCode: string): Promise<any> {
  try {
    const response = await fetch(`/api/rooms/${roomCode}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log('[API] Room not found:', roomCode);
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('[API] Error getting room:', err);
    return null;
  }
}

/**
 * Join a room on the server
 */
export async function joinRoomOnServer(roomCode: string, playerId: string, playerName: string, color: string): Promise<any> {
  try {
    const response = await fetch(`/api/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId,
        name: playerName,
        color
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join room');
    }

    return await response.json();
  } catch (err) {
    console.error('[API] Error joining room:', err);
    throw err;
  }
}

/**
 * Update room state on server
 */
export async function updateRoomStateOnServer(roomCode: string, gameState: any): Promise<Response> {
  return fetch(`/api/rooms/${roomCode}/state`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameState)
  });
}

/**
 * Get room players from server
 */
export async function getRoomPlayersFromServer(roomCode: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/rooms/${roomCode}/players`);
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (err) {
    console.error('[API] Error getting players:', err);
    return [];
  }
}

/**
 * Poll server for room updates
 */
export async function pollRoomUpdates(roomCode: string, lastTimestamp: number): Promise<any> {
  try {
    const response = await fetch(`/api/rooms/${roomCode}/updates?since=${lastTimestamp}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error('[API] Error polling updates:', err);
    return null;
  }
}

/**
 * Ping to keep connection alive
 */
export async function pingServer(roomCode: string, playerId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/rooms/${roomCode}/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId })
    });
    return response.ok;
  } catch (err) {
    console.error('[API] Ping failed:', err);
    return false;
  }
}
