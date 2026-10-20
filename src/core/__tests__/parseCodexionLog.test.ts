import { describe, expect, it } from "vitest";
import { getCoderIds, getTimeRange, parseCodexionLines, parseCodexionLog } from "@/core/parseCodexionLog";

describe("parseCodexionLog", () => {
  it("parses entries with line numbers and normalized actions", () => {
    const { entries, invalidLines } = parseCodexionLines(["0 1 has  taken a dongle", "", "nonsense", "12 2 is compiling  "]);
    expect(entries).toEqual([
      { timestamp: 0, coderId: 1, action: "has taken a dongle", line: 1 },
      { timestamp: 12, coderId: 2, action: "is compiling", line: 4 },
    ]);
    expect(invalidLines).toEqual([{ line: 3, content: "nonsense" }]);
  });

  it("keeps the legacy string API", () => {
    expect(parseCodexionLog("5 3 is debugging\n")).toHaveLength(1);
    expect(parseCodexionLog("")).toEqual([]);
  });

  it("fills missing coders from the command", () => {
    const entries = parseCodexionLog("0 1 is compiling\n0 3 is compiling");
    expect(getCoderIds(entries, "./codexion 4 800 200 200 200 5 0 fifo")).toEqual([[1, 2, 3, 4], [2, 4]]);
    expect(getCoderIds(entries, "4 800 200 200 200 5 0 fifo")).toEqual([[1, 2, 3, 4], [2, 4]]);
    expect(getCoderIds(entries)).toEqual([[1, 3], []]);
  });

  it("computes the time range", () => {
    expect(getTimeRange(parseCodexionLog("30 1 a\n5 1 b\n12 2 c"))).toEqual([5, 30]);
    expect(getTimeRange([])).toEqual([0, 0]);
  });
});
