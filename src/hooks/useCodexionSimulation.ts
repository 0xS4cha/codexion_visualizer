import { useCodexionSimulationContext } from '@/context/CodexionSimulationContext';

export type { CodexionSimulationData } from '@/core/simulationClient';

export function useCodexionSimulation() {
    const { data, isLoading, error } = useCodexionSimulationContext();
    return { data, isLoading, error };
}
