import axios, { AxiosError } from 'axios';
import type { ApiFailure, ApiSuccess } from '../types/domain';

/** OCR + IA en prod/móvil pueden tardar >30s (upload + cold start). */
export const PIPELINE_TIMEOUT_MS = 120_000;

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiFailure>) => {
    const body = error.response?.data;
    if (body && body.success === false) {
      return Promise.reject(
        new ApiClientError(body.message, body.error?.code ?? 'HTTP_ERROR', body.error?.details),
      );
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiClientError(
          'El procesamiento tardó demasiado. Reintenta con buena luz o usa ingreso manual.',
          'NETWORK_ERROR',
        ),
      );
    }
    return Promise.reject(
      new ApiClientError(error.message || 'Network error', 'NETWORK_ERROR'),
    );
  },
);

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function unwrap<T>(payload: ApiSuccess<T> | ApiFailure): T {
  if (!payload.success) {
    throw new ApiClientError(payload.message, payload.error.code, payload.error.details);
  }
  return payload.data;
}

export function toClientError(err: unknown): never {
  if (err instanceof ApiClientError) throw err;
  if (axios.isAxiosError(err)) {
    throw err;
  }
  throw new ApiClientError('Unexpected error', 'UNKNOWN');
}
