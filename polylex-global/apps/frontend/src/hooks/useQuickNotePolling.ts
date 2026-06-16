import { useEffect, useRef } from 'react';

interface PollableNote {
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
}

export function useQuickNotePolling(
  notes: PollableNote[],
  onRefresh: () => Promise<void>,
  intervalMs = 4000,
): void {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const hasPending = notes.some(
      (n) => n.status === 'PENDING' || n.status === 'PROCESSING',
    );

    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(() => {
        onRefresh().catch(() => {});
      }, intervalMs);
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [notes, onRefresh, intervalMs]);
}
