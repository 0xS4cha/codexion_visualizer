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

import { useCodexionSimulationContext } from '@/context/CodexionSimulationContext';

export function useCodexionSimulation() {
    const { data, isLoading, error } = useCodexionSimulationContext();
    return { data, isLoading, error };
}
