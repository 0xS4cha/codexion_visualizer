import { describe, expect, it } from "vitest";
import { splitImportedLog } from "@/lib/importLog";
import { parseBridgeMessage } from "@/lib/bridgeProtocol";

describe("splitImportedLog", () => {
  it("detects a command on the first line", () => {
    expect(splitImportedLog("./codexion 4 800 200 200 200 5 0 fifo\r\n0 1 is compiling\r\n\r\n")).toEqual({
      command: "./codexion 4 800 200 200 200 5 0 fifo",
      lines: ["0 1 is compiling"],
    });
    expect(splitImportedLog("$ ./codexion 2 500\n0 1 is compiling").command).toBe("./codexion 2 500");
  });

  it("keeps plain logs untouched", () => {
    expect(splitImportedLog("0 1 is compiling\n5 1 is debugging")).toEqual({ command: null, lines: ["0 1 is compiling", "5 1 is debugging"] });
    expect(splitImportedLog("some header text\n0 1 is compiling").command).toBeNull();
  });
});

describe("parseBridgeMessage", () => {
  it("parses protocol frames", () => {
    expect(parseBridgeMessage('{"type":"lines","lines":["0 1 a"]}')).toEqual({ type: "lines", lines: ["0 1 a"] });
    expect(parseBridgeMessage('{"type":"eof","code":139,"signal":null}')).toMatchObject({ type: "eof", code: 139 });
  });

  it("treats anything else as raw log text", () => {
    expect(parseBridgeMessage("0 1 has taken a dongle")).toBeNull();
    expect(parseBridgeMessage('{"type": broken')).toBeNull();
  });
});
