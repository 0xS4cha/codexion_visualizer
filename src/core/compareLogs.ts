import type { LogEntry } from "@/core/parseCodexionLog";
import { TOLERANCE_MS } from "@/core/validateCodexionLog";

export interface Divergence {
  coderId: number;
  index: number;
  timestamp: number;
  user?: LogEntry;
  reference?: LogEntry;
  reason: "action" | "timing" | "missing" | "extra";
}

export interface LogComparison {
  firstDivergence: Divergence | null;
  divergences: Divergence[];
  matchingCoders: number;
  totalCoders: number;
}

function groupByCoder(entries: LogEntry[]): Map<number, LogEntry[]> {
  const map = new Map<number, LogEntry[]>();
  for (const e of entries) {
    if (!map.has(e.coderId)) map.set(e.coderId, []);
    map.get(e.coderId)!.push(e);
  }
  return map;
}

export function compareLogs(user: LogEntry[], reference: LogEntry[], tolerance = TOLERANCE_MS): LogComparison {
  const u = groupByCoder(user);
  const r = groupByCoder(reference);
  const coders = Array.from(new Set([...u.keys(), ...r.keys()])).sort((a, b) => a - b);
  const divergences: Divergence[] = [];

  for (const coderId of coders) {
    const ue = u.get(coderId) ?? [];
    const re = r.get(coderId) ?? [];
    const len = Math.max(ue.length, re.length);
    for (let i = 0; i < len; i++) {
      const a = ue[i];
      const b = re[i];
      if (a && b) {
        if (a.action !== b.action) {
          divergences.push({ coderId, index: i, timestamp: Math.min(a.timestamp, b.timestamp), user: a, reference: b, reason: "action" });
          break;
        }
        if (Math.abs(a.timestamp - b.timestamp) > tolerance) {
          divergences.push({ coderId, index: i, timestamp: Math.min(a.timestamp, b.timestamp), user: a, reference: b, reason: "timing" });
          break;
        }
      } else if (b) {
        divergences.push({ coderId, index: i, timestamp: b.timestamp, reference: b, reason: "missing" });
        break;
      } else if (a) {
        divergences.push({ coderId, index: i, timestamp: a.timestamp, user: a, reason: "extra" });
        break;
      }
    }
  }

  divergences.sort((a, b) => a.timestamp - b.timestamp || a.coderId - b.coderId);
  return {
    firstDivergence: divergences[0] ?? null,
    divergences,
    matchingCoders: coders.length - divergences.length,
    totalCoders: coders.length,
  };
}

export function describeDivergence(d: Divergence): string {
  const fmt = (e?: LogEntry) => (e ? `"${e.timestamp} ${e.coderId} ${e.action}"` : "nothing");
  switch (d.reason) {
    case "action":
      return `Coder ${d.coderId}, event #${d.index + 1}: you logged ${fmt(d.user)}, the reference logged ${fmt(d.reference)}.`;
    case "timing":
      return `Coder ${d.coderId}, event #${d.index + 1}: same action but ${Math.abs(d.user!.timestamp - d.reference!.timestamp)} ms apart (${fmt(d.user)} vs ${fmt(d.reference)}).`;
    case "missing":
      return `Coder ${d.coderId} stops after ${d.index} event(s); the reference continues with ${fmt(d.reference)}.`;
    case "extra":
      return `Coder ${d.coderId} keeps going with ${fmt(d.user)}; the reference stopped after ${d.index} event(s).`;
  }
}
