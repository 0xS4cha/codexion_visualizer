import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setOutput, appendOutput, setCommand } from '@/store/features/inputSlice';
import { toast } from 'sonner';

export function useLiveConnection(url: string = 'ws://127.0.0.1:8080') {
  const [isConnected, setIsConnected] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const dispatch = useAppDispatch();
  const reconnectAttempt = useRef(0);
  const reconnectTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startConnection = useCallback(() => {
    setIsActive(true);
    reconnectAttempt.current = 0;
  }, []);

  const stopConnection = useCallback(() => {
    setIsActive(false);
    setIsConnected(false);
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    let ws: WebSocket;
    let messageBuffer: string[] = [];
    let flushIntervalId: ReturnType<typeof setInterval>;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempt.current = 0;
        dispatch(setCommand("LIVE MODE - READING FROM WEBSOCKET"));
        dispatch(setOutput([]));
      };

      ws.onmessage = (event) => {
        messageBuffer.push(event.data);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (isActive) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
          reconnectAttempt.current += 1;
          reconnectTimeoutId.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    flushIntervalId = setInterval(() => {
      if (messageBuffer.length > 0) {
        dispatch(appendOutput([...messageBuffer]));
        messageBuffer = [];
      }
    }, 100);

    return () => {
      if (reconnectTimeoutId.current) clearTimeout(reconnectTimeoutId.current);
      clearInterval(flushIntervalId);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [isActive, url, dispatch]);

  return { isConnected, isActive, startConnection, stopConnection };
}
