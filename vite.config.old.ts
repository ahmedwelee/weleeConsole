import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In-memory room storage
const rooms = new Map<string, any>();

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        middlewareMode: false,
        cors: true,
        // Add custom middleware for API
        middleware: [
          // Room API endpoints - no Express needed
          (req: any, res: any, next: any) => {
            // Use req.url instead of req.path
            const url = req.url?.split('?')[0] || '';

            // Only handle /api routes
            if (!url.startsWith('/api')) {
              return next();
            }

            console.log(`[API] ${req.method} ${url}`);

            // Set content type
            res.setHeader('Content-Type', 'application/json');

            // CREATE ROOM
            if (req.method === 'POST' && url === '/api/rooms/create') {
              let body = '';


                try {
                  const { code, hostId } = JSON.parse(body);
                  if (!code || !hostId) return res.writeHead(400).end(JSON.stringify({ error: 'Missing code or hostId' }));
                  if (rooms.has(code)) return res.writeHead(409).end(JSON.stringify({ error: 'Room already exists' }));

                  const room = { code, hostId, players: [], gameState: null, createdAt: Date.now(), lastUpdate: Date.now() };
                  rooms.set(code, room);
                  console.log(`[API] Room created: ${code}`);
                  res.writeHead(200).end(JSON.stringify({ success: true, room }));
                } catch (e) {
                  res.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON' }));
                }
              });
              return;
            }

            // GET ROOM
            const roomMatch = url.match(/^\/api\/rooms\/([0-9]+)$/);
            if (req.method === 'GET' && roomMatch) {
              const code = roomMatch[1];
              const room = rooms.get(code);
              if (!room) return res.writeHead(404).end(JSON.stringify({ error: 'Room not found' }));
              return res.writeHead(200).end(JSON.stringify(room));
            }

            // JOIN ROOM
            const joinMatch = url.match(/^\/api\/rooms\/([0-9]+)\/join$/);
            if (req.method === 'POST' && joinMatch) {
              const code = joinMatch[1];
              let body = '';
              req.on('data', (chunk: any) => body += chunk);
              req.on('end', () => {
                try {
                  const { playerId, name, color } = JSON.parse(body);
                  const room = rooms.get(code);

                  if (!room) return res.writeHead(404).end(JSON.stringify({ error: 'Room not found' }));
                  if (room.players.find((p: any) => p.id === playerId)) {
                    return res.writeHead(200).end(JSON.stringify({ success: true, message: 'Player already in room', room }));
                  }

                  const player = { id: playerId, name, color, score: 0, isConnected: true };
                  room.players.push(player);
                  room.lastUpdate = Date.now();
                  console.log(`[API] Player joined room ${code}: ${name}`);
                  res.writeHead(200).end(JSON.stringify({ success: true, player, room }));
                } catch (e) {
                  console.log(`[API] Error parsing join request:`, e);
                  res.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON' }));
                }
              });
              return;
            }

            // GET PLAYERS
            const playersMatch = url.match(/^\/api\/rooms\/([0-9]+)\/players$/);
            if (req.method === 'GET' && playersMatch) {
              const code = playersMatch[1];
              const room = rooms.get(code);
              if (!room) return res.writeHead(404).end(JSON.stringify({ error: 'Room not found' }));
              return res.writeHead(200).end(JSON.stringify(room.players));
            }

            // UPDATE STATE
            const stateMatch = url.match(/^\/api\/rooms\/([0-9]+)\/state$/);
            if (req.method === 'PUT' && stateMatch) {
              const code = stateMatch[1];
              let body = '';
              req.on('data', (chunk: any) => body += chunk);
              req.on('end', () => {
                try {
                  const gameState = JSON.parse(body);
                  const room = rooms.get(code);
                  if (!room) return res.writeHead(404).end(JSON.stringify({ error: 'Room not found' }));
                  room.gameState = gameState;
                  room.lastUpdate = Date.now();
                  console.log(`[API] Room state updated: ${code}`);
                  res.writeHead(200).end(JSON.stringify({ success: true, room }));
                } catch (e) {
                  res.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON' }));
                }
              });
              return;
            }

            // POLL UPDATES
            const updatesMatch = url.match(/^\/api\/rooms\/([0-9]+)\/updates/);
            if (req.method === 'GET' && updatesMatch) {
              const code = updatesMatch[1];
              const since = parseInt((url.split('since=')[1] || '0')) || 0;
              const room = rooms.get(code);
              if (!room) return res.writeHead(404).end(JSON.stringify({ error: 'Room not found' }));

              if (room.lastUpdate > since) {
                return res.writeHead(200).end(JSON.stringify({ updated: true, room, timestamp: room.lastUpdate }));
              } else {
                return res.writeHead(200).end(JSON.stringify({ updated: false, timestamp: room.lastUpdate }));
              }
            }

            // PING
            const pingMatch = url.match(/^\/api\/rooms\/([0-9]+)\/ping$/);
            if (req.method === 'POST' && pingMatch) {
              const code = pingMatch[1];
              let body = '';
              req.on('data', (chunk: any) => body += chunk);
              req.on('end', () => {
                try {
                  const { playerId } = JSON.parse(body);
                  const room = rooms.get(code);
                  if (!room) return res.writeHead(404).end(JSON.stringify({ error: 'Room not found' }));

                  const player = room.players.find((p: any) => p.id === playerId);
                  if (player) player.isConnected = true;
                  res.writeHead(200).end(JSON.stringify({ success: true }));
                } catch (e) {
                  res.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON' }));
                }
              });
              return;
            }

            // DELETE ROOM
            const deleteMatch = url.match(/^\/api\/rooms\/([0-9]+)$/);
            if (req.method === 'DELETE' && deleteMatch) {
              const code = deleteMatch[1];
              const deleted = rooms.delete(code);
              if (!deleted) return res.writeHead(404).end(JSON.stringify({ error: 'Room not found' }));
              console.log(`[API] Room deleted: ${code}`);
              return res.writeHead(200).end(JSON.stringify({ success: true }));
            }

            next();
          }
        ]
      },
      plugins: [react()],
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
