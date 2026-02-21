import type { LogEntry } from "@/lib/parseCodexionLog";
import {
  parseCodexionLog,
  getCoderIds,
  getTimeRange,
} from "@/lib/parseCodexionLog";

export interface Segment {
  startTime: number;
  endTime: number;
  action: string;
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

export function buildSegments(
  entries: LogEntry[],
  instantDuration = 10
): { segments: Map<number, Segment[]>; maxTime: number } {
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
      };
    };
  
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
          end = Math.max(nextTimestamp, start + instantDuration);
        } else {
          end = start + Math.max(averageDuration, instantDuration);
        };
  
        if (end > globalMaxTime) {
          globalMaxTime = end;
        };
  
        segs.push({ startTime: start, endTime: end, action: sorted[i].action });
  
        currentVirtualTime = end;
      };
      segments.set(coderId, segs);
    }
    return { segments, maxTime: globalMaxTime };
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
  const [minTime] = getTimeRange(entries);

  const { segments, maxTime } = buildSegments(entries, 10);

  return {
    entries,
    coderIds,
    segments,
    minTime,
    maxTime,
  };
}