import { useState, useEffect } from 'react';
import { prepareCodexionSimulation } from '@/core/codexionSimulation';
import type { Segment, DongleSegment, SimulationIssue } from '@/core/codexionSimulation';
import type { LogEntry } from '@/core/parseCodexionLog';

export interface CodexionSimulationData {
    entries: LogEntry[];
    coderIds: number[];
    segments: Map<number, Segment[]>;
    dongleSegments: Map<number, DongleSegment[]>;
    minTime: number;
    maxTime: number;
    visualToReal: (v: number) => number;
    coderStats: any;
    issues: SimulationIssue[];
}

export function useCodexionSimulation(
    rawLog: string,
    padding: number,
    timeToRefactor?: number,
    dongleCooldown = 0,
    timeToBurnout = 0,
    command?: string
) {
    const [data, setData] = useState<CodexionSimulationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!rawLog) return;
        
        let isMounted = true;
        setIsLoading(true);
        setError(null);

        prepareCodexionSimulation(rawLog, padding, timeToRefactor, dongleCooldown, timeToBurnout, command)
            .then(result => {
                if (isMounted) {
                    setData(result);
                    setIsLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [rawLog, padding, timeToRefactor, dongleCooldown, timeToBurnout, command]);

    return { data, isLoading, error };
}
