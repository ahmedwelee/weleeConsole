import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { normalizeRoomCode } from './services/roomCode';

// In-memory room storage
const rooms = new Map<string, any>();

// Create the API middleware handler
function createApiMiddleware() {
  return (req: any, res: any, next: any) => {
    const url = req.url?.split('?')[0] || '';

    if (!url.startsWith('/api')) {
      return next();
    }

    const sendJSON = (statusCode: number, data: any) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    const readBody = (callback: (body: string) => void) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        callback(body);
      });
      req.on('error', () => {
        callback('');
      });
    };

    console.log(`[API] ${req.method} ${url}`);

    // CREATE ROOM
    if (req.method === 'POST' && url === '/api/rooms/create') {
      readBody((body) => {
        try {
          const { code, hostId } = JSON.parse(body || '{}');
          if (!code || !hostId) return sendJSON(400, { error: 'Missing code or hostId' });
          const roomCode = normalizeRoomCode(code);
          if (!roomCode) return sendJSON(400, { error: 'Invalid room code' });
          if (rooms.has(roomCode)) return sendJSON(409, { error: 'Room already exists' });

          const room = { code: roomCode, hostId, players: [], gameState: null, events: [], createdAt: Date.now(), lastUpdate: Date.now() };
          rooms.set(roomCode, room);
          console.log(`[API] Room created: ${roomCode}`);
          sendJSON(200, { success: true, room });
        } catch (e) {
          console.error('[API] Error:', e);
          sendJSON(400, { error: 'Invalid JSON' });
        }
      });
      return;
    }

    // GET ROOM
    const roomMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)$/);
    if (req.method === 'GET' && roomMatch) {
      const code = normalizeRoomCode(roomMatch[1]);
      console.log(`[API] Getting room: ${code}`);
      const room = rooms.get(code);
      if (!room) {
        console.log(`[API] Room not found: ${code}`);
        return sendJSON(404, { error: 'Room not found' });
      }
      console.log(`[API] Room found, returning ${room.players.length} players`);
      return sendJSON(200, room);
    }

    // JOIN ROOM
    const joinMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/join$/);
    if (req.method === 'POST' && joinMatch) {
      const code = normalizeRoomCode(joinMatch[1]);
      readBody((body) => {
        try {
          const { playerId, name, color } = JSON.parse(body || '{}');
          const room = rooms.get(code);
          if (!room) return sendJSON(404, { error: 'Room not found' });
          if (room.players.find((p: any) => p.id === playerId)) return sendJSON(200, { success: true, message: 'Player already in room', room });

          const player = { id: playerId, name, color, score: 0, isConnected: true };
          room.players.push(player);
          room.lastUpdate = Date.now();
          console.log(`[API] Player joined ${code}: ${name}`);
          sendJSON(200, { success: true, player, room });
        } catch (e) {
          console.error('[API] Error:', e);
          sendJSON(400, { error: 'Invalid JSON' });
        }
      });
      return;
    }

    // GET PLAYERS
    const playersMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/players$/);
    if (req.method === 'GET' && playersMatch) {
      const code = normalizeRoomCode(playersMatch[1]);
      const room = rooms.get(code);
      if (!room) return sendJSON(404, { error: 'Room not found' });
      return sendJSON(200, room.players);
    }

    // UPDATE STATE
    const stateMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/state$/);
    if (req.method === 'PUT' && stateMatch) {
      const code = normalizeRoomCode(stateMatch[1]);
      readBody((body) => {
        try {
          const gameState = JSON.parse(body || '{}');
          const room = rooms.get(code);
          if (!room) return sendJSON(404, { error: 'Room not found' });
          room.gameState = gameState;
          room.lastUpdate = Date.now();
          sendJSON(200, { success: true, room });
        } catch (e) {
          sendJSON(400, { error: 'Invalid JSON' });
        }
      });
      return;
    }

    // APPEND EVENT
    const eventMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/event$/);
    if (req.method === 'POST' && eventMatch) {
      const code = normalizeRoomCode(eventMatch[1]);
      readBody((body) => {
        try {
          const event = JSON.parse(body || '{}');
          const room = rooms.get(code);
          if (!room) return sendJSON(404, { error: 'Room not found' });

          const safeEvent = {
            type: event.type,
            payload: event.payload,
            senderId: event.senderId,
            timestamp: Date.now(),
            id: event.id || `${event.type}_${event.senderId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          };

          room.events = Array.isArray(room.events) ? [...room.events, safeEvent].slice(-100) : [safeEvent];
          room.lastUpdate = Date.now();
          sendJSON(200, { success: true, event: safeEvent });
        } catch (e) {
          sendJSON(400, { error: 'Invalid JSON' });
        }
      });
      return;
    }

    // GET ROOM STATE (for controllers polling latest state)
    const getStateMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/state$/);
    if (req.method === 'GET' && getStateMatch) {
      const code = normalizeRoomCode(getStateMatch[1]);
      const room = rooms.get(code);
      if (!room) return sendJSON(404, { error: 'Room not found' });
      return sendJSON(200, room.gameState || {});
    }

    // POLL UPDATES
    const updatesMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/updates/);
    if (req.method === 'GET' && updatesMatch) {
      const code = normalizeRoomCode(updatesMatch[1]);
      const since = parseInt((url.split('since=')[1] || '0')) || 0;
      const room = rooms.get(code);
      if (!room) return sendJSON(404, { error: 'Room not found' });
      if (room.lastUpdate > since) {
        return sendJSON(200, { updated: true, room, timestamp: room.lastUpdate });
      } else {
        return sendJSON(200, { updated: false, timestamp: room.lastUpdate });
      }
    }

    // PING
    const pingMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/ping$/);
    if (req.method === 'POST' && pingMatch) {
      const code = normalizeRoomCode(pingMatch[1]);
      readBody((body) => {
        try {
          const { playerId } = JSON.parse(body || '{}');
          const room = rooms.get(code);
          if (!room) return sendJSON(404, { error: 'Room not found' });
          const player = room.players.find((p: any) => p.id === playerId);
          if (player) player.isConnected = true;
          sendJSON(200, { success: true });
        } catch (e) {
          sendJSON(400, { error: 'Invalid JSON' });
        }
      });
      return;
    }

    // DELETE ROOM
    const deleteMatch = url.match(/^\/api\/rooms\/([A-Za-z0-9]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
      const code = normalizeRoomCode(deleteMatch[1]);
      const deleted = rooms.delete(code);
      if (!deleted) return sendJSON(404, { error: 'Room not found' });
      return sendJSON(200, { success: true });
    }

    next();
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        middlewareMode: false,
        cors: true
      },
      plugins: [
        react(),
        {
          name: 'api-middleware',
          configureServer(server: any) {
            // Register middleware BEFORE other middlewares
            server.middlewares.use(createApiMiddleware());
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.APP_VERSION': JSON.stringify('1.0.0')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
