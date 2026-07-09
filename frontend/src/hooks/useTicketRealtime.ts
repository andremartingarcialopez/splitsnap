import { useEffect, useRef, useState } from 'react';
import {
  getRealtimeSocket,
  joinTicketRoom,
  leaveTicketRoom,
} from '../services/realtime';
import type { CollaborationRealtimeEvent, TicketUpdatedPayload } from '../types/domain';

type Options = {
  shareCode: string | null | undefined;
  enabled?: boolean;
  onUpdate?: (payload: TicketUpdatedPayload) => void;
};

export function useTicketRealtime({ shareCode, enabled = true, onUpdate }: Options) {
  const [connected, setConnected] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const code = shareCode?.trim().toUpperCase() ?? '';

  useEffect(() => {
    if (!enabled || !code) {
      setConnected(false);
      return;
    }

    const socket = getRealtimeSocket();

    const handleConnect = () => {
      setConnected(true);
      joinTicketRoom(code);
    };
    const handleDisconnect = () => setConnected(false);
    const handleTicketUpdated = (payload: TicketUpdatedPayload) => {
      onUpdateRef.current?.(payload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('ticket_updated', handleTicketUpdated);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('ticket_updated', handleTicketUpdated);
      leaveTicketRoom(code);
    };
  }, [code, enabled]);

  return { connected };
}

export type { CollaborationRealtimeEvent };
