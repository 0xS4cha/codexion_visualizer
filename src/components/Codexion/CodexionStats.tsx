import { useCodexionSimulation } from "@/hooks/useCodexionSimulation";
import type { SimulationMetrics } from "@/core/metrics";

function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}

export function outcomeLabel(metrics: SimulationMetrics): { label: string; tone: "good" | "bad" | "neutral" } {
  const o = metrics.outcome;
  if (o.kind === "burnout") return { label: `Coder ${o.coderId} burned out at ${o.timestamp} ms`, tone: "bad" };
  if (o.kind === "completed") return { label: `Completed at ${o.timestamp} ms`, tone: "good" };
  if (o.kind === "unfinished") return { label: `Stopped at ${o.timestamp} ms`, tone: "neutral" };
  return { label: "No data", tone: "neutral" };
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" | "neutral" }) {
  const color = tone === "bad" ? "text-red-300" : tone === "good" ? "text-emerald-300" : "text-white/90";
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/5 p-3">
      <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${color}`}>{value}</span>
      {hint && <span className="text-[10px] text-white/35">{hint}</span>}
    </div>
  );
}

export default function CodexionStats() {
  const { data } = useCodexionSimulation();
  if (!data || data.entries.length === 0) return null;
  const m = data.metrics;
  const errors = data.issues.filter((i) => i.type === "error").length;
  const outcome = outcomeLabel(m);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">Run summary</h2>
        <span className={`text-xs font-medium ${outcome.tone === "bad" ? "text-red-300" : outcome.tone === "good" ? "text-emerald-300" : "text-white/60"}`}>
          {outcome.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Duration" value={formatMs(m.duration)} />
        <Tile label="Compiles" value={String(m.totalCompiles)} hint={`${data.coderIds.length} coders`} />
        <Tile label="Avg wait" value={formatMs(m.avgWait)} hint={`max ${formatMs(m.maxWait)}`} />
        <Tile
          label="Min margin"
          value={m.minMargin ? formatMs(m.minMargin.value) : "—"}
          hint={m.minMargin ? `coder ${m.minMargin.coderId}` : "needs the command"}
          tone={m.minMargin && m.minMargin.value < 0 ? "bad" : undefined}
        />
        <Tile label="Fairness" value={m.fairness.toFixed(3)} hint="Jain index (1 = equal)" tone={m.fairness < 0.9 ? "bad" : undefined} />
        <Tile label="Issues" value={String(errors)} hint={`${data.issues.length - errors} warnings`} tone={errors > 0 ? "bad" : "good"} />
      </div>
    </div>
  );
}
