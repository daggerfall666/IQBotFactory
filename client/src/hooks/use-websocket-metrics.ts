import { useState, useEffect } from 'react';
import type { SystemHealth } from '@shared/schema';

export function useWebSocketMetrics() {
  const [metrics, setMetrics] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'metrics') {
          setMetrics(message.data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Failed to parse metrics data');
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to metrics service');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  return { metrics, error };
}
