import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setOutput, setCommand } from '@/store/features/inputSlice';
import { toast } from 'sonner';

export function useLiveConnection(url: string = 'ws://127.0.0.1:8080') {
  const [isConnected, setIsConnected] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const dispatch = useAppDispatch();

  const startConnection = useCallback(() => {
    setIsActive(true);
  }, []);

  const stopConnection = useCallback(() => {
    setIsActive(false);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const ws = new WebSocket(url);
    let currentLogs = '';

    ws.onopen = () => {
      setIsConnected(true);
      currentLogs = '';
      dispatch(setCommand("LIVE MODE - READING FROM WEBSOCKET"));
      dispatch(setOutput(''));
      toast.success("Connected to Live Bridge!");
    };

    ws.onmessage = (event) => {
      const newLine = event.data;
      currentLogs = currentLogs ? currentLogs + '\n' + newLine : newLine;
      dispatch(setOutput(currentLogs));
    };

    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setIsConnected(false);
      setIsActive(false);
      toast.error("Connection failed. Ensure codexion-live is running on 127.0.0.1:8080.");
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsActive(false);
      toast.info("Disconnected from Live Bridge.");
    };

    return () => {
      ws.close();
    };
  }, [isActive, url, dispatch]);

  return { isConnected, isActive, startConnection, stopConnection };
}
