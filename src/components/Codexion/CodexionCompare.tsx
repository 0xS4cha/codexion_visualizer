import { useMemo } from "react";
import { GitCompare, Info } from "lucide-react";
import { useCodexionSimulation } from "@/hooks/useCodexionSimulation";
import { useCodexionSimulationContext, useSimulationRunner } from "@/context/CodexionSimulationContext";
import { runCodexionSimulationWithParams } from "@/core/codexionLocalSimulation";
import { compareLogs, describeDivergence } from "@/core/compareLogs";
import type { PrepareOptions } from "@/core/codexionSimulation";
import CodexionTimeline from "@/components/Codexion/CodexionTimeline";
import { outcomeLabel } from "@/components/Codexion/CodexionStats";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { focusAt } from "@/store/features/viewSlice";
import type { CodexionSimulationData } from "@/core/simulationClient";

function SummaryColumn({ title, data }: { title: string; data: CodexionSimulationData | null }) {
  if (!data) return <div className="rounded-lg bg-white/5 p-3 text-xs text-white/40">{title}: computing…</div>;
  const m = data.metrics;
  const outcome = outcomeLabel(m);
  const errors = data.issues.filter((i) => i.type === "error").length;
  return (
    <div className="rounded-lg bg-white/5 p-3 text-xs">
      <div className="mb-2 font-semibold uppercase tracking-wider text-white/60">{title}</div>
      <div className={outcome.tone === "bad" ? "text-red-300" : outcome.tone === "good" ? "text-emerald-300" : "text-white/70"}>{outcome.label}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-white/60">
        <span>compiles</span><span className="text-right">{m.totalCompiles}</span>
        <span>avg wait</span><span className="text-right">{Math.round(m.avgWait)} ms</span>
        <span>fairness</span><span className="text-right">{m.fairness.toFixed(3)}</span>
        <span>log lines</span><span className="text-right">{data.entries.length}</span>
        <span>errors</span><span className={`text-right ${errors ? "text-red-300" : ""}`}>{errors}</span>
      </div>
    </div>
  );
}

export default function CodexionCompare() {
  const { data } = useCodexionSimulation();
  const { params, known } = useCodexionSimulationContext();
  const command = useAppSelector((s) => s.user_input.command);
  const padding = useAppSelector((s) => s.settings.instantActionPadding);
  const dispatch = useAppDispatch();
  const complete = known.length === 8;

  const options = useMemo<PrepareOptions | null>(() => {
    if (!complete) return null;
    const lines = runCodexionSimulationWithParams(params).split("\n");
    return { lines, params, command, padding };
  }, [complete, params, command, padding]);

  const { data: reference } = useSimulationRunner(options);

  const comparison = useMemo(
    () => (data && reference ? compareLogs(data.entries, reference.entries) : null),
    [data, reference]
  );

  if (!data) return <></>;

  if (!complete) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Paste the full command (8 arguments) to compare your log with the reference simulation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
        <div className="mb-4 flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-white/50" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">Reference comparison</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryColumn title="Your log" data={data} />
          <SummaryColumn title="Reference" data={reference} />
        </div>
        {comparison && (
          <div className="mt-4 space-y-2">
            {comparison.firstDivergence ? (
              <>
                <button
                  type="button"
                  onClick={() => dispatch(focusAt({ time: comparison.firstDivergence!.timestamp, coderId: comparison.firstDivergence!.coderId }))}
                  className="w-full rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-left text-xs text-amber-200/90 transition hover:bg-amber-500/10 cursor-pointer"
                >
                  <div className="mb-1 font-semibold">First divergence at {comparison.firstDivergence.timestamp} ms</div>
                  {describeDivergence(comparison.firstDivergence)}
                </button>
                <p className="text-[11px] text-white/40">
                  {comparison.matchingCoders}/{comparison.totalCoders} coders match the reference exactly. Diverging is not always a bug — thread scheduling is not deterministic — but a different outcome usually is.
                </p>
                {comparison.divergences.length > 1 && (
                  <details className="text-xs text-white/60">
                    <summary className="cursor-pointer text-white/50">All divergences ({comparison.divergences.length})</summary>
                    <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                      {comparison.divergences.map((d) => (
                        <li key={d.coderId}>
                          <button type="button" className="text-left hover:text-white cursor-pointer" onClick={() => dispatch(focusAt({ time: d.timestamp, coderId: d.coderId }))}>
                            {describeDivergence(d)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200/90">
                Your log matches the reference simulation event for event (±10 ms).
              </div>
            )}
          </div>
        )}
      </div>

      <CodexionTimeline data={data} title="Your log" exportName="codexion-user" />
      <CodexionTimeline data={reference} title="Reference" exportName="codexion-reference" showPlayback={false} />
    </div>
  );
}
