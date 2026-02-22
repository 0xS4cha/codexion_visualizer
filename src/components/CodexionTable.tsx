import { useMemo, useState, useRef } from "react";
import {
    prepareCodexionSimulation,
    getStatusAtTime,
    ACTION_COLORS
  } from "@/lib/codexionSimulation";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";
import { toPng } from "html-to-image";


interface CodexionTableProps {
  rawLog: string;
}

export default function CodexionTable({ rawLog }: CodexionTableProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const { coderIds, minTime, maxTime, segments, visualToReal } = useMemo(() => prepareCodexionSimulation(rawLog), [rawLog]);
  const tableRef = useRef<HTMLDivElement>(null);
  const radius = 200;
  const center = 250;
  const handleDownload = async () => {
    if (tableRef.current === null) return;

    try {
      const dataUrl = await toPng(tableRef.current, {
        backgroundColor: '#121212',
        quality: 1,
        width: tableRef.current.scrollWidth, 
        height: tableRef.current.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = 'codexion-table.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error with the screen', err);
    }
  };

  if (coderIds.length === 0) {
    return (
        <GlassSurface
            width="100%"
            height={56}
            borderRadius={16}
            className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/40"
        >
        Paste logs to view circular table.
        </GlassSurface>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/20 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PNG
          </button>
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">Time</span>
          <input
            type="range"
            min={minTime}
            max={maxTime}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-white/10 accent-white/70 hover:bg-white/20"
            style={{ outline: 'none', WebkitAppearance: 'none' }}
          />
          <span className="min-w-[3rem] text-right text-sm font-medium text-white/70">
            {visualToReal(currentTime)}ms
          </span>
        </div>
        <div className="text-xs font-medium text-white/60">
          Time (ms)
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/5 bg-black/10 flex justify-center">
        <div
            ref={tableRef}
            className="relative"
            style={{ width: 500, height: 500 }}
        >
            <div
            className="absolute rounded-full border border-white/10 bg-black/40 backdrop-blur-md"
            style={{
                width: 350,
                height: 350,
                left: center - 175,
                top: center - 175,
            }}
            />

            {coderIds.map((id, index) => {
            const angle = (index / coderIds.length) * 2 * Math.PI;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            const status = getStatusAtTime(
                segments.get(id),
                currentTime
            );

            return (
                <div
                key={id}
                className="absolute flex flex-col items-center"
                style={{
                    left: x - 40,
                    top: y - 40,
                }}
                >
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border border-white/20"
                    style={{
                    backgroundColor:
                        ACTION_COLORS[status] ??
                        ACTION_COLORS["unknow action"],
                    }}
                >
                    {id}
                </div>
                <span className="mt-2 text-[10px] text-white/70 text-center w-24">
                    {status}
                </span>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
}