export interface LogEntry {
  timestamp: number;
  coderId: number;
  action: string;
}

export function parseCodexionLog(raw: string): LogEntry[] {
  if (!raw) return [];

  const lines = raw.trim().split("\n");
  const entries: LogEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;

    const timestamp = parseInt(parts[0], 10);
    const coderId = parseInt(parts[1], 10);
    const action = parts.slice(2).join(" ");

    if (isNaN(timestamp) || isNaN(coderId)) continue;

    entries.push({ timestamp, coderId, action });
  }

  return entries;
}

export function getCoderIds(entries: LogEntry[], command?: string): [number[], number[]] {
  const commandParts = (command ?? "").split(" ").filter((p) => p.length > 0);

  const codersNum = commandParts.length > 1 ? parseInt(commandParts[1], 10) : undefined;

  const ids = new Set(entries.map((e) => e.coderId));
  const sortedIds = Array.from(ids).sort((a, b) => a - b);

  if (codersNum !== undefined && !isNaN(codersNum)) {
    if (sortedIds.length >= codersNum) {
      return [sortedIds.slice(0, codersNum), []];
    }

    const filledIds = [...sortedIds];
    const newIds = [];
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
  const times = entries.map((e) => e.timestamp);
  return [Math.min(...times), Math.max(...times)];
}
