import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { LogEntry } from "@/lib/parseCodexionLog";
import {
  parseCodexionLog,
  getCoderIds,
  getTimeRange,
} from "@/lib/parseCodexionLog";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";

interface Segment {
  startTime: number;
  endTime: number;
  action: string;
}

const INSTANT_ACTION_DURATION = 10; 
const ACTION_COLORS: Record<string, string> = {
  "has taken a dongle": "rgba(245, 158, 11, 0.9)",
  "is compiling": "rgba(59, 130, 246, 0.9)",
  "is debugging": "rgba(168, 85, 247, 0.9)",
  "is refactoring": "rgba(16, 185, 129, 0.9)",
  "burned out": "rgba(255, 0, 0, 0.9)",
  "unknow action": "rgba(255, 255, 255, 0.5)"
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] ?? ACTION_COLORS["unknow action"];
}

function buildSegments(entries: LogEntry[]): { segments: Map<number, Segment[]>, newMaxTime: number } {
  const byCoder = new Map<number, LogEntry[]>();
  for (const e of entries) {
    if (!byCoder.has(e.coderId)) byCoder.set(e.coderId, []);
    byCoder.get(e.coderId)!.push(e);
  }
  let totalDuration = 0;
  let closedCount = 0;

  for (const evts of byCoder.values()) {
    const sorted = [...evts].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 0; i < sorted.length - 1; i++) {
      totalDuration += sorted[i + 1].timestamp - sorted[i].timestamp;
      closedCount++;
    }
  }

  const averageDuration = closedCount > 0 ? totalDuration / closedCount : 50;

  const segments = new Map<number, Segment[]>();
  let globalMaxTime = 0;
  for (const [coderId, evts] of byCoder) {
    const sorted = [...evts].sort((a, b) => a.timestamp - b.timestamp);
    const segs: Segment[] = [];
    let currentVirtualTime = 0; 

    for (let i = 0; i < sorted.length; i++) {
      const actualStart = sorted[i].timestamp;
      const start = Math.max(actualStart, currentVirtualTime);

      let end;
      if (i + 1 < sorted.length) {
        const nextTimestamp = sorted[i + 1].timestamp;
        end = Math.max(nextTimestamp, start + INSTANT_ACTION_DURATION);
      } else {
        end = start + Math.max(averageDuration, INSTANT_ACTION_DURATION);
      }

      if (end > globalMaxTime) {
        globalMaxTime = end;
      }

      segs.push({ startTime: start, endTime: end, action: sorted[i].action });

      currentVirtualTime = end;
    }
    segments.set(coderId, segs);
  }
  return { segments, newMaxTime: globalMaxTime };
}

interface CodexionTimelineProps {
  rawLog: string;
}

export default function CodexionTimeline({ rawLog }: CodexionTimelineProps) {
  const [zoom, setZoom] = useState<number>(1);

  const { entries, coderIds, minTime, maxTime, segments } = useMemo(() => {
    const entries = parseCodexionLog(rawLog);
    const coderIds = getCoderIds(entries);
    const [minT] = getTimeRange(entries);
    const { segments, newMaxTime } = buildSegments(entries);
    return {
      entries,
      coderIds,
      minTime: minT,
      maxTime: newMaxTime,
      timeSpan: newMaxTime - minT || 1,
      segments,
    };
  }, [rawLog]);

  if (entries.length === 0) {
    return (
      <GlassSurface
        width="100%"
        height={56}
        borderRadius={16}
        className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/40"
      >
        Past the Codexion logs above to view them.
      </GlassSurface>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-4">
      {/* SECTION 1: CONTRÔLES (Fixes en haut) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">Zoom</span>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-white/10 accent-white/70 hover:bg-white/20"
            style={{ outline: 'none', WebkitAppearance: 'none' }}
          />
          <span className="min-w-[3rem] text-right text-sm font-medium text-white/70">
            {zoom.toFixed(1)}×
          </span>
        </div>
        <div className="text-xs font-medium text-white/60">
          Time (ms)
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/5 bg-black/10 relative">
        
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }} className="flex flex-col py-2">
          
          <div className="relative flex flex-col gap-2">
            {coderIds.map((coderId) => (
              <div key={coderId} className="flex items-center h-10 group">
                
                <div className="sticky left-0 z-20 w-24 shrink-0 flex items-center justify-end px-3 font-mono text-sm text-white/80 bg-[#121212]/90 backdrop-blur-md h-full border-r border-white/10 shadow-[4px_0_15px_rgba(0,0,0,0.5)] transition-colors group-hover:bg-[#1a1a1a]/90">
                  Coder {coderId}
                </div>


                <div className="flex-1 relative h-8 mx-2 bg-white/5 rounded-md overflow-hidden">
                  {(segments.get(coderId) ?? []).map((seg, i) => {
                    const timeSpan = maxTime - minTime || 1;
                    const trueLeft = ((seg.startTime - minTime) / timeSpan) * 100;
                    const trueWidth = ((seg.endTime - seg.startTime) / timeSpan) * 100;
                    const isWideEnough = (trueWidth * zoom) > 3;

                    return (
                      <motion.div
                        key={`${coderId}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="absolute top-0 bottom-0 rounded-md overflow-hidden border-r border-black/20"
                        style={{
                          left: `${trueLeft}%`,
                          width: `${trueWidth}%`,
                          backgroundColor: getActionColor(seg.action),
                        }}
                        title={`Coder ${coderId} ${seg.action}\nStart: ${seg.startTime}\nEnd: ${seg.endTime}`}
                      >
                        {isWideEnough && (
                          <span className="absolute inset-0 flex items-center justify-center truncate px-2 text-[11px] font-medium text-white/90 drop-shadow-md">
                            {seg.action}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center mt-3 h-6">
            <div className="sticky left-0 z-20 w-24 shrink-0 bg-[#121212]/90 backdrop-blur-md h-full border-r border-white/10" />
            <div className="flex-1 relative mx-2">
              {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                const t = Math.round(minTime + (maxTime - minTime) * p);
                return (
                  <div
                    key={p}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${p * 100}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="h-1 w-[1px] bg-white/30 mb-1" />
                    <span className="font-mono text-[10px] text-white/40">
                      {t}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4">
        {Object.entries(ACTION_COLORS).map(([action, color]) => (
          <div key={action} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-white/70">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}