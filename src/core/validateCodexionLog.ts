import type { LogEntry, InvalidLine } from "@/core/parseCodexionLog";
import type { CodexionParams } from "@/core/commandParams";

export const ACTIONS = {
  TAKE: "has taken a dongle",
  COMPILE: "is compiling",
  DEBUG: "is debugging",
  REFACTOR: "is refactoring",
  BURNOUT: "burned out",
} as const;

export const KNOWN_ACTIONS: string[] = Object.values(ACTIONS);

export type IssueRule =
  | "invalid-line"
  | "unknown-action"
  | "timestamp-order"
  | "after-burnout"
  | "coder-range"
  | "idle-coder"
  | "dongle-conflict"
  | "transition"
  | "duration"
  | "cooldown"
  | "burnout-precision"
  | "burnout-early"
  | "missed-burnout"
  | "incomplete"
  | "scheduler"
  | "missing-params"
  | "truncated";

export const RULE_LABELS: Record<IssueRule, string> = {
  "invalid-line": "Invalid line",
  "unknown-action": "Unknown action",
  "timestamp-order": "Timestamp order",
  "after-burnout": "Log after burnout",
  "coder-range": "Coder id",
  "idle-coder": "Idle coder",
  "dongle-conflict": "Dongle conflict",
  "transition": "Invalid transition",
  "duration": "Duration",
  "cooldown": "Cooldown",
  "burnout-precision": "Burnout delay",
  "burnout-early": "Early burnout",
  "missed-burnout": "Missed burnout",
  "incomplete": "Incomplete run",
  "scheduler": "Scheduler",
  "missing-params": "Missing command",
  "truncated": "Truncated",
};

export interface SimulationIssue {
  type: "warning" | "error";
  rule: IssueRule;
  message: string;
  timestamp?: number;
  coderId?: number;
  dongleId?: number;
  line?: number;
}

export const TOLERANCE_MS = 10;
const MAX_ISSUES = 500;
const MAX_PER_RULE = 100;

type CoderState = "idle" | "waiting" | "compiling" | "debugging" | "refactoring" | "burned";

interface CoderTrack {
  state: CoderState;
  held: number;
  lastCompileStart: number;
  stateSince: number;
  waitingSince: number;
  firstTakeTime: number;
  firstDongle: number | null;
  compiles: number;
  actions: number;
}

export function isRingAssignable(held: number[]): boolean {
  const n = held.length;
  if (n === 0) return true;
  if (n === 1) return held[0] <= 1;
  let total = 0;
  for (const h of held) {
    if (h > 2 || h < 0) return false;
    total += h;
  }
  if (total > n) return false;

  const zero = held.indexOf(0);
  if (zero !== -1) {
    let leftFree = true;
    for (let step = 1; step < n; step++) {
      const k = (zero + step) % n;
      let need = held[k];
      if (need > 0 && leftFree) need--;
      if (need > 1) return false;
      leftFree = need === 0;
    }
    return true;
  }

  const tryOption = (coder0TakesLeft: boolean): boolean => {
    let leftFree = coder0TakesLeft;
    for (let k = 0; k < n; k++) {
      let need = held[k];
      if (need > 0 && leftFree) need--;
      const rightAvailable = k === n - 1 ? !coder0TakesLeft : true;
      if (need > 1) return false;
      if (need === 1 && !rightAvailable) return false;
      leftFree = need === 0;
    }
    return true;
  };
  return tryOption(true) || tryOption(false);
}

