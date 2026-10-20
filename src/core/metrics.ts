import type { LogEntry } from "@/core/parseCodexionLog";
import type { CodexionParams } from "@/core/commandParams";
import { ACTIONS } from "@/core/validateCodexionLog";

export interface CoderMetrics {
  coderId: number;
  compiles: number;
  actions: number;
  avgWait: number;
  maxWait: number;
  minMargin: number | null;
  holdTime: number;
  compileTime: number;
  deadlines: number[];
}

export type RunOutcome =
  | { kind: "burnout"; coderId: number; timestamp: number }
  | { kind: "completed"; timestamp: number }
  | { kind: "unfinished"; timestamp: number }
  | { kind: "empty" };

export interface SimulationMetrics {
  duration: number;
  totalCompiles: number;
  fairness: number;
  dongleUtilization: number;
  avgWait: number;
  maxWait: number;
  minMargin: { value: number; coderId: number } | null;
  outcome: RunOutcome;
  coders: CoderMetrics[];
}

function maxOf(values: number[]): number {
  let m = -Infinity;
  for (const v of values) if (v > m) m = v;
  return m;
}

function minOf(values: number[]): number {
  let m = Infinity;
  for (const v of values) if (v < m) m = v;
  return m;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}

export function jainIndex(values: number[]): number {
  if (values.length === 0) return 1;
  let sum = 0;
  let sumSq = 0;
  for (const v of values) {
    sum += v;
    sumSq += v * v;
  }
  if (sumSq === 0) return 1;
  return (sum * sum) / (values.length * sumSq);
}

interface Track {
  waitingSince: number;
  waits: number[];
  lastCompileStart: number;
  margins: number[];
  takeTimes: number[];
  holdTime: number;
  compileStart: number | null;
  compileTime: number;
  compiles: number;
  actions: number;
  deadlines: number[];
  refactorStart: number | null;
}

export function computeMetrics(entries: LogEntry[], params: CodexionParams, coderIds: number[], burnoutKnown = true): SimulationMetrics {
  const empty: SimulationMetrics = {
    duration: 0,
    totalCompiles: 0,
    fairness: 1,
    dongleUtilization: 0,
    avgWait: 0,
    maxWait: 0,
    minMargin: null,
    outcome: { kind: "empty" },
    coders: [],
  };
  if (entries.length === 0) return empty;

  let minTs = Infinity;
  let maxTs = -Infinity;
  for (const e of entries) {
    if (e.timestamp < minTs) minTs = e.timestamp;
    if (e.timestamp > maxTs) maxTs = e.timestamp;
  }
  const start = minTs >= 0 && minTs <= Math.max(params.timeToBurnout, 1000) ? 0 : minTs;

  const tracks = new Map<number, Track>();
  for (const id of coderIds) {
    tracks.set(id, {
      waitingSince: start,
      waits: [],
      lastCompileStart: start,
      margins: [],
      takeTimes: [],
      holdTime: 0,
      compileStart: null,
      compileTime: 0,
      compiles: 0,
      actions: 0,
      deadlines: [start + params.timeToBurnout],
      refactorStart: null,
    });
  }

  let outcome: RunOutcome | null = null;

  for (const e of entries) {
    if (outcome) break;
    const tr = tracks.get(e.coderId);
    if (!tr) continue;
    tr.actions++;
    const t = e.timestamp;
    switch (e.action) {
      case ACTIONS.TAKE:
        if (tr.takeTimes.length === 0) {
          if (tr.refactorStart !== null) {
            tr.waitingSince = Math.min(t, tr.refactorStart + params.timeToRefactor);
            tr.refactorStart = null;
          }
        }
        tr.takeTimes.push(t);
        break;
      case ACTIONS.COMPILE:
        tr.waits.push(Math.max(0, t - tr.waitingSince));
        tr.margins.push(tr.lastCompileStart + params.timeToBurnout - t);
        tr.lastCompileStart = t;
        tr.deadlines.push(t + params.timeToBurnout);
        tr.compileStart = t;
        tr.compiles++;
        break;
      case ACTIONS.DEBUG:
        for (const take of tr.takeTimes) tr.holdTime += t - take;
        tr.takeTimes = [];
        if (tr.compileStart !== null) {
          tr.compileTime += t - tr.compileStart;
          tr.compileStart = null;
        }
        break;
      case ACTIONS.REFACTOR:
        tr.refactorStart = t;
        break;
      case ACTIONS.BURNOUT:
        outcome = { kind: "burnout", coderId: e.coderId, timestamp: t };
        break;
    }
  }

  const end = outcome && outcome.kind === "burnout" ? outcome.timestamp : maxTs;
  const coders: CoderMetrics[] = [];
  for (const [coderId, tr] of tracks) {
    for (const take of tr.takeTimes) tr.holdTime += end - take;
    const waits = tr.waits;
    coders.push({
      coderId,
      compiles: tr.compiles,
      actions: tr.actions,
      avgWait: mean(waits),
      maxWait: waits.length ? maxOf(waits) : 0,
      minMargin: burnoutKnown && tr.margins.length ? minOf(tr.margins) : null,
      holdTime: tr.holdTime,
      compileTime: tr.compileTime,
      deadlines: burnoutKnown ? tr.deadlines : [],
    });
  }

  if (!outcome) {
    const required = params.numCompilesRequired;
    const done = required > 0 && coders.every((c) => c.compiles >= required);
    outcome = done ? { kind: "completed", timestamp: maxTs } : { kind: "unfinished", timestamp: maxTs };
  }

  const duration = Math.max(0, end - start);
  const allWaits = coders.flatMap((c) => (tracks.get(c.coderId)?.waits ?? []));
  let minMargin: SimulationMetrics["minMargin"] = null;
  for (const c of coders) {
    if (c.minMargin !== null && (minMargin === null || c.minMargin < minMargin.value)) {
      minMargin = { value: c.minMargin, coderId: c.coderId };
    }
  }
  const dongles = Math.max(1, coderIds.length);
  const totalHold = coders.reduce((a, c) => a + c.holdTime, 0);

  return {
    duration,
    totalCompiles: coders.reduce((a, c) => a + c.compiles, 0),
    fairness: jainIndex(coders.map((c) => c.compiles)),
    dongleUtilization: duration > 0 ? Math.min(1, totalHold / (dongles * duration)) : 0,
    avgWait: mean(allWaits),
    maxWait: allWaits.length ? maxOf(allWaits) : 0,
    minMargin,
    outcome,
    coders,
  };
}
