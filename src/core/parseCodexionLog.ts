import { parseCommand } from "@/core/commandParams";

export interface LogEntry {
  timestamp: number;
  coderId: number;
  action: string;
  line: number;
}

export interface InvalidLine {
  line: number;
  content: string;
}

export interface ParsedLog {
  entries: LogEntry[];
  invalidLines: InvalidLine[];
}

const LINE_RE = /^(-?\d+)\s+(-?\d+)\s+(.+)$/;

export function parseCodexionLines(lines: string[]): ParsedLog {
  const entries: LogEntry[] = [];
  const invalidLines: InvalidLine[] = [];

  lines.forEach((raw, index) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const match = LINE_RE.exec(trimmed);
    if (!match) {
      invalidLines.push({ line: index + 1, content: trimmed });
      return;
    }
    entries.push({
      timestamp: parseInt(match[1], 10),
      coderId: parseInt(match[2], 10),
      action: match[3].trim().replace(/\s+/g, " "),
      line: index + 1,
    });
  });

  return { entries, invalidLines };
}

export function parseCodexionLog(raw: string): LogEntry[] {
  if (!raw) return [];
  return parseCodexionLines(raw.split("\n")).entries;
}

export function getCoderIds(entries: LogEntry[], command?: string): [number[], number[]] {
  const codersNum = parseCommand(command ?? "").numCoders;

  const sortedIds = Array.from(new Set(entries.map((e) => e.coderId))).sort((a, b) => a - b);

  if (codersNum !== undefined && codersNum > 0) {
    if (sortedIds.length >= codersNum) {
      return [sortedIds.slice(0, codersNum), []];
    }

    const filledIds = [...sortedIds];
    const newIds: number[] = [];
    const knownIds = new Set(filledIds);
    let candidateId = 1;

    while (filledIds.length < codersNum) {
      if (!knownIds.has(candidateId)) {
        filledIds.push(candidateId);
        newIds.push(candidateId);
        knownIds.add(candidateId);
      }
      candidateId++;
    }

    return [filledIds.sort((a, b) => a - b), newIds];
  }
  return [sortedIds, []];
}

export function getTimeRange(entries: LogEntry[]): [number, number] {
  if (entries.length === 0) return [0, 0];
  let min = Infinity;
  let max = -Infinity;
  for (const e of entries) {
    if (e.timestamp < min) min = e.timestamp;
    if (e.timestamp > max) max = e.timestamp;
  }
  return [min, max];
}
