import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import { ACTION_COLORS, findSegmentAt } from "@/core/codexionSimulation";
import type { Segment } from "@/core/codexionSimulation";
import type { CodexionSimulationData } from "@/core/simulationClient";
import type { SimulationIssue } from "@/core/validateCodexionLog";
import { useCodexionSimulation } from "@/hooks/useCodexionSimulation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCursor, setPlaying } from "@/store/features/viewSlice";
import PlaybackControls from "@/components/Codexion/PlaybackControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  renderTimeline,
  totalHeight,
  rowAt,
  rowTop,
  fromX,
  LABEL_W,
  RIGHT_PAD,
  ROW_H,
  ROW_GAP,
  AXIS_H,
} from "@/components/Codexion/timeline/timelineRenderer";
import type { TimelineView } from "@/components/Codexion/timeline/timelineRenderer";
import { downloadBlob, segmentsToCsv, simulationToJson } from "@/lib/exporters";

const MAX_VIEWPORT_H = 520;
const MIN_SPAN = 2;

interface HoverInfo {
  x: number;
  y: number;
  coderId: number;
  segment?: Segment;
  issues: SimulationIssue[];
  real: number;
}

interface CodexionTimelineProps {
  data?: CodexionSimulationData | null;
  title?: string;
  exportName?: string;
  showPlayback?: boolean;
}

