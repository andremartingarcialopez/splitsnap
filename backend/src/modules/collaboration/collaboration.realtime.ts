import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../../config/env';

export type CollaborationRealtimeEvent =
  | 'ticket_started'
  | 'participant_joined'
  | 'participant_started'
  | 'product_selected'
  | 'product_unselected'
  | 'participant_completed'
  | 'ticket_status_changed';

let io: Server | null = null;

export function roomForShareCode(shareCode: string): string {
  return `ticket:${shareCode.toUpperCase()}`;
}

export function getCollaborationIo(): Server | null {
  return io;
}

export function initCollaborationRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: env.corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_ticket', (payload: { shareCode?: string }) => {
      const code = String(payload?.shareCode ?? '')
        .trim()
        .toUpperCase();
      if (!code) return;
      socket.join(roomForShareCode(code));
    });

    socket.on('leave_ticket', (payload: { shareCode?: string }) => {
      const code = String(payload?.shareCode ?? '')
        .trim()
        .toUpperCase();
      if (!code) return;
      socket.leave(roomForShareCode(code));
    });
  });

  return io;
}

export function emitTicketUpdated(
  shareCode: string,
  event: CollaborationRealtimeEvent,
  ticket: unknown,
): void {
  if (!io) return;
  io.to(roomForShareCode(shareCode)).emit('ticket_updated', {
    event,
    ticket,
    at: new Date().toISOString(),
  });
}
