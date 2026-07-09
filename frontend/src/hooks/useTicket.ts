import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/client';
import { ticketsApi } from '../services/api';
import type { Ticket } from '../types/domain';
import type { LoadStatus } from './useGroups';

export type ReloadOptions = { silent?: boolean };

export function useTicket(ticketId: string | undefined) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (options?: ReloadOptions) => {
    if (!ticketId) {
      setStatus('error');
      setError('Ticket no especificado');
      return;
    }
    const silent = options?.silent ?? false;
    if (!silent) {
      setStatus('loading');
      setError(null);
    }
    try {
      const data = await ticketsApi.get(ticketId);
      setTicket(data);
      setStatus('ready');
    } catch (err) {
      if (silent) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el ticket.');
      } else {
        setStatus('error');
        setTicket(null);
        setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el ticket.');
      }
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

  const reload = useCallback(async (options?: ReloadOptions) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setStatus('loading');
      setError(null);
    }
    try {
      const data = await ticketsApi.list();
      setTickets(data);
      setStatus('ready');
    } catch (err) {
      if (silent) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar la lista.');
      } else {
        setStatus('error');
        setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los tickets.');
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tickets, status, error, reload };
}
