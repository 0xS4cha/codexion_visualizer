import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { LogEntry } from "@/lib/parseCodexionLog";
import {
  parseCodexionLog,
  getCoderIds,
  getTimeRange,
} from "@/lib/parseCodexionLog";

interface Segment {
  startTime: number;
  endTime: number;
  action: string;
}

const ACTION_COLORS: Record<string, string> = {
  "has taken a dongle": "rgba(245, 158, 11, 0.9)",
  "is compiling": "rgba(59, 130, 246, 0.9)",
  "is debugging": "rgba(168, 85, 247, 0.9)",
  "is refactoring": "rgba(16, 185, 129, 0.9)",
  "has put down a dongle": "rgba(100, 116, 139, 0.8)",
  "is sleeping": "rgba(82, 82, 91, 0.8)",
  "is thinking": "rgba(6, 182, 212, 0.85)",
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] ?? "rgba(255, 255, 255, 0.5)";
}

function buildSegments(entries: LogEntry[], maxTime: number): Map<number, Segment[]> {
  const byCoder = new Map<number, LogEntry[]>();
  for (const e of entries) {
    if (!byCoder.has(e.coderId)) byCoder.set(e.coderId, []);
    byCoder.get(e.coderId)!.push(e);
  }

  const segments = new Map<number, Segment[]>();
  for (const [coderId, evts] of byCoder) {
    const sorted = [...evts].sort((a, b) => a.timestamp - b.timestamp);
    const segs: Segment[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const start = sorted[i].timestamp;
      const end = i + 1 < sorted.length ? sorted[i + 1].timestamp : maxTime + 1;
      segs.push({ startTime: start, endTime: end, action: sorted[i].action });
    }
    segments.set(coderId, segs);
  }
  return segments;
}

interface CodexionTimelineProps {
  rawLog: string;
}

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3, 4, 5];
const BASE_BAR_WIDTH = 500;

export default function CodexionTimeline({ rawLog }: CodexionTimelineProps) {
  const [zoom, setZoom] = useState(1);

  const { entries, coderIds, minTime, maxTime, segments } = useMemo(() => {
    const entries = parseCodexionLog(rawLog);
    const coderIds = getCoderIds(entries);
    const [minT, maxT] = getTimeRange(entries);
    const segments = buildSegments(entries, maxT);
    return {
      entries,
      coderIds,
      minTime: minT,
      maxTime: maxT,
      timeSpan: maxT - minT || 1,
      segments,
    };
  }, [rawLog]);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/40">
        Colle les logs Codexion ci-dessus pour visualiser
      </div>
    );
  }

  const rowHeight = 44;
  const padding = 48;
  const barWidth = BASE_BAR_WIDTH * zoom;

  return (
    <div className="overflow-x-auto overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setZoom((z) => {
                const i = ZOOM_LEVELS.indexOf(z);
                return i > 0 ? ZOOM_LEVELS[i - 1] : z;
              })
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10"
            aria-label="Zoom arrière"
          >
            −
          </button>
          <span className="min-w-[4rem] text-center text-sm font-medium text-white/70">
            {zoom}×
          </span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => {
                const i = ZOOM_LEVELS.indexOf(z);
                return i >= 0 && i < ZOOM_LEVELS.length - 1
                  ? ZOOM_LEVELS[i + 1]
                  : z;
              })
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10"
            aria-label="Zoom avant"
          >
            +
          </button>
        </div>
        <span className="text-xs text-white/40">Zoom</span>
      </div>

      <div
        className="min-w-max"
        style={{
          height: coderIds.length * rowHeight + padding * 2,
        }}
      >
        <div className="mb-2 flex gap-4 text-xs font-medium text-white/60">
          <div className="w-16 shrink-0" />
          <div className="text-right" style={{ width: barWidth }}>
            Temps (ms)
          </div>
        </div>

        <div className="relative">
          {coderIds.map((coderId) => (
            <div
              key={coderId}
              className="flex items-center gap-4"
              style={{ height: rowHeight }}
            >
              <div
                className="w-16 shrink-0 text-right font-mono text-sm text-white/80"
                title={`Coder ${coderId}`}
              >
                Coder {coderId}
              </div>
              <div
                className="relative shrink-0 overflow-hidden rounded-lg"
                style={{
                  width: barWidth,
                  minHeight: 36,
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                {(segments.get(coderId) ?? []).map((seg, i) => {
                  const timeSpan = maxTime - minTime + 1;
                  const left = ((seg.startTime - minTime) / timeSpan) * 100;
                  const width = ((seg.endTime - seg.startTime) / timeSpan) * 100;
                  return (
                    <motion.div
                      key={`${coderId}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="absolute top-1 bottom-1 rounded-md"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 2)}%`,
                        backgroundColor: getActionColor(seg.action),
                      }}
                      title={`${seg.startTime}–${seg.endTime}: ${seg.action}`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center overflow-hidden truncate px-2 text-xs font-medium text-white/90">
                        {seg.action}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-2 flex gap-2 pl-20 text-xs text-white/40"
          style={{ width: 80 + barWidth }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const t = Math.round(minTime + (maxTime - minTime) * p);
            return (
              <span key={p} className="flex-1 text-right font-mono">
                {t}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
        {Object.entries(ACTION_COLORS).map(([action, color]) => (
          <div key={action} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-white/70">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
