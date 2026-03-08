import { useState, useEffect, useCallback } from 'react';

type Status = 'unknown' | 'waking' | 'ready' | 'error';

const PING_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elite-ai`;

export function useBackendStatus() {
  const [status, setStatus] = useState<Status>('unknown');
  const [latency, setLatency] = useState<number | null>(null);

  const ping = useCallback(async () => {
    setStatus('waking');
    const start = Date.now();
    try {
      const res = await fetch(PING_URL, {
        method: 'OPTIONS',
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const ms = Date.now() - start;
      setLatency(ms);
      setStatus(res.status < 500 ? 'ready' : 'error');
    } catch {
      setStatus('error');
      setLatency(null);
    }
  }, []);

  useEffect(() => {
    // Ping on mount to wake the backend
    ping();
  }, [ping]);

  return { status, latency, ping };
}