export function validateCodexionLog(
  entries: LogEntry[],
  invalidLines: InvalidLine[],
  params: CodexionParams,
  coderIds: number[],
  missingCoders: number[] = [],
  known: (keyof CodexionParams)[] = Object.keys(params) as (keyof CodexionParams)[]
): SimulationIssue[] {
  const has = (key: keyof CodexionParams) => known.includes(key);
  const issues: SimulationIssue[] = [];
  const perRule = new Map<IssueRule, number>();
  let dropped = 0;

  const push = (issue: SimulationIssue) => {
    const count = perRule.get(issue.rule) ?? 0;
    if (count >= MAX_PER_RULE || issues.length >= MAX_ISSUES) {
      dropped++;
      return;
    }
    perRule.set(issue.rule, count + 1);
    issues.push(issue);
  };

  for (const inv of invalidLines) {
    push({
      type: "warning",
      rule: "invalid-line",
      message: `Line ${inv.line} could not be parsed: "${inv.content.slice(0, 80)}". Expected "<timestamp> <coder> <action>".`,
      line: inv.line,
    });
  }

  for (const id of missingCoders) {
    push({ type: "warning", rule: "idle-coder", message: `Coder ${id} never logged any action (it may have waited for dongles the whole run).`, coderId: id });
  }

  const finish = () => {
    if (dropped > 0) {
      issues.push({
        type: "warning",
        rule: "truncated",
        message: `${dropped} more issue(s) were hidden to keep the report readable.`,
      });
    }
    return issues;
  };

  if (entries.length === 0) return finish();

  if (known.length < 8) {
    push({
      type: "warning",
      rule: "missing-params",
      message: "The command is missing or incomplete: timing, cooldown and burnout checks that depend on it are disabled.",
    });
  }

  const checkBurnout = has("timeToBurnout");
  const checkCooldown = has("dongleCooldown");
  const checkCompletion = has("numCompilesRequired");
  const checkScheduler = has("scheduler");
  const {
    timeToBurnout,
    timeToCompile,
    timeToDebug,
    timeToRefactor,
    numCompilesRequired,
    dongleCooldown,
    scheduler,
  } = params;
  const numCoders = has("numCoders") ? params.numCoders : Math.max(1, ...coderIds);

  const ring = [...coderIds].filter((id) => id >= 1 && id <= numCoders).sort((a, b) => a - b);
  const n = ring.length;
  const indexOf = new Map<number, number>();
  ring.forEach((id, i) => indexOf.set(id, i));

  let minTs = Infinity;
  let maxTs = -Infinity;
  for (const e of entries) {
    if (e.timestamp < minTs) minTs = e.timestamp;
    if (e.timestamp > maxTs) maxTs = e.timestamp;
  }
  const simStart = minTs >= 0 && minTs <= Math.max(timeToBurnout, 1000) ? 0 : minTs;

  const tracks: CoderTrack[] = ring.map(() => ({
    state: "idle",
    held: 0,
    lastCompileStart: simStart,
    stateSince: simStart,
    waitingSince: simStart,
    firstTakeTime: simStart,
    firstDongle: null,
    compiles: 0,
    actions: 0,
  }));
  const held = new Array<number>(n).fill(0);
  const releaseTime = new Array<number | undefined>(n).fill(undefined);
  let conflictActive = false;

  const leftDongle = (k: number) => (k - 1 + n) % n;
  const rightDongle = (k: number) => k;
  const inCooldown = (d: number, t: number) =>
    checkCooldown &&
    dongleCooldown > 0 && releaseTime[d] !== undefined && t + TOLERANCE_MS < releaseTime[d]! + dongleCooldown;

  const unknownActions = new Map<string, { count: number; first: LogEntry }>();
  const reportedRange = new Set<number>();
  const schedulerPairs = new Set<string>();
  let previousTs = -Infinity;
  let burnoutEntry: LogEntry | null = null;
  let afterBurnoutCount = 0;
  let firstAfterBurnout: LogEntry | null = null;

  for (const entry of entries) {
    const { timestamp: t, coderId, action, line } = entry;

    if (t < previousTs) {
      push({
        type: "error",
        rule: "timestamp-order",
        message: `Timestamp ${t} ms on line ${line} is earlier than the previous line (${previousTs} ms). Logs must be printed in chronological order.`,
        timestamp: t,
        coderId,
        line,
      });
    }
    previousTs = Math.max(previousTs, t);

    if (burnoutEntry) {
      afterBurnoutCount++;
      if (!firstAfterBurnout) firstAfterBurnout = entry;
      continue;
    }

    if (!KNOWN_ACTIONS.includes(action)) {
      const existing = unknownActions.get(action);
      if (existing) existing.count++;
      else unknownActions.set(action, { count: 1, first: entry });
      continue;
    }

    if (coderId < 1 || coderId > numCoders) {
      if (!reportedRange.has(coderId)) {
        reportedRange.add(coderId);
        push({
          type: "error",
          rule: "coder-range",
          message: `Coder id ${coderId} is out of range (expected 1..${numCoders}).`,
          timestamp: t,
          coderId,
          line,
        });
      }
      continue;
    }

    const k = indexOf.get(coderId);
    if (k === undefined) continue;
    const c = tracks[k];
    c.actions++;

    if (c.state === "refactoring" && action !== ACTIONS.BURNOUT && has("timeToRefactor")) {
      const lasted = t - c.stateSince;
      if (lasted + TOLERANCE_MS < timeToRefactor) {
        push({
          type: "error",
          rule: "duration",
          message: `Coder ${coderId} stopped refactoring after ${lasted} ms (expected ${timeToRefactor} ms).`,
          timestamp: t,
          coderId,
          line,
        });
      }
    }

    if (action === ACTIONS.TAKE) {
      if (c.state === "compiling" || c.state === "debugging") {
        push({
          type: "error",
          rule: "transition",
          message: `Coder ${coderId} took a dongle while ${c.state}.`,
          timestamp: t,
          coderId,
          line,
        });
      }
      if (c.state !== "waiting") {
        c.waitingSince = c.state === "refactoring" ? Math.min(t, c.stateSince + timeToRefactor) : c.waitingSince;
        c.state = "waiting";
        c.stateSince = t;
        c.firstTakeTime = t;
        c.firstDongle = null;
      }

      if (c.held >= 2) {
        push({
          type: "error",
          rule: "dongle-conflict",
          message: `Coder ${coderId} took a third dongle (a coder can only hold 2).`,
          timestamp: t,
          coderId,
          line,
        });
      } else if (n === 1 && c.held >= 1) {
        push({
          type: "error",
          rule: "dongle-conflict",
          message: `Coder ${coderId} took a second dongle, but there is only one dongle on the table.`,
          timestamp: t,
          coderId,
          line,
        });
      }

      const L = leftDongle(k);
      const R = rightDongle(k);
      if (c.held === 0) {
        c.firstTakeTime = t;
        const candidates = [L, R].filter((d, i, arr) => arr.indexOf(d) === i && !inCooldown(d, t));
        if (candidates.length === 0 && checkCooldown && dongleCooldown > 0) {
          push({
            type: "error",
            rule: "cooldown",
            message: `Coder ${coderId} took a dongle while both of its dongles were still cooling down (cooldown ${dongleCooldown} ms).`,
            timestamp: t,
            coderId,
            line,
          });
        }
        c.firstDongle = candidates.length === 1 ? candidates[0] : null;
      } else if (c.held === 1 && n > 1) {
        const second = c.firstDongle === null ? null : c.firstDongle === L ? R : L;
        const violated = second !== null ? inCooldown(second, t) : inCooldown(L, t) && inCooldown(R, t);
        if (violated) {
          push({
            type: "error",
            rule: "cooldown",
            message: `Coder ${coderId} took its second dongle during its cooldown (cooldown ${dongleCooldown} ms).`,
            timestamp: t,
            coderId,
            line,
          });
        }
      }

      c.held++;
      held[k] = c.held;
      const feasible = isRingAssignable(held);
      if (!feasible && !conflictActive) {
        const left = ring[(k - 1 + n) % n];
        const right = ring[(k + 1) % n];
        push({
          type: "error",
          rule: "dongle-conflict",
          message: `Coder ${coderId} took a dongle that was already held (neighbours: coder ${left} holds ${held[(k - 1 + n) % n]}, coder ${right} holds ${held[(k + 1) % n]}).`,
          timestamp: t,
          coderId,
          line,
        });
      }
      conflictActive = !feasible;
    } else if (action === ACTIONS.COMPILE) {
      const deadline = c.lastCompileStart + timeToBurnout;
      if (checkBurnout && t > deadline + TOLERANCE_MS) {
        push({
          type: "error",
          rule: "missed-burnout",
          message: `Coder ${coderId} started compiling at ${t} ms but should have burned out at ${deadline} ms.`,
          timestamp: t,
          coderId,
          line,
        });
      }
      if (c.held !== 2 && n > 1) {
        push({
          type: "error",
          rule: "dongle-conflict",
          message: `Coder ${coderId} started compiling while holding ${c.held} dongle(s) (needs 2).`,
          timestamp: t,
          coderId,
          line,
        });
      }
      if (c.state !== "waiting") {
        push({
          type: "error",
          rule: "transition",
          message: `Coder ${coderId} started compiling right after ${c.state === "idle" ? "the start" : c.state} without taking dongles.`,
          timestamp: t,
          coderId,
          line,
        });
      }

      if (n > 1 && checkScheduler && checkBurnout) {
        const myDeadline = deadline;
        for (const j of [(k - 1 + n) % n, (k + 1) % n]) {
          if (j === k) continue;
          const other = tracks[j];
          if (other.held !== 1 || other.state !== "waiting") continue;
          const otherDeadline = other.lastCompileStart + timeToBurnout;
          const key = `${coderId}-${ring[j]}-${scheduler}`;
          if (schedulerPairs.has(key)) continue;
          if (scheduler === "fifo" && other.firstTakeTime + TOLERANCE_MS < c.waitingSince) {
            schedulerPairs.add(key);
            push({
              type: "warning",
              rule: "scheduler",
              message: `Possible FIFO violation: coder ${coderId} got the dongle shared with coder ${ring[j]}, who had been waiting for it since ${other.firstTakeTime} ms (coder ${coderId} requested at ${c.waitingSince} ms).`,
              timestamp: t,
              coderId,
              line,
            });
          } else if (
            scheduler === "edf" &&
            otherDeadline + TOLERANCE_MS < myDeadline &&
            other.firstTakeTime + TOLERANCE_MS < c.firstTakeTime
          ) {
            schedulerPairs.add(key);
            push({
              type: "warning",
              rule: "scheduler",
              message: `Possible EDF violation: coder ${coderId} (deadline ${myDeadline} ms) got the dongle shared with coder ${ring[j]}, whose deadline was earlier (${otherDeadline} ms).`,
              timestamp: t,
              coderId,
              line,
            });
          }
        }
      }

      c.state = "compiling";
      c.stateSince = t;
      c.lastCompileStart = t;
      c.compiles++;
    } else if (action === ACTIONS.DEBUG) {
      if (c.state !== "compiling") {
        push({
          type: "error",
          rule: "transition",
          message: `Coder ${coderId} started debugging without compiling first (previous state: ${c.state}).`,
          timestamp: t,
          coderId,
          line,
        });
      } else {
        const lasted = has("timeToCompile") ? t - c.stateSince : timeToCompile;
        if (lasted + TOLERANCE_MS < timeToCompile) {
          push({
            type: "error",
            rule: "duration",
            message: `Coder ${coderId} compiled for ${lasted} ms (expected ${timeToCompile} ms).`,
            timestamp: t,
            coderId,
            line,
          });
        } else if (lasted > timeToCompile + TOLERANCE_MS) {
          push({
            type: "warning",
            rule: "duration",
            message: `Coder ${coderId} compiled for ${lasted} ms (expected ${timeToCompile} ms, +${lasted - timeToCompile} ms).`,
            timestamp: t,
            coderId,
            line,
          });
        }
      }
      if (c.held === 2 && n > 1) {
        releaseTime[leftDongle(k)] = t;
        releaseTime[rightDongle(k)] = t;
      }
      c.held = 0;
      held[k] = 0;
      conflictActive = conflictActive && !isRingAssignable(held);
      c.state = "debugging";
      c.stateSince = t;
    } else if (action === ACTIONS.REFACTOR) {
      if (c.state !== "debugging") {
        push({
          type: "error",
          rule: "transition",
          message: `Coder ${coderId} started refactoring without debugging first (previous state: ${c.state}).`,
          timestamp: t,
          coderId,
          line,
        });
      } else {
        const lasted = has("timeToDebug") ? t - c.stateSince : timeToDebug;
        if (lasted + TOLERANCE_MS < timeToDebug) {
          push({
            type: "error",
            rule: "duration",
            message: `Coder ${coderId} debugged for ${lasted} ms (expected ${timeToDebug} ms).`,
            timestamp: t,
            coderId,
            line,
          });
        } else if (lasted > timeToDebug + TOLERANCE_MS) {
          push({
            type: "warning",
            rule: "duration",
            message: `Coder ${coderId} debugged for ${lasted} ms (expected ${timeToDebug} ms, +${lasted - timeToDebug} ms).`,
            timestamp: t,
            coderId,
            line,
          });
        }
      }
      c.state = "refactoring";
      c.stateSince = t;
    } else if (action === ACTIONS.BURNOUT) {
      const deadline = c.lastCompileStart + timeToBurnout;
      if (!checkBurnout) {
        c.state = "burned";
        burnoutEntry = entry;
        continue;
      }
      if (t + TOLERANCE_MS < deadline) {
        push({
          type: "error",
          rule: "burnout-early",
          message: `Coder ${coderId} burned out at ${t} ms, before its deadline (${deadline} ms).`,
          timestamp: t,
          coderId,
          line,
        });
      } else if (t - deadline > TOLERANCE_MS) {
        push({
          type: "error",
          rule: "burnout-precision",
          message: `Burnout logged at ${t} ms but the deadline was ${deadline} ms (+${t - deadline} ms). The subject requires < ${TOLERANCE_MS} ms.`,
          timestamp: t,
          coderId,
          line,
        });
      }
      tracks.forEach((other, j) => {
        if (j === k) return;
        const otherDeadline = other.lastCompileStart + timeToBurnout;
        if (otherDeadline + TOLERANCE_MS < t) {
          push({
            type: "error",
            rule: "missed-burnout",
            message: `Coder ${ring[j]} should have burned out at ${otherDeadline} ms, before coder ${coderId} (${t} ms).`,
            timestamp: otherDeadline,
            coderId: ring[j],
          });
        }
      });
      c.state = "burned";
      c.stateSince = t;
      burnoutEntry = entry;
    }
  }

  for (const [action, { count, first }] of unknownActions) {
    push({
      type: "warning",
      rule: "unknown-action",
      message: `Unknown action "${action.slice(0, 60)}" (${count} occurrence${count > 1 ? "s" : ""}).`,
      timestamp: first.timestamp,
      coderId: first.coderId,
      line: first.line,
    });
  }

  if (burnoutEntry && firstAfterBurnout) {
    push({
      type: "error",
      rule: "after-burnout",
      message: `${afterBurnoutCount} line(s) printed after coder ${burnoutEntry.coderId} burned out. Nothing should be logged after a burnout.`,
      timestamp: firstAfterBurnout.timestamp,
      coderId: firstAfterBurnout.coderId,
      line: firstAfterBurnout.line,
    });
  }

  if (!burnoutEntry && checkBurnout) {
    tracks.forEach((c, k) => {
      const deadline = c.lastCompileStart + timeToBurnout;
      if (deadline + TOLERANCE_MS < maxTs) {
        push({
          type: "error",
          rule: "missed-burnout",
          message: `Coder ${ring[k]}'s deadline (${deadline} ms) passed before the log ended (${maxTs} ms) without a burnout (or the log is truncated).`,
          timestamp: deadline,
          coderId: ring[k],
        });
      }
    });
  }
  if (!burnoutEntry) {
    if (checkCompletion && numCompilesRequired > 0) {
      tracks.forEach((c, k) => {
        if (c.compiles < numCompilesRequired) {
          push({
            type: "warning",
            rule: "incomplete",
            message: `Simulation ended without a burnout but coder ${ring[k]} only compiled ${c.compiles}/${numCompilesRequired} times.`,
            coderId: ring[k],
          });
        }
      });
    }
  }

  return finish();
}
