import type { LogEntry } from "@/lib/parseCodexionLog";
import {
  parseCodexionLog,
  getCoderIds,
} from "@/lib/parseCodexionLog";

export interface Segment {
  startTime: number;
  endTime: number;
  action: string;
  realStart: number;
  realEnd: number;
}

export const ACTION_COLORS: Record<string, string> = {
    "has taken a dongle": "rgba(251, 191, 36, 0.9)",
    "is compiling": "rgba(96, 165, 250, 0.9)",
    "is debugging": "rgba(167, 139, 250, 0.9)",
    "is refactoring": "rgba(52, 211, 153, 0.9)",
    "burned out": "rgba(248, 113, 113, 0.9)",
    "unknow action": "rgba(156, 163, 175, 0.5)"
};

export function getActionColor(action: string): string {
  return ACTION_COLORS[action] ?? ACTION_COLORS["unknow action"];
}

function interpolate(v: number, vKeys: number[], rValues: number[]): number {
  if (vKeys.length === 0) return 0;
  if (v <= vKeys[0]) return rValues[0];
  if (v >= vKeys[vKeys.length - 1]) return rValues[rValues.length - 1];

  let i = 0;
  while (i < vKeys.length - 1 && vKeys[i + 1] <= v) {
    i++;
  }

  const v0 = vKeys[i];
  const v1 = vKeys[i + 1];
  const r0 = rValues[i];
  const r1 = rValues[i + 1];

  if (v1 === v0) return r0;

  const t = (v - v0) / (v1 - v0);
  return Math.round(r0 + t * (r1 - r0));
}

export function buildSegments(
  entries: LogEntry[],
  instantDuration = 10
): { 
  segments: Map<number, Segment[]>; 
  maxTime: number;
  visualToReal: (v: number) => number;
} {
    const byCoder = new Map<number, LogEntry[]>();
    for (const e of entries) {
      if (!byCoder.has(e.coderId)) byCoder.set(e.coderId, []);
      byCoder.get(e.coderId)!.push(e);
    }
  
    const timestamps = new Set<number>();
    for (const e of entries) timestamps.add(e.timestamp);
    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);
    const visualMap = new Map<number, number>();
    const visualKeys: number[] = [];
    const realValues: number[] = [];

    let currentVisual = 0;
    if (sortedTimestamps.length > 0) {
        visualMap.set(sortedTimestamps[0], 0);
        visualKeys.push(0);
        realValues.push(sortedTimestamps[0]);
    }

    for (let i = 0; i < sortedTimestamps.length - 1; i++) {
        const tCurr = sortedTimestamps[i];
        const tNext = sortedTimestamps[i + 1];
        const realDelta = tNext - tCurr;
        
        let maxStack = 0;
        for (const evts of byCoder.values()) {
            const count = evts.filter(e => e.timestamp === tCurr).length;
            if (count > 0) {
                maxStack = Math.max(maxStack, count * instantDuration);
            }
        }
      
        const visualDelta = Math.max(realDelta, maxStack);
        currentVisual += visualDelta;
        visualMap.set(tNext, currentVisual);
        visualKeys.push(currentVisual);
        realValues.push(tNext);
    }
  
    const segments = new Map<number, Segment[]>();
    let globalMaxTime = 0;
    const lastSegmentDuration = 50;

    for (const [coderId, evts] of byCoder) {
      const sorted = [...evts].sort((a, b) => a.timestamp - b.timestamp);
      const segs: Segment[] = [];
      let currentVisualEnd = 0;
  
      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        const realT = entry.timestamp;
        const visualStartBase = visualMap.get(realT)!;
        
        let start = visualStartBase;
        if (i > 0 && sorted[i - 1].timestamp === realT) {
          start = Math.max(start, currentVisualEnd);
        }
  
        let end;
        let actualRealEnd;
      if (i + 1 < sorted.length) {
          const nextEntry = sorted[i + 1];
          actualRealEnd = nextEntry.timestamp; 

          if (nextEntry.timestamp === realT) {
             end = start + instantDuration;
          } else {
             const nextVisualBase = visualMap.get(nextEntry.timestamp)!;
             end = Math.max(nextVisualBase, start + instantDuration);
          }
        } else {
          end = start + Math.max(lastSegmentDuration, instantDuration);
          actualRealEnd = realT + lastSegmentDuration; 
        }
  
        if (end > globalMaxTime) {
          globalMaxTime = end;
        };
  
        segs.push({ startTime: start, endTime: end, action: entry.action, realStart: realT, realEnd: actualRealEnd });
  
        currentVisualEnd = end;
      };
      segments.set(coderId, segs);
    }

    if (sortedTimestamps.length > 0) {
        visualKeys.push(globalMaxTime);
        const lastReal = sortedTimestamps[sortedTimestamps.length - 1];
        const lastVisual = visualMap.get(lastReal)!;
        realValues.push(lastReal + (globalMaxTime - lastVisual));
    }

    const visualToReal = (v: number) => interpolate(v, visualKeys, realValues);

    return { segments, maxTime: globalMaxTime, visualToReal };
  }

export function getStatusAtTime(
  segments: Segment[] | undefined,
  time: number
): string {
  if (!segments) return "Nothing";

  const seg = segments.find(
    (s) => time >= s.startTime && time < s.endTime
  );

  return seg?.action ?? "Nothing";
}

export function prepareCodexionSimulation(rawLog: string) {
  const entries = parseCodexionLog(rawLog);
  const coderIds = getCoderIds(entries);
  
  const minTime = 0;

  const { segments, maxTime, visualToReal } = buildSegments(entries, 10);

  return {
    entries,
    coderIds,
    segments,
    minTime,
    maxTime,
    visualToReal
  };
}
