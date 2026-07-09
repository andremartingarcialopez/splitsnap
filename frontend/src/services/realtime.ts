import { io, type Socket } from 'socket.io-client';
import { apiOrigin } from '../utils/mediaUrl';

let socket: Socket | null = null;

function resolveRealtimeUrl(): string {
  const origin = apiOrigin();
  return origin || window.location.origin;
}

export function getRealtimeSocket(): Socket {
  if (!socket) {
    socket = io(resolveRealtimeUrl(), {
      path: '/socket.io',
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function joinTicketRoom(shareCode: string): void {
  const code = shareCode.trim().toUpperCase();
  if (!code) return;
  const s = getRealtimeSocket();
  if (!s.connected) s.connect();
  s.emit('join_ticket', { shareCode: code });
}

export function leaveTicketRoom(shareCode: string): void {
  const code = shareCode.trim().toUpperCase();
  if (!code || !socket) return;
  socket.emit('leave_ticket', { shareCode: code });
}

export function disconnectRealtime(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
