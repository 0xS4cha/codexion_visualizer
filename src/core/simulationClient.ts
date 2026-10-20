import { prepareSimulation, interpolate } from "@/core/codexionSimulation";
import type { PrepareOptions, SimulationResult } from "@/core/codexionSimulation";

export interface CodexionSimulationData extends SimulationResult {
  visualToReal: (v: number) => number;
  realToVisual: (r: number) => number;
}

export function withTimeMapping(result: SimulationResult): CodexionSimulationData {
  const { visualKeys, realValues } = result;
  return {
    ...result,
    visualToReal: (v: number) => interpolate(v, visualKeys, realValues),
    realToVisual: (r: number) => interpolate(r, realValues, visualKeys),
  };
}

type Pending = { resolve: (r: SimulationResult) => void; reject: (e: Error) => void };

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./simulation.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; result?: SimulationResult; error?: string }>) => {
      const { id, result, error } = event.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (error || !result) p.reject(new Error(error ?? "Simulation failed"));
      else p.resolve(result);
    };
    worker.onerror = () => {
      workerBroken = true;
      worker?.terminate();
      worker = null;
      for (const p of pending.values()) p.reject(new Error("Simulation worker crashed"));
      pending.clear();
    };
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

export function runSimulation(options: PrepareOptions): Promise<SimulationResult> {
  const w = getWorker();
  if (!w) return prepareSimulation(options);
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, options });
  });
}
