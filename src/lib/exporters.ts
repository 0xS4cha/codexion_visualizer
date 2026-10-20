import type { SimulationResult } from "@/core/codexionSimulation";

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function segmentsToCsv(data: Pick<SimulationResult, "segments" | "coderIds">): string {
  const rows: string[] = ["coder,action,start_ms,end_ms,duration_ms,line"];
  for (const coderId of data.coderIds) {
    for (const seg of data.segments.get(coderId) ?? []) {
      rows.push(
        [coderId, seg.action, seg.realStart, seg.realEnd, seg.realEnd - seg.realStart, seg.line].map(csvCell).join(",")
      );
    }
  }
  return rows.join("\n");
}

export function issuesToCsv(data: Pick<SimulationResult, "issues">): string {
  const rows: string[] = ["severity,rule,timestamp_ms,coder,line,message"];
  for (const i of data.issues) {
    rows.push([i.type, i.rule, i.timestamp, i.coderId, i.line, i.message].map(csvCell).join(","));
  }
  return rows.join("\n");
}

export function simulationToJson(data: SimulationResult, command: string): string {
  return JSON.stringify(
    {
      command,
      params: data.params,
      metrics: data.metrics,
      issues: data.issues,
      entries: data.entries,
      segments: Object.fromEntries(
        data.coderIds.map((id) => [
          id,
          (data.segments.get(id) ?? []).map((s) => ({ action: s.action, start: s.realStart, end: s.realEnd, line: s.line })),
        ])
      ),
    },
    null,
    2
  );
}
