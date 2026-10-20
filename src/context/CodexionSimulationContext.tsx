import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { knownParams, resolveParams } from '@/core/commandParams';
import type { CodexionParams } from '@/core/commandParams';
import type { PrepareOptions } from '@/core/codexionSimulation';
import { runSimulation, withTimeMapping } from '@/core/simulationClient';
import type { CodexionSimulationData } from '@/core/simulationClient';

export interface CodexionSimulationContextType {
  data: CodexionSimulationData | null;
  isLoading: boolean;
  error: Error | null;
  params: CodexionParams;
  known: (keyof CodexionParams)[];
  timeToBurnout: number;
  timeToRefactor: number | undefined;
  dongleCooldown: number;
  scheduler: string | undefined;
}

const CodexionSimulationContext = createContext<CodexionSimulationContextType | undefined>(undefined);

export function useSimulationRunner(options: PrepareOptions | null) {
  const [data, setData] = useState<CodexionSimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const running = useRef(false);
  const queued = useRef<PrepareOptions | null>(null);
  const latest = useRef<PrepareOptions | null>(null);

  useEffect(() => {
    latest.current = options && options.lines.length > 0 ? options : null;

    if (!latest.current) {
      queued.current = null;
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const run = (opts: PrepareOptions) => {
      running.current = true;
      setIsLoading(true);
      runSimulation(opts)
        .then((result) => {
          if (latest.current) {
            setData(withTimeMapping(result));
            setError(null);
          }
        })
        .catch((err: Error) => setError(err))
        .finally(() => {
          running.current = false;
          const next = queued.current;
          queued.current = null;
          if (next && latest.current) run(next);
          else setIsLoading(false);
        });
    };

    if (running.current) {
      queued.current = latest.current;
    } else {
      run(latest.current);
    }
  }, [options]);

  return { data, isLoading, error };
}

export function CodexionSimulationProvider({ children }: { children: React.ReactNode }) {
  const command = useAppSelector((state) => state.user_input.command);
  const rawLog = useAppSelector((state) => state.user_input.output);
  const instantActionPadding = useAppSelector((state) => state.settings.instantActionPadding);
  const defaultDongleCooldown = useAppSelector((state) => state.settings.dongleCooldown);

  const known = useMemo(() => knownParams(command), [command]);
  const params = useMemo(
    () => resolveParams(command, { dongleCooldown: defaultDongleCooldown }),
    [command, defaultDongleCooldown]
  );

  const options = useMemo<PrepareOptions | null>(
    () => (rawLog.length > 0 ? { lines: rawLog, params, command, padding: instantActionPadding, known } : null),
    [rawLog, params, command, instantActionPadding, known]
  );

  const { data, isLoading, error } = useSimulationRunner(options);

  const value = useMemo(
    () => ({
      data,
      isLoading,
      error,
      params,
      known,
      timeToBurnout: known.includes('timeToBurnout') ? params.timeToBurnout : 0,
      timeToRefactor: known.includes('timeToRefactor') ? params.timeToRefactor : undefined,
      dongleCooldown: params.dongleCooldown,
      scheduler: known.includes('scheduler') ? params.scheduler : undefined,
    }),
    [data, isLoading, error, params, known]
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
