import { splitCommand } from "@/core/commandParams";

function looksLikeCommand(line: string): boolean {
    const { binary, args } = splitCommand(line);
    if (binary === null || args.length === 0) return false;
    if (!/codexion/i.test(binary) && !binary.startsWith("./")) return false;
    return args.every((a) => /^-?\d+$/.test(a) || /^(fifo|edf)$/i.test(a));
}

export function splitImportedLog(text: string): { command: string | null; lines: string[] } {
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
    const first = (lines[0] ?? "").trim().replace(/^\$\s*/, "");
    if (looksLikeCommand(first)) {
        return { command: first, lines: lines.slice(1) };
    }
    return { command: null, lines };
}
