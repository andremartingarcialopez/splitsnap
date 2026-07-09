import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { initCollaborationRealtime } from './modules/collaboration/collaboration.realtime';

const app = createApp();
const server = createServer(app);

initCollaborationRealtime(server);

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[splitsnap-api] listening on http://0.0.0.0:${env.PORT} (HTTP + WebSocket)`);
});
