import { getActionColor, findSegmentIndex } from "@/core/codexionSimulation";
import type { CodexionSimulationData } from "@/core/simulationClient";
import type { SimulationIssue } from "@/core/validateCodexionLog";

export const LABEL_W = 92;
export const AXIS_H = 26;
export const ROW_H = 30;
export const ROW_GAP = 6;
export const RIGHT_PAD = 10;
export const BOTTOM_PAD = 8;

export interface TimelineView {
  start: number;
  end: number;
}

export interface RenderOptions {
  width: number;
  height: number;
  scrollTop: number;
  view: TimelineView;
  cursorVisual: number | null;
  cursorReal: number | null;
  hoverRow: number | null;
  issuesByCoder: Map<number, SimulationIssue[]>;
  deadlinesByCoder: Map<number, number[]>;
}

export function totalHeight(rows: number): number {
  return AXIS_H + rows * (ROW_H + ROW_GAP) + BOTTOM_PAD;
}

export function rowTop(index: number, scrollTop: number): number {
  return AXIS_H + index * (ROW_H + ROW_GAP) + ROW_GAP / 2 - scrollTop;
}

export function rowAt(y: number, scrollTop: number, rows: number): number | null {
  if (y < AXIS_H) return null;
  const idx = Math.floor((y - AXIS_H + scrollTop) / (ROW_H + ROW_GAP));
  return idx >= 0 && idx < rows ? idx : null;
}

export function toX(v: number, view: TimelineView, width: number): number {
  const span = view.end - view.start || 1;
  return LABEL_W + ((v - view.start) / span) * (width - LABEL_W - RIGHT_PAD);
}

export function fromX(x: number, view: TimelineView, width: number): number {
  const span = view.end - view.start || 1;
  return view.start + ((x - LABEL_W) / (width - LABEL_W - RIGHT_PAD)) * span;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function renderTimeline(ctx: CanvasRenderingContext2D, data: CodexionSimulationData, opts: RenderOptions) {
  const { width, height, scrollTop, view } = opts;
  const { coderIds, segments, visualToReal, realToVisual } = data;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#101013";
  ctx.fillRect(0, 0, width, height);

  const plotLeft = LABEL_W;
  const plotRight = width - RIGHT_PAD;

  const firstRow = Math.max(0, Math.floor((scrollTop - ROW_GAP) / (ROW_H + ROW_GAP)));
  const lastRow = Math.min(coderIds.length - 1, Math.ceil((scrollTop + height) / (ROW_H + ROW_GAP)));

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, AXIS_H, width, height - AXIS_H);
  ctx.clip();

  ctx.font = "500 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "middle";

  for (let r = firstRow; r <= lastRow; r++) {
    const coderId = coderIds[r];
    const y = rowTop(r, scrollTop);

    ctx.fillStyle = opts.hoverRow === r ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)";
    roundRect(ctx, plotLeft, y, plotRight - plotLeft, ROW_H, 5);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(plotLeft, y, plotRight - plotLeft, ROW_H);
    ctx.clip();

    const segs = segments.get(coderId) ?? [];
    let i = Math.max(0, findSegmentIndex(segs, view.start));
    let lastPx = -Infinity;
    for (; i < segs.length; i++) {
      const seg = segs[i];
      if (seg.startTime > view.end) break;
      if (seg.endTime < view.start) continue;
      const x0 = toX(seg.startTime, view, width);
      const x1 = toX(seg.endTime, view, width);
      let w = x1 - x0;
      if (w < 1) {
        if (Math.floor(x0) <= lastPx) continue;
        w = 1;
      }
      lastPx = Math.floor(x0 + w);
      ctx.fillStyle = getActionColor(seg.action);
      if (w > 4) {
        roundRect(ctx, x0, y, w - 1, ROW_H, 4);
        ctx.fill();
      } else {
        ctx.fillRect(x0, y, w, ROW_H);
      }
      if (w > 74) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        const label = seg.action;
        const textX = Math.max(x0, plotLeft) + 6;
        const maxW = Math.min(x1, plotRight) - textX - 4;
        if (maxW > 30) {
          let text = label;
          while (text.length > 3 && ctx.measureText(text).width > maxW) text = text.slice(0, -2);
          if (text !== label) text = text.slice(0, -1) + "…";
          ctx.fillText(text, textX, y + ROW_H / 2);
        }
      }
    }

    const deadlines = opts.deadlinesByCoder.get(coderId);
    if (deadlines) {
      ctx.fillStyle = "rgba(248,113,113,0.85)";
      for (const d of deadlines) {
        const vx = realToVisual(d);
        if (vx < view.start || vx > view.end) continue;
        const x = toX(vx, view, width);
        ctx.fillRect(x - 1, y - 2, 2, ROW_H + 4);
      }
    }

    const issues = opts.issuesByCoder.get(coderId);
    if (issues) {
      for (const issue of issues) {
        if (issue.timestamp === undefined) continue;
        const vx = realToVisual(issue.timestamp);
        if (vx < view.start || vx > view.end) continue;
        const x = toX(vx, view, width);
        ctx.fillStyle = issue.type === "error" ? "#ef4444" : "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 1);
        ctx.lineTo(x + 5, y - 1);
        ctx.lineTo(x, y + 7);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();

    ctx.fillStyle = "#121215";
    ctx.fillRect(0, y - ROW_GAP / 2, LABEL_W - 6, ROW_H + ROW_GAP);
    ctx.fillStyle = opts.hoverRow === r ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.72)";
    ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`Coder ${coderId}`, LABEL_W - 14, y + ROW_H / 2);
    ctx.textAlign = "left";
    ctx.font = "500 11px ui-sans-serif, system-ui, sans-serif";
  }

  ctx.restore();

  ctx.fillStyle = "#0d0d10";
  ctx.fillRect(0, 0, width, AXIS_H);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(0, AXIS_H - 0.5);
  ctx.lineTo(width, AXIS_H - 0.5);
  ctx.stroke();

  const tickCount = Math.max(2, Math.floor((plotRight - plotLeft) / 110));
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  for (let t = 0; t <= tickCount; t++) {
    const v = view.start + ((view.end - view.start) * t) / tickCount;
    const x = toX(v, view, width);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(Math.round(x), AXIS_H - 6, 1, 6);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    const label = `${Math.round(visualToReal(v))}`;
    const clampedX = Math.min(Math.max(x, plotLeft + 14), plotRight - 14);
    ctx.fillText(label, clampedX, AXIS_H / 2 - 1);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("ms", LABEL_W - 14, AXIS_H / 2 - 1);
  ctx.textAlign = "left";

  if (opts.cursorVisual !== null && opts.cursorVisual >= view.start && opts.cursorVisual <= view.end) {
    const x = Math.round(toX(opts.cursorVisual, view, width)) + 0.5;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, AXIS_H - 4);
    ctx.lineTo(x, height);
    ctx.stroke();
    if (opts.cursorReal !== null) {
      const label = `${Math.round(opts.cursorReal)} ms`;
      ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      const w = ctx.measureText(label).width + 10;
      const lx = Math.min(Math.max(x - w / 2, plotLeft), plotRight - w);
      ctx.fillStyle = "#f5f5f5";
      roundRect(ctx, lx, 3, w, AXIS_H - 9, 4);
      ctx.fill();
      ctx.fillStyle = "#0a0a0d";
      ctx.textAlign = "center";
      ctx.fillText(label, lx + w / 2, AXIS_H / 2 - 1);
      ctx.textAlign = "left";
    }
  }
}
