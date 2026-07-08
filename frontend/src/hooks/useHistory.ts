import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/client';
import { historyApi } from '../services/api';
import type { HistoryListItem } from '../types/domain';
import type { LoadStatus } from './useGroups';

export function useHistory() {
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await historyApi.list();
      setItems(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el historial.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, status, error, reload };
}
