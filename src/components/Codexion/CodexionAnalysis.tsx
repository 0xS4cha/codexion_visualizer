import { useMemo, useState } from "react";
import { useCodexionSimulation } from "@/hooks/useCodexionSimulation";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";
import { AlertTriangle, AlertCircle, Activity, CircleCheck, Download, Crosshair } from "lucide-react";
import { RULE_LABELS } from "@/core/validateCodexionLog";
import type { IssueRule, SimulationIssue } from "@/core/validateCodexionLog";
import { useAppDispatch } from "@/store/hooks";
import { focusAt } from "@/store/features/viewSlice";
import { downloadBlob, issuesToCsv } from "@/lib/exporters";

type SeverityFilter = "all" | "error" | "warning";

function IssueRow({ issue, onFocus }: { issue: SimulationIssue; onFocus?: () => void }) {
  const isError = issue.type === "error";
  const Wrapper = onFocus ? "button" : "div";
  return (
    <Wrapper
      type={onFocus ? "button" : undefined}
      onClick={onFocus}
      className={`flex w-full gap-3 rounded-lg border p-3 text-left transition ${isError ? "bg-red-500/5 border-red-500/10" : "bg-amber-500/5 border-amber-500/10"} ${onFocus ? "cursor-pointer hover:bg-white/10" : ""}`}
    >
      <div className="mt-0.5">
        {isError ? <AlertCircle className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium break-words ${isError ? "text-red-200/80" : "text-amber-200/80"}`}>{issue.message}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/30">
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-white/45">{RULE_LABELS[issue.rule]}</span>
          {issue.timestamp !== undefined && <span>at {issue.timestamp} ms</span>}
          {issue.coderId !== undefined && <span>Coder {issue.coderId}</span>}
          {issue.line !== undefined && <span>line {issue.line}</span>}
        </div>
      </div>
      {onFocus && <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />}
    </Wrapper>
  );
}

export default function CodexionAnalysis() {
  const { data } = useCodexionSimulation();
  const dispatch = useAppDispatch();
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [rule, setRule] = useState<IssueRule | "all">("all");

  const issues = useMemo(() => data?.issues ?? [], [data]);
  const ruleCounts = useMemo(() => {
    const counts = new Map<IssueRule, number>();
    for (const i of issues) counts.set(i.rule, (counts.get(i.rule) ?? 0) + 1);
    return counts;
  }, [issues]);

  if (!data) return <></>;
  const { coderIds, metrics } = data;
  if (coderIds.length === 0) return null;

  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const filtered = issues.filter((i) => (severity === "all" || i.type === severity) && (rule === "all" || i.rule === rule));

  const maxCompiles = Math.max(1, ...metrics.coders.map((c) => c.compiles));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
            <ShinyText text="Log Validation" disabled={false} speed={3} className="" />
          </h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSeverity(severity === "error" ? "all" : "error")} className={`flex items-center gap-1.5 text-[10px] cursor-pointer ${severity === "error" ? "text-red-300 underline" : "text-red-400"}`}>
              <AlertCircle className="w-3 h-3" />
              {errors.length} Errors
            </button>
            <button type="button" onClick={() => setSeverity(severity === "warning" ? "all" : "warning")} className={`flex items-center gap-1.5 text-[10px] cursor-pointer ${severity === "warning" ? "text-amber-300 underline" : "text-amber-400"}`}>
              <AlertTriangle className="w-3 h-3" />
              {warnings.length} Warnings
            </button>
            {issues.length > 0 && (
              <button type="button" onClick={() => downloadBlob(issuesToCsv(data), "codexion-issues.csv", "text/csv")} className="text-white/40 hover:text-white/80 cursor-pointer" title="Export issues (CSV)" aria-label="Export issues as CSV">
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {ruleCounts.size > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setRule("all")} className={`rounded-full px-2.5 py-1 text-[10px] cursor-pointer ${rule === "all" ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
              All
            </button>
            {Array.from(ruleCounts.entries()).map(([r, count]) => (
              <button key={r} type="button" onClick={() => setRule(rule === r ? "all" : r)} className={`rounded-full px-2.5 py-1 text-[10px] cursor-pointer ${rule === r ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                {RULE_LABELS[r]} · {count}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/40">
              <CircleCheck className="w-8 h-8 mb-2 text-emerald-500/60" />
              <p className="text-sm">No issues detected. Your log follows every rule we check.</p>
            </div>
          ) : (
            filtered.map((issue, idx) => (
              <IssueRow
                key={idx}
                issue={issue}
                onFocus={
                  issue.timestamp !== undefined
                    ? () => dispatch(focusAt({ time: issue.timestamp!, tab: "timeline", coderId: issue.coderId }))
                    : undefined
                }
              />
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
            <ShinyText text="Performance Metrics" disabled={false} speed={3} className="" />
          </h2>
          <Activity className="w-4 h-4 text-white/30" />
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-[10px] uppercase text-white/40">Dongle use</div>
            <div className="text-sm font-semibold text-white/85">{Math.round(metrics.dongleUtilization * 100)}%</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-[10px] uppercase text-white/40">Fairness</div>
            <div className="text-sm font-semibold text-white/85">{metrics.fairness.toFixed(3)}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-[10px] uppercase text-white/40">Avg wait</div>
            <div className="text-sm font-semibold text-white/85">{Math.round(metrics.avgWait)} ms</div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-auto custom-scrollbar">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-[#141417] text-white/40">
              <tr>
                <th className="py-1.5 pr-2 font-medium">Coder</th>
                <th className="py-1.5 pr-2 font-medium">Compiles</th>
                <th className="py-1.5 pr-2 font-medium">Avg wait</th>
                <th className="py-1.5 pr-2 font-medium">Max wait</th>
                <th className="py-1.5 pr-2 font-medium">Min margin</th>
                <th className="py-1.5 font-medium">Dongle hold</th>
              </tr>
            </thead>
            <tbody className="font-mono text-white/75">
              {metrics.coders.map((c) => (
                <tr key={c.coderId} className="border-t border-white/5">
                  <td className="py-1.5 pr-2">{c.coderId}</td>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 tabular-nums">{c.compiles}</span>
                      <div className="h-1.5 w-16 rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-blue-400" style={{ width: `${(c.compiles / maxCompiles) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-1.5 pr-2">{Math.round(c.avgWait)}</td>
                  <td className="py-1.5 pr-2">{c.maxWait}</td>
                  <td className={`py-1.5 pr-2 ${c.minMargin !== null && c.minMargin < 0 ? "text-red-300" : c.minMargin !== null && c.minMargin < 20 ? "text-amber-300" : ""}`}>
                    {c.minMargin ?? "—"}
                  </td>
                  <td className="py-1.5">{c.holdTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-white/30">
          Times in ms. Wait = time between asking for dongles and starting to compile. Margin = time left before the burnout deadline when compiling started.
        </p>
      </div>
    </div>
  );
}
