import { describe, expect, it } from "vitest";
import { computeMetrics, jainIndex } from "@/core/metrics";
import { parseCodexionLog } from "@/core/parseCodexionLog";
import { resolveParams } from "@/core/commandParams";

const params = resolveParams("./codexion 2 500 100 50 50 1 0 fifo");

describe("metrics", () => {
  it("computes Jain's fairness index", () => {
    expect(jainIndex([3, 3, 3])).toBe(1);
    expect(jainIndex([2, 0])).toBe(0.5);
    expect(jainIndex([])).toBe(1);
  });

  it("measures waits, margins and the outcome", () => {
    const entries = parseCodexionLog(`
0 1 has taken a dongle
0 1 has taken a dongle
0 1 is compiling
100 1 is debugging
100 2 has taken a dongle
100 2 has taken a dongle
100 2 is compiling
150 1 is refactoring
200 2 is debugging
250 2 is refactoring`);
    const m = computeMetrics(entries, params, [1, 2]);
    expect(m.outcome.kind).toBe("completed");
    expect(m.totalCompiles).toBe(2);
    expect(m.fairness).toBe(1);
    const c2 = m.coders.find((c) => c.coderId === 2)!;
    expect(c2.maxWait).toBe(100);
    expect(c2.minMargin).toBe(400);
    expect(c2.holdTime).toBe(200);
    expect(c2.deadlines).toEqual([500, 600]);
    expect(m.minMargin).toEqual({ value: 400, coderId: 2 });
  });

  it("reports burnouts", () => {
    const m = computeMetrics(parseCodexionLog("500 2 burned out"), params, [1, 2]);
    expect(m.outcome).toEqual({ kind: "burnout", coderId: 2, timestamp: 500 });
  });

  it("hides deadlines when the burnout time is unknown", () => {
    const m = computeMetrics(parseCodexionLog("0 1 is compiling"), params, [1], false);
    expect(m.coders[0].deadlines).toEqual([]);
    expect(m.minMargin).toBeNull();
  });
});
