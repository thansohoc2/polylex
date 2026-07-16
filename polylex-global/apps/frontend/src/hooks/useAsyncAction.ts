import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncActionStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAsyncActionResult<TArgs extends unknown[], TResult> {
  execute: (...args: TArgs) => Promise<TResult>;
  status: AsyncActionStatus;
  data: TResult | undefined;
  error: unknown;
  isPending: boolean;
  reset: () => void;
}

/**
 * Tracks one mutation-like async action. Concurrent calls share the in-flight
 * promise, and failures remain rejected so callers cannot accidentally swallow them.
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): UseAsyncActionResult<TArgs, TResult> {
  const actionRef = useRef(action);
  const mountedRef = useRef(false);
  const inFlightRef = useRef<Promise<TResult> | null>(null);
  const [status, setStatus] = useState<AsyncActionStatus>('idle');
  const [data, setData] = useState<TResult | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  actionRef.current = action;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback((...args: TArgs): Promise<TResult> => {
    if (inFlightRef.current) return inFlightRef.current;

    if (mountedRef.current) {
      setStatus('pending');
      setError(undefined);
    }

    const request = Promise.resolve()
      .then(() => actionRef.current(...args))
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setStatus('success');
        }
        return result;
      })
      .catch((caughtError: unknown) => {
        if (mountedRef.current) {
          setError(caughtError);
          setStatus('error');
        }
        throw caughtError;
      })
      .finally(() => {
        if (inFlightRef.current === request) inFlightRef.current = null;
      });

    inFlightRef.current = request;
    return request;
  }, []);

  const reset = useCallback(() => {
    if (!mountedRef.current || inFlightRef.current) return;
    setStatus('idle');
    setData(undefined);
    setError(undefined);
  }, []);

  return { execute, status, data, error, isPending: status === 'pending', reset };
}
