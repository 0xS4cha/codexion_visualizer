import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "@/lib/share";

describe("share links", () => {
  it("round-trips a compressed run", async () => {
    const run = { command: "./codexion 4 800 200 200 200 5 0 fifo", output: Array.from({ length: 500 }, (_, i) => `${i} 1 is compiling`), dongleCooldown: 10 };
    const encoded = await encodeShare(run);
    expect(encoded.startsWith("z1.")).toBe(true);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(encoded.length).toBeLessThan(JSON.stringify(run).length / 4);
    expect(await decodeShare(encoded)).toEqual(run);
  });

  it("decodes legacy base64 links", async () => {
    const legacy = Buffer.from(JSON.stringify({ command: "./codexion 2 é", output: ["0 1 is compiling"] }), "utf8").toString("base64");
    expect(await decodeShare(legacy)).toEqual({ command: "./codexion 2 é", output: ["0 1 is compiling"] });
  });

  it("rejects corrupted links", async () => {
    expect(await decodeShare("z1.notvalid!!")).toBeNull();
    expect(await decodeShare("%%%")).toBeNull();
  });

  it("drops non-string lines", async () => {
    const encoded = await encodeShare({ command: "x", output: ["ok", 3 as unknown as string] });
    expect((await decodeShare(encoded))?.output).toEqual(["ok"]);
  });
});
