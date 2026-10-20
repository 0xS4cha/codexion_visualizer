import { prepareSimulation } from "@/core/codexionSimulation";
import type { PrepareOptions } from "@/core/codexionSimulation";

self.onmessage = async (event: MessageEvent<{ id: number; options: PrepareOptions }>) => {
  const { id, options } = event.data;
  try {
    const result = await prepareSimulation(options);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
