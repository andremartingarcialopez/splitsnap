import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/client';
import { groupsApi } from '../services/api';
import type { Group } from '../types/domain';

export type LoadStatus = 'loading' | 'ready' | 'error';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await groupsApi.list();
      setGroups(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los grupos.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { groups, status, error, reload };
}
