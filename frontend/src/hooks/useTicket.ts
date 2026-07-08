import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/client';
import { ticketsApi } from '../services/api';
import type { Ticket } from '../types/domain';
import type { LoadStatus } from './useGroups';

export function useTicket(ticketId: string | undefined) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!ticketId) {
      setStatus('error');
      setError('Ticket no especificado');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const data = await ticketsApi.get(ticketId);
      setTicket(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setTicket(null);
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el ticket.');
    }
  }, [ticketId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ticket, status, error, reload };
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await ticketsApi.list();
      setTickets(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los tickets.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tickets, status, error, reload };
}
