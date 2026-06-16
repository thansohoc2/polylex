import { useState, useCallback } from 'react';

export interface ApiError {
  status?: number;
  message: string;
  code?: string;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  call: (fn: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Generic data-fetching hook providing loading/error/data state. The async function
 * is passed at call time, keeping the hook reusable for any endpoint.
 *
 * @example
 * const { data, loading, error, call } = useApi<User>();
 *
 * const handleLoad = () => call(() => userApi.getMe());
 */
export function useApi<T = unknown>(): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (fn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, call, reset };
}
