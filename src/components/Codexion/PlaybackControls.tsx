import { Pause, Play, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { PLAYBACK_SPEEDS, setCursor, setPlaying, setSpeed } from "@/store/features/viewSlice";
import type { LogEntry } from "@/core/parseCodexionLog";

interface PlaybackControlsProps {
  start: number;
  end: number;
  entries: LogEntry[];
}

function sortedTimestamps(entries: LogEntry[]): number[] {
  return Array.from(new Set(entries.map((e) => e.timestamp))).sort((a, b) => a - b);
}

let cachedEntries: LogEntry[] | null = null;
let cachedTimes: number[] = [];

function timesFor(entries: LogEntry[]): number[] {
  if (cachedEntries !== entries) {
    cachedEntries = entries;
    cachedTimes = sortedTimestamps(entries);
  }
  return cachedTimes;
}

export default function PlaybackControls({ start, end, entries }: PlaybackControlsProps) {
  const dispatch = useAppDispatch();
  const playing = useAppSelector((s) => s.view.playing);
  const speed = useAppSelector((s) => s.view.speed);
  const cursor = useAppSelector((s) => s.view.cursor);

  const step = (direction: 1 | -1) => {
    const times = timesFor(entries);
    if (times.length === 0) return;
    let target: number | undefined;
    if (direction === 1) target = times.find((t) => t > cursor + 0.5);
    else for (let i = times.length - 1; i >= 0; i--) if (times[i] < cursor - 0.5) { target = times[i]; break; }
    if (target !== undefined) {
      dispatch(setPlaying(false));
      dispatch(setCursor(target));
    }
  };

  const buttonClass = "flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 active:scale-95 cursor-pointer";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={buttonClass} onClick={() => { dispatch(setPlaying(false)); dispatch(setCursor(start)); }} title="Back to start" aria-label="Back to start">
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={buttonClass} onClick={() => step(-1)} title="Previous event" aria-label="Previous event">
        <SkipBack className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black transition hover:bg-white/90 active:scale-95 cursor-pointer"
        onClick={() => {
          if (!playing && cursor >= end) dispatch(setCursor(start));
          dispatch(setPlaying(!playing));
        }}
        title={playing ? "Pause" : "Play"}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <button type="button" className={buttonClass} onClick={() => step(1)} title="Next event" aria-label="Next event">
        <SkipForward className="h-3.5 w-3.5" />
      </button>
      <select
        value={speed}
        onChange={(e) => dispatch(setSpeed(Number(e.target.value)))}
        className="h-8 rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-white/80 outline-none cursor-pointer"
        aria-label="Playback speed"
      >
        {PLAYBACK_SPEEDS.map((s) => (
          <option key={s} value={s} className="bg-[#121215]">
            {s}×
          </option>
        ))}
      </select>
      <input
        type="range"
        min={start}
        max={end}
        step={1}
        value={Math.min(Math.max(cursor, start), end)}
        onChange={(e) => { dispatch(setPlaying(false)); dispatch(setCursor(Number(e.target.value))); }}
        className="h-1.5 w-32 sm:w-44 cursor-pointer appearance-none rounded-full bg-white/10 accent-white/70 hover:bg-white/20"
        style={{ outline: 'none', WebkitAppearance: 'none' }}
        aria-label="Time cursor"
      />
      <span className="min-w-[4.5rem] text-right font-mono text-xs text-white/70">{Math.round(cursor)} ms</span>
    </div>
  );
}
