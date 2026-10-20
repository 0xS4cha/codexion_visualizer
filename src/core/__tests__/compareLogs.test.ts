import { describe, expect, it } from "vitest";
import { compareLogs, describeDivergence } from "@/core/compareLogs";
import { parseCodexionLog } from "@/core/parseCodexionLog";

const ref = parseCodexionLog("0 1 has taken a dongle\n0 1 is compiling\n100 1 is debugging\n0 2 has taken a dongle");

describe("compareLogs", () => {
  it("matches identical logs", () => {
    const result = compareLogs(ref, ref);
    expect(result.firstDivergence).toBeNull();
    expect(result.matchingCoders).toBe(2);
  });

  it("tolerates small timing differences", () => {
    const user = parseCodexionLog("0 1 has taken a dongle\n1 1 is compiling\n108 1 is debugging\n0 2 has taken a dongle");
    expect(compareLogs(user, ref).firstDivergence).toBeNull();
  });

  it("finds the earliest divergence", () => {
    const user = parseCodexionLog("0 1 has taken a dongle\n0 1 is compiling\n100 1 is refactoring\n0 2 is compiling");
    const result = compareLogs(user, ref);
    expect(result.firstDivergence).toMatchObject({ coderId: 2, reason: "action", timestamp: 0 });
    expect(result.divergences).toHaveLength(2);
    expect(describeDivergence(result.firstDivergence!)).toContain("Coder 2");
  });

  it("detects timing, missing and extra events", () => {
    expect(compareLogs(parseCodexionLog("0 1 has taken a dongle\n0 1 is compiling\n150 1 is debugging\n0 2 has taken a dongle"), ref).firstDivergence?.reason).toBe("timing");
    expect(compareLogs(parseCodexionLog("0 1 has taken a dongle\n0 2 has taken a dongle"), ref).firstDivergence?.reason).toBe("missing");
    expect(compareLogs(parseCodexionLog("0 1 has taken a dongle\n0 1 is compiling\n100 1 is debugging\n0 2 has taken a dongle\n5 2 has taken a dongle"), ref).firstDivergence?.reason).toBe("extra");
  });
});