export default function CodexionTimeline({ data: dataProp, title, exportName = "codexion", showPlayback = true }: CodexionTimelineProps) {
  const { data: contextData } = useCodexionSimulation();
  const data = dataProp === undefined ? contextData : dataProp;
  const dispatch = useAppDispatch();
  const cursor = useAppSelector((s) => s.view.cursor);
  const playing = useAppSelector((s) => s.view.playing);
  const focusSeq = useAppSelector((s) => s.view.focusSeq);
  const focusCoderId = useAppSelector((s) => s.view.focusCoderId);
  const command = useAppSelector((s) => s.user_input.command);

  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);
  const [view, setView] = useState<TimelineView>({ start: 0, end: 1 });
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const followRef = useRef(true);
  const dragRef = useRef<{ x: number; start: number; end: number; moved: boolean } | null>(null);

  const minTime = data?.minTime ?? 0;
  const maxTime = Math.max(data?.maxTime ?? 1, minTime + 1);
  const rows = data?.coderIds.length ?? 0;
  const fullHeight = totalHeight(rows);
  const viewportH = Math.min(fullHeight, MAX_VIEWPORT_H);

  useEffect(() => {
    if (!data) return;
    setView((prev) => {
      if (followRef.current || prev.end > maxTime || prev.start < minTime) return { start: minTime, end: maxTime };
      return prev;
    });
  }, [data, minTime, maxTime]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [data]);

  const issuesByCoder = useMemo(() => {
    const map = new Map<number, SimulationIssue[]>();
    for (const issue of data?.issues ?? []) {
      if (issue.coderId === undefined || issue.timestamp === undefined) continue;
      if (!map.has(issue.coderId)) map.set(issue.coderId, []);
      map.get(issue.coderId)!.push(issue);
    }
    return map;
  }, [data]);

  const deadlinesByCoder = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const c of data?.metrics.coders ?? []) map.set(c.coderId, c.deadlines);
    return map;
  }, [data]);

  const cursorVisual = data ? data.realToVisual(cursor) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(viewportH * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${viewportH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderTimeline(ctx, data, {
      width,
      height: viewportH,
      scrollTop,
      view,
      cursorVisual,
      cursorReal: cursor,
      hoverRow: hover ? data.coderIds.indexOf(hover.coderId) : null,
      issuesByCoder,
      deadlinesByCoder,
    });
  }, [data, width, viewportH, scrollTop, view, cursorVisual, cursor, hover, issuesByCoder, deadlinesByCoder]);

  useEffect(() => {
    if (!playing || cursorVisual === null) return;
    setView((prev) => {
      const span = prev.end - prev.start;
      if (cursorVisual < prev.start || cursorVisual > prev.end) {
        const start = Math.max(minTime, Math.min(cursorVisual - span * 0.1, maxTime - span));
        return { start, end: start + span };
      }
      return prev;
    });
  }, [playing, cursorVisual, minTime, maxTime]);

  const focusState = useRef({ data, cursor, focusCoderId, minTime, maxTime, viewportH });
  focusState.current = { data, cursor, focusCoderId, minTime, maxTime, viewportH };

  useEffect(() => {
    const f = focusState.current;
    if (focusSeq === 0 || !f.data) return;
    const v = f.data.realToVisual(f.cursor);
    setView((prev) => {
      const span = Math.min(prev.end - prev.start, Math.max(MIN_SPAN * 20, (f.maxTime - f.minTime) / 8));
      const start = Math.max(f.minTime, Math.min(v - span / 2, f.maxTime - span));
      followRef.current = false;
      return { start, end: start + span };
    });
    if (f.focusCoderId !== null && scrollRef.current) {
      const idx = f.data.coderIds.indexOf(f.focusCoderId);
      if (idx >= 0) {
        const target = AXIS_H + idx * (ROW_H + ROW_GAP) - f.viewportH / 2;
        scrollRef.current.scrollTop = Math.max(0, target);
      }
    }
  }, [focusSeq]);

  const zoomAround = useCallback((factor: number, anchor?: number) => {
    setView((prev) => {
      const span = prev.end - prev.start;
      const a = anchor ?? (prev.start + prev.end) / 2;
      const fullSpan = maxTime - minTime;
      const newSpan = Math.min(fullSpan, Math.max(MIN_SPAN, span * factor));
      const ratio = (a - prev.start) / (span || 1);
      let start = a - ratio * newSpan;
      start = Math.max(minTime, Math.min(start, maxTime - newSpan));
      followRef.current = newSpan >= fullSpan;
      return { start, end: start + newSpan };
    });
  }, [minTime, maxTime]);

  const pan = useCallback((deltaVisual: number) => {
    setView((prev) => {
      const span = prev.end - prev.start;
      const start = Math.max(minTime, Math.min(prev.start + deltaVisual, maxTime - span));
      followRef.current = false;
      return { start, end: start + span };
    });
  }, [minTime, maxTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAround(Math.exp(e.deltaY * 0.0025), fromX(x, view, width));
      } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        const delta = e.shiftKey ? e.deltaY || e.deltaX : e.deltaX;
        pan((delta / (width - LABEL_W - RIGHT_PAD)) * (view.end - view.start));
      }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoomAround, pan, view, width, data]);

  const localPoint = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x } = localPoint(e);
    dragRef.current = { x, start: view.start, end: view.end, moved: false };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!data) return;
    const { x, y } = localPoint(e);
    const drag = dragRef.current;
    if (drag) {
      const dx = x - drag.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      if (drag.moved) {
        const span = drag.end - drag.start;
        const delta = -(dx / (width - LABEL_W - RIGHT_PAD)) * span;
        const start = Math.max(minTime, Math.min(drag.start + delta, maxTime - span));
        followRef.current = false;
        setView({ start, end: start + span });
        setHover(null);
        return;
      }
    }
    const row = rowAt(y, scrollTop, rows);
    if (row === null || x < LABEL_W) {
      setHover(null);
      return;
    }
    const coderId = data.coderIds[row];
    const v = fromX(x, view, width);
    const segment = findSegmentAt(data.segments.get(coderId), v);
    const pxTolerance = ((view.end - view.start) / (width - LABEL_W)) * 6;
    const issues = (issuesByCoder.get(coderId) ?? []).filter(
      (i) => i.timestamp !== undefined && Math.abs(data.realToVisual(i.timestamp) - v) <= pxTolerance
    );
    setHover({ x, y: rowTop(row, scrollTop), coderId, segment, issues, real: data.visualToReal(v) });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!data || !drag || drag.moved) return;
    const { x } = localPoint(e);
    if (x < LABEL_W) return;
    dispatch(setPlaying(false));
    dispatch(setCursor(Math.max(0, data.visualToReal(fromX(x, view, width)))));
  };

  const exportPng = () => {
    if (!data) return;
    const h = totalHeight(rows);
    const scale = h * 2 > 30000 ? 1 : 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = Math.min(h * scale, 32000);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    renderTimeline(ctx, data, {
      width,
      height: canvas.height / scale,
      scrollTop: 0,
      view,
      cursorVisual: null,
      cursorReal: null,
      hoverRow: null,
      issuesByCoder,
      deadlinesByCoder,
    });
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${exportName}-timeline.png`, "image/png");
    });
  };

  if (!data || data.entries.length === 0) return <></>;

  const realStart = data.visualToReal(minTime);
  const realEnd = data.visualToReal(maxTime);
  const zoomLevel = (maxTime - minTime) / (view.end - view.start || 1);

  const hoverDeadline = hover
    ? (deadlinesByCoder.get(hover.coderId) ?? []).find((d) => d >= hover.real)
    : undefined;

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {title && <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-white/60">{title}</span>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/20 active:scale-95 cursor-pointer">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#121215] text-white/80">
              <DropdownMenuItem onClick={exportPng}>Timeline (PNG)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadBlob(segmentsToCsv(data), `${exportName}-segments.csv`, "text/csv")}>
                Segments (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadBlob(simulationToJson(data, command), `${exportName}-analysis.json`, "application/json")}>
                Full analysis (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
            <button className="rounded-md p-1.5 text-white/70 hover:bg-white/10 cursor-pointer" onClick={() => zoomAround(1 / 1.6, cursorVisual ?? undefined)} title="Zoom in" aria-label="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-md p-1.5 text-white/70 hover:bg-white/10 cursor-pointer" onClick={() => zoomAround(1.6, cursorVisual ?? undefined)} title="Zoom out" aria-label="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-md p-1.5 text-white/70 hover:bg-white/10 cursor-pointer" onClick={() => { followRef.current = true; setView({ start: minTime, end: maxTime }); }} title="Fit" aria-label="Fit to view">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[3rem] px-1 text-right font-mono text-[11px] text-white/60">{zoomLevel.toFixed(1)}×</span>
          </div>
        </div>
        {showPlayback && <PlaybackControls start={realStart} end={realEnd} entries={data.entries} />}
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-y-auto overflow-x-hidden rounded-lg border border-white/5"
        style={{ maxHeight: MAX_VIEWPORT_H }}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
      >
        <div style={{ height: fullHeight }} className="relative">
          <canvas
            ref={canvasRef}
            className="sticky top-0 block cursor-crosshair select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { dragRef.current = null; setHover(null); }}
          />
        </div>
        {hover && (
          <div
            className="pointer-events-none absolute z-30 rounded-md border border-white/10 bg-[#18181b]/95 px-2.5 py-1.5 text-xs text-white/85 shadow-xl"
            style={{
              left: Math.min(hover.x + 12, width - 230),
              top: Math.max(0, hover.y - 8) + scrollTop,
              transform: hover.y > viewportH / 2 ? "translateY(-100%)" : undefined,
              width: 220,
            }}
          >
            <div className="font-semibold">
              Coder {hover.coderId}
              {hover.segment ? ` — ${hover.segment.action}` : ""}
            </div>
            {hover.segment && (
              <div className="text-white/60">
                {hover.segment.realStart} → {hover.segment.realEnd} ms ({hover.segment.realEnd - hover.segment.realStart} ms) · line {hover.segment.line}
              </div>
            )}
            <div className="text-white/50">at {Math.round(hover.real)} ms</div>
            {hoverDeadline !== undefined && (
              <div className="text-red-300/80">next burnout deadline: {hoverDeadline} ms ({Math.round(hoverDeadline - hover.real)} ms left)</div>
            )}
            {hover.issues.slice(0, 3).map((i, idx) => (
              <div key={idx} className={i.type === "error" ? "mt-1 text-red-300" : "mt-1 text-amber-300"}>
                {i.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 text-[10px] text-white/30">
        Click to move the cursor · drag to pan · Ctrl/⌘ + wheel to zoom · Shift + wheel to scroll horizontally
      </div>

      <div className="mt-3 flex flex-wrap gap-4 border-t border-white/10 pt-3">
        {Object.entries(ACTION_COLORS).map(([action, color]) => (
          <div key={action} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-white/70">{action}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="h-3 w-0.5 bg-red-400" />
          <span className="text-xs text-white/70">burnout deadline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-red-500" />
          <span className="text-xs text-white/70">issue</span>
        </div>
      </div>
    </div>
  );
}

