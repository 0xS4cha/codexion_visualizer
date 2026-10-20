import { useEffect, useState } from "react";
import type { PulseResponse } from "@/types/stats";

const REFRESH_MS = 60 * 1000;

export function usePulse() {
  const [data, setData] = useState<PulseResponse | null>(null);

  useEffect(() => {
    let controller = new AbortController();
    const load = () => {
      controller.abort();
      controller = new AbortController();
      fetch("/api/pulse", { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((body: PulseResponse | null) => {
          if (body && typeof body.liveVisitors === "number") setData(body);
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => {
      window.clearInterval(id);
      controller.abort();
    };
  }, []);

  return data;
}
