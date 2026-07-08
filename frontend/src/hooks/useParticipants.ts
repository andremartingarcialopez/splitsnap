import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/client';
import { participantsApi } from '../services/api';
import type { Participant } from '../types/domain';
import type { LoadStatus } from './useGroups';

export function useParticipants(query?: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await participantsApi.list(query);
      setParticipants(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los participantes.',
      );
    }
  }, [query]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { participants, status, error, reload };
}
