import { describe, expect, it } from "vitest";
import { parseCodexionLines, getCoderIds } from "@/core/parseCodexionLog";
import { formatCommand, knownParams, randomParams, resolveParams } from "@/core/commandParams";
import type { CodexionParams } from "@/core/commandParams";
import { isRingAssignable, validateCodexionLog } from "@/core/validateCodexionLog";
import type { IssueRule } from "@/core/validateCodexionLog";
import { runCodexionSimulationWithParams } from "@/core/codexionLocalSimulation";

const COMMAND = "./codexion 3 500 100 50 50 2 20 fifo";

function validate(log: string, command = COMMAND) {
  const { entries, invalidLines } = parseCodexionLines(log.trim().split("\n"));
  const params = resolveParams(command);
  const [coderIds, missing] = getCoderIds(entries, command);
  return validateCodexionLog(entries, invalidLines, params, coderIds, missing, knownParams(command));
}

function rules(log: string, command = COMMAND, type?: "error" | "warning"): IssueRule[] {
  return validate(log, command)
    .filter((i) => !type || i.type === type)
    .map((i) => i.rule);
}

const CYCLE_C1 = `
0 1 has taken a dongle
0 1 has taken a dongle
0 1 is compiling
100 1 is debugging
150 1 is refactoring`;

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("isRingAssignable", () => {
  it("accepts valid holdings", () => {
    expect(isRingAssignable([2, 0, 1])).toBe(true);
    expect(isRingAssignable([1, 1, 1])).toBe(true);
    expect(isRingAssignable([2, 0, 2, 0])).toBe(true);
    expect(isRingAssignable([1])).toBe(true);
    expect(isRingAssignable([1, 1])).toBe(true);
  });

  it("rejects impossible holdings", () => {
    expect(isRingAssignable([2, 2, 0])).toBe(false);
    expect(isRingAssignable([2, 1, 1])).toBe(false);
    expect(isRingAssignable([2])).toBe(false);
    expect(isRingAssignable([2, 1])).toBe(false);
    expect(isRingAssignable([3, 0, 0])).toBe(false);
  });
});

describe("validateCodexionLog", () => {
  it("accepts a clean partial cycle", () => {
    expect(rules(CYCLE_C1, COMMAND, "error")).toEqual([]);
  });

  it("flags lines that cannot be parsed", () => {
    expect(rules("hello world\n0 1 has taken a dongle")).toContain("invalid-line");
  });

  it("flags unknown actions once", () => {
    const issues = validate("0 1 is sleeping\n5 1 is sleeping");
    const unknown = issues.filter((i) => i.rule === "unknown-action");
    expect(unknown).toHaveLength(1);
    expect(unknown[0].message).toContain("2 occurrences");
  });

  it("flags timestamps going backwards", () => {
    expect(rules("10 1 has taken a dongle\n5 2 has taken a dongle")).toContain("timestamp-order");
  });

  it("flags lines printed after a burnout", () => {
    expect(rules("500 1 burned out\n501 2 has taken a dongle")).toContain("after-burnout");
  });

  it("flags coder ids out of range", () => {
    expect(rules("0 7 has taken a dongle")).toContain("coder-range");
    expect(rules("0 0 has taken a dongle")).toContain("coder-range");
  });

  it("flags two neighbours holding the same dongle", () => {
    const log = `
0 1 has taken a dongle
0 1 has taken a dongle
0 2 has taken a dongle
0 2 has taken a dongle`;
    expect(rules(log)).toContain("dongle-conflict");
  });

  it("flags compiling without two dongles", () => {
    expect(rules("0 1 has taken a dongle\n0 1 is compiling")).toContain("dongle-conflict");
  });

  it("flags invalid state transitions", () => {
    expect(rules("0 1 is debugging")).toContain("transition");
    expect(rules("0 1 is refactoring")).toContain("transition");
  });

  it("flags actions that are too short", () => {
    const log = `
0 1 has taken a dongle
0 1 has taken a dongle
0 1 is compiling
50 1 is debugging`;
    const issues = validate(log).filter((i) => i.rule === "duration");
    expect(issues[0].type).toBe("error");
    expect(issues[0].message).toContain("compiled for 50 ms");
  });

  it("warns about actions that are too long", () => {
    const log = `
0 1 has taken a dongle
0 1 has taken a dongle
0 1 is compiling
130 1 is debugging`;
    expect(validate(log).find((i) => i.rule === "duration")?.type).toBe("warning");
  });

  it("flags refactoring that ends early", () => {
    expect(rules(`${CYCLE_C1}\n170 1 has taken a dongle`)).toContain("duration");
  });

  it("flags dongles taken during their cooldown", () => {
    const log = `${CYCLE_C1}
105 2 has taken a dongle
106 2 has taken a dongle`;
    expect(rules(log)).toContain("cooldown");
  });

  it("accepts dongles taken after the cooldown", () => {
    const log = `
0 1 has taken a dongle
0 1 has taken a dongle
0 1 is compiling
100 1 is debugging
125 2 has taken a dongle
125 2 has taken a dongle
125 2 is compiling`;
    expect(rules(log, COMMAND, "error")).toEqual([]);
  });

  it("flags late burnout announcements", () => {
    expect(rules("530 1 burned out")).toContain("burnout-precision");
  });

  it("accepts a burnout within 10 ms", () => {
    expect(rules("505 1 burned out", COMMAND, "error")).toEqual([]);
  });

  it("flags burnouts before the deadline", () => {
    expect(rules("100 1 burned out")).toContain("burnout-early");
  });

  it("flags coders compiling after their deadline", () => {
    const log = `
600 1 has taken a dongle
600 1 has taken a dongle
600 1 is compiling`;
    expect(rules(log)).toContain("missed-burnout");
  });

  it("flags another coder that should have burned out first", () => {
    const log = `${CYCLE_C1}
600 1 burned out`;
    const issues = validate(log).filter((i) => i.rule === "missed-burnout");
    expect(issues.map((i) => i.coderId).sort()).toEqual([2, 3]);
  });

  it("warns when the run ends before every coder finished", () => {
    expect(rules(CYCLE_C1)).toContain("incomplete");
  });

  it("disables timing checks without a command", () => {
    const log = `
0 1 has taken a dongle
0 1 has taken a dongle
0 1 is compiling
5 1 is debugging`;
    const found = rules(log, "");
    expect(found).toContain("missing-params");
    expect(found).not.toContain("duration");
  });

  it("warns about a possible FIFO violation", () => {
    const log = `
0 1 has taken a dongle
0 1 has taken a dongle
0 1 is compiling
0 2 has taken a dongle
100 1 is debugging
150 1 is refactoring
200 1 has taken a dongle
200 1 has taken a dongle
200 1 is compiling`;
    expect(rules(log)).toContain("scheduler");
  });

  it("caps the number of reported issues", () => {
    const lines = Array.from({ length: 400 }, (_, i) => `garbage ${i}`).join("\n");
    const issues = validate(lines);
    expect(issues.filter((i) => i.rule === "invalid-line")).toHaveLength(100);
    expect(issues.at(-1)?.rule).toBe("truncated");
  });

  it("finds no errors in reference simulations", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const params: CodexionParams = randomParams(mulberry(seed));
      const command = formatCommand(params);
      const log = runCodexionSimulationWithParams(params);
      const errors = validate(log, command).filter((i) => i.type === "error");
      expect(errors, `${command}\n${errors.map((e) => e.message).join("\n")}`).toEqual([]);
    }
  });
});
