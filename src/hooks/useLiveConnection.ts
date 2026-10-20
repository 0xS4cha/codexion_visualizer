import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setOutput, appendOutput, setCommand } from '@/store/features/inputSlice';
import { toast } from 'sonner';
import { parseBridgeMessage } from '@/lib/bridgeProtocol';

export interface BridgeInfo {
  version?: string;
  command?: string | null;
  exec: boolean;
  exited: boolean;
  exitCode?: number | null;
}

export function useLiveConnection(url: string = 'ws://127.0.0.1:8080') {
  const [isConnected, setIsConnected] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [bridge, setBridge] = useState<BridgeInfo | null>(null);
  const dispatch = useAppDispatch();
  const reconnectAttempt = useRef(0);
  const reconnectTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const startConnection = useCallback(() => {
    setIsActive(true);
    reconnectAttempt.current = 0;
  }, []);

  const stopConnection = useCallback(() => {
    setIsActive(false);
    setIsConnected(false);
    setBridge(null);
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
  }, []);

  const rerun = useCallback(() => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'rerun' }));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    let ws: WebSocket;
    let messageBuffer: string[] = [];
    let cancelled = false;

    const handleMessage = (raw: string) => {
      const msg = parseBridgeMessage(raw);
      if (!msg) {
        messageBuffer.push(...raw.split('\n'));
        return;
      }
      switch (msg.type) {
        case 'meta':
          setBridge({ version: msg.version, command: msg.command, exec: !!msg.exec, exited: false });
          if (msg.command) dispatch(setCommand(msg.command));
          break;
        case 'lines':
          messageBuffer.push(...msg.lines);
          break;
        case 'reset':
          messageBuffer = [];
          dispatch(setOutput([]));
          setBridge((b) => (b ? { ...b, exited: false, exitCode: undefined } : b));
          break;
        case 'eof':
          setBridge((b) => (b ? { ...b, exited: true, exitCode: msg.code } : { exec: false, exited: true, exitCode: msg.code }));
          if (msg.signal) toast.error(`Program killed by signal ${msg.signal}${msg.signal === 11 ? ' (segfault)' : ''}.`);
          else if (msg.code !== undefined && msg.code !== null && msg.code !== 0) toast.error(`Program exited with code ${msg.code}.`);
          else toast.success('Program finished.');
          break;
      }
    };

    const connect = () => {
      ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempt.current = 0;
        messageBuffer = [];
        dispatch(setOutput([]));
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') handleMessage(event.data);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!cancelled) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
          reconnectAttempt.current += 1;
          reconnectTimeoutId.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    const flushIntervalId = setInterval(() => {
      if (messageBuffer.length > 0) {
        dispatch(appendOutput(messageBuffer));
        messageBuffer = [];
      }
    }, 150);

    return () => {
      cancelled = true;
      if (reconnectTimeoutId.current) clearTimeout(reconnectTimeoutId.current);
      clearInterval(flushIntervalId);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      socketRef.current = null;
    };
  }, [isActive, url, dispatch]);

  return { isConnected, isActive, bridge, startConnection, stopConnection, rerun };
}
