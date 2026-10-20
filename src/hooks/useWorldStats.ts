import { useCallback, useEffect, useState } from "react";
import type { StatsRange, StatsResponse } from "@/types/stats";

type State = {
  data: StatsResponse | null;
  empty: boolean;
  error: string | null;
  loading: boolean;
};

function isStatsResponse(body: unknown): body is StatsResponse {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<StatsResponse>;
  return (
    typeof b.visits === "number" &&
    Array.isArray(b.daily) &&
    Array.isArray(b.cities) &&
    Array.isArray(b.recentVisits) &&
    Array.isArray(b.countriesRows) &&
    typeof b.visitorsByCountry === "object" &&
    typeof b.runsByCountry === "object" &&
    typeof b.product === "object"
  );
}

export function useWorldStats(range: StatsRange) {
  const [state, setState] = useState<State>({ data: null, empty: false, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(`/api/stats?range=${range}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || body?.error) throw new Error(body?.error ?? `Request failed (${res.status})`);
        if (body?.empty) return null;
        if (!isStatsResponse(body)) throw new Error("Unexpected response from /api/stats");
        return body;
      })
      .then((body) => {
        if (body === null) setState({ data: null, empty: true, error: null, loading: false });
        else setState({ data: body, empty: false, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState((s) => ({ ...s, loading: false, error: error instanceof Error ? error.message : "Failed to load stats" }));
      });

    return () => controller.abort();
  }, [range, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { ...state, retry };
}
