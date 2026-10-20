import { describe, expect, it } from "vitest";
import {
  DEFAULT_PARAMS,
  PRESETS,
  formatCommand,
  knownParams,
  parseCommand,
  randomParams,
  resolveParams,
  splitCommand,
  validateCommand,
} from "@/core/commandParams";

describe("commandParams", () => {
  it("parses a command with a binary", () => {
    expect(parseCommand("./codexion 4 800 200 100 150 5 0 fifo")).toEqual({
      numCoders: 4,
      timeToBurnout: 800,
      timeToCompile: 200,
      timeToDebug: 100,
      timeToRefactor: 150,
      numCompilesRequired: 5,
      dongleCooldown: 0,
      scheduler: "fifo",
    });
  });

  it("parses a command without a binary", () => {
    expect(parseCommand("3 600 100 100 100 2 10 EDF")).toMatchObject({ numCoders: 3, dongleCooldown: 10, scheduler: "edf" });
  });

  it("keeps zero values instead of falling back to defaults", () => {
    expect(resolveParams("./codexion 2 500 100 100 100 0 0 fifo")).toMatchObject({ numCompilesRequired: 0, dongleCooldown: 0 });
  });

  it("only reports the parameters that are present", () => {
    expect(knownParams("./codexion 4 800")).toEqual(["numCoders", "timeToBurnout"]);
    expect(knownParams("")).toEqual([]);
    expect(resolveParams("./codexion 4 800").timeToCompile).toBe(DEFAULT_PARAMS.timeToCompile);
  });

  it("uses the fallback before defaults", () => {
    expect(resolveParams("./codexion 4", { dongleCooldown: 77 }).dongleCooldown).toBe(77);
    expect(resolveParams("./codexion 4 1 1 1 1 1 5 fifo", { dongleCooldown: 77 }).dongleCooldown).toBe(5);
  });

  it("splits the binary from the arguments", () => {
    expect(splitCommand("  ./codexion   1 2 ")).toEqual({ binary: "./codexion", args: ["1", "2"] });
    expect(splitCommand("1 2")).toEqual({ binary: null, args: ["1", "2"] });
  });

  it("round-trips through formatCommand", () => {
    for (const preset of PRESETS) {
      expect(resolveParams(formatCommand(preset.params))).toEqual(preset.params);
    }
  });

  it("validates commands", () => {
    expect(validateCommand("")).toEqual([]);
    expect(validateCommand("./codexion 4 800 200 200 200 5 0 fifo")).toEqual([]);
    const errors = validateCommand("./codexion 0 abc 200 200 200 5 0 rr");
    expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(["numCoders", "timeToBurnout", "scheduler"]));
    expect(validateCommand("./codexion 4 800").some((e) => e.field === "command")).toBe(true);
  });

  it("generates random parameters that pass validation", () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 200; i++) {
      expect(validateCommand(formatCommand(randomParams(rand)))).toEqual([]);
    }
  });
});
