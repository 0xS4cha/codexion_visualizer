import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { prepareCodexionSimulation } from '@/core/codexionSimulation';
import type { CodexionSimulationData } from '@/hooks/useCodexionSimulation';

export interface CodexionSimulationContextType {
  data: CodexionSimulationData | null;
  isLoading: boolean;
  error: Error | null;
  timeToBurnout: number;
  timeToRefactor: number | undefined;
  dongleCooldown: number;
  scheduler: string | undefined;
}

const CodexionSimulationContext = createContext<CodexionSimulationContextType | undefined>(undefined);

export function CodexionSimulationProvider({ children }: { children: React.ReactNode }) {
  const command = useAppSelector((state) => state.user_input.command);
  const rawLog = useAppSelector((state) => state.user_input.output);
  const instantActionPadding = useAppSelector((state) => state.settings.instantActionPadding);
  const defaultDongleCooldown = useAppSelector((state) => state.settings.dongleCooldown);

  const { timeToBurnout, timeToRefactor, cmdDongleCooldown, scheduler } = useMemo(() => {
    const parts = command.split(' ').filter((p) => p.length > 0);
    return {
      timeToBurnout: parts.length > 2 ? parseInt(parts[2], 10) : 0,
      timeToRefactor: parts.length > 5 ? parseInt(parts[5], 10) : undefined,
      cmdDongleCooldown: parts.length > 7 ? parseInt(parts[7], 10) : undefined,
      scheduler: parts.length > 8 ? parts[8] : undefined,
    };
  }, [command]);

  const finalDongleCooldown = cmdDongleCooldown !== undefined ? cmdDongleCooldown : defaultDongleCooldown;

  const [data, setData] = useState<CodexionSimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!rawLog) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    prepareCodexionSimulation(
      rawLog,
      instantActionPadding,
      timeToRefactor,
      finalDongleCooldown,
      timeToBurnout,
      command
    )
      .then((result) => {
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rawLog, instantActionPadding, timeToRefactor, finalDongleCooldown, timeToBurnout, command]);

  const value = useMemo(
    () => ({
      data,
      isLoading,
      error,
      timeToBurnout,
      timeToRefactor,
      dongleCooldown: finalDongleCooldown,
      scheduler,
    }),
    [data, isLoading, error, timeToBurnout, timeToRefactor, finalDongleCooldown, scheduler]
  );

  return (
    <CodexionSimulationContext.Provider value={value}>
      {children}
    </CodexionSimulationContext.Provider>
  );
}

export function useCodexionSimulationContext() {
  const context = useContext(CodexionSimulationContext);
  if (context === undefined) {
    throw new Error('useCodexionSimulationContext must be used within a CodexionSimulationProvider');
  }
  return context;
}
