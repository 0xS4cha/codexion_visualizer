import { useMemo, useState, useRef } from "react";
import {
  prepareCodexionSimulation,
  getStatusAtTime,
  getDongleStatusAtTime,
  ACTION_COLORS
} from "@/lib/codexionSimulation";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";
import html2canvas from "html2canvas";
import { useAppSelector, useAppDispatch } from '@/redux/hook/index';

export default function CodexionTable({ }) {
  const [currentTime, setCurrentTime] = useState(0);
  const padding = useAppSelector((state) => state.settings.instantActionPadding);
  const dongleCooldown = useAppSelector((state) => state.settings.dongleCooldown);
  const rawLog = useAppSelector((state) => state.user_input.output);
  const command = useAppSelector((state) => state.user_input.command);
  const { coderIds, dongleSegments, minTime, maxTime, segments, visualToReal } = useMemo(() => {
    const commandParts = command.split(' ').filter(p => p.length > 0);
    const timeToRefactor = commandParts.length > 5 ? parseInt(commandParts[5], 10) : undefined;
    const cmdDongleCooldown = commandParts.length > 7 ? parseInt(commandParts[7], 10) : undefined;
    const timeToBurnout = commandParts.length > 2 ? parseInt(commandParts[2], 10) : 0;

    return prepareCodexionSimulation(
      rawLog,
      padding,
      timeToRefactor,
      cmdDongleCooldown !== undefined ? cmdDongleCooldown : dongleCooldown,
      timeToBurnout
    );
  }, [rawLog, padding, command, dongleCooldown]);

  const timeToBurnoutParam = useMemo(() => {
    const parts = command.split(' ').filter(p => p.length > 0);
    return parts.length > 2 ? parseInt(parts[2], 10) : 0;
  }, [command]);
  const tableRef = useRef<HTMLDivElement>(null);
  const radius = 200;
  const dongleRadius = 140;
  const center = 250;

  const handleDownload = async () => {
    if (tableRef.current === null) return;

    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#121212',
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png');

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

  const realTime = visualToReal(currentTime);

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
            {realTime}ms
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

          {/* Render Coders */}
          {coderIds.map((id, index) => {
            const angle = (index / coderIds.length) * 2 * Math.PI;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            const coderSegments = segments.get(id) || [];
            const status = getStatusAtTime(coderSegments, currentTime);

            const lastCompile = [...coderSegments]
              .filter(s => s.startTime <= currentTime && s.action === "is compiling")
              .sort((a, b) => b.startTime - a.startTime)[0];

            let healthPct = 100;
            if (lastCompile && timeToBurnoutParam > 0) {
              const elapsedSinceCompile = realTime - lastCompile.realStart;
              healthPct = Math.max(0, 100 - (elapsedSinceCompile / timeToBurnoutParam) * 100);
            }

            return (
              <div
                key={`coder-${id}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: x - 40,
                  top: y - 40,
                }}
              >
                <div className="relative group">
                  <svg className="absolute -inset-2 w-20 h-20 -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/5"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={226.2}
                      strokeDashoffset={226.2 * (1 - healthPct / 100)}
                      className={`transition-all duration-300 ${healthPct < 20 ? 'text-red-500' : healthPct < 50 ? 'text-amber-500' : 'text-emerald-500/50'
                        }`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    className="relative w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border border-white/20 transition-colors duration-200 z-10"
                    style={{
                      backgroundColor:
                        ACTION_COLORS[status] ??
                        ACTION_COLORS["unknow action"],
                    }}
                  >
                    {id}
                  </div>
                </div>
                <span className="mt-2 text-[10px] text-white/70 text-center w-24">
                  {status}
                </span>
              </div>
            );
          })}

          {/* Render Dongles */}
          {Array.from({ length: coderIds.length }).map((_, index) => {
            const id = index + 1;
            const angle = ((id - 0.5) / coderIds.length) * 2 * Math.PI;
            const x = center + dongleRadius * Math.cos(angle);
            const y = center + dongleRadius * Math.sin(angle);

            const dSeg = getDongleStatusAtTime(
              dongleSegments.get(id),
              currentTime,
              realTime
            );

            const color = dSeg
              ? (dSeg.status === 'taken' ? ACTION_COLORS['has taken a dongle'] : ACTION_COLORS['cooldown'])
              : 'rgba(255, 255, 255, 0.1)';

            return (
              <div
                key={`dongle-${id}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: x - 15,
                  top: y - 15,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-bold shadow-md border border-white/10 transition-colors duration-200"
                  style={{
                    backgroundColor: color,
                    transform: `rotate(${angle + Math.PI / 2}rad)`
                  }}
                >
                  <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="2" width="12" height="20" rx="2" ry="2"></rect>
                    <path d="M9 22v-4"></path>
                    <path d="M15 22v-4"></path>
                    <path d="M10 2v2"></path>
                    <path d="M14 2v2"></path>
                  </svg>
                </div>
                {dSeg?.ownerId && (
                  <span className="absolute -bottom-4 text-[8px] text-white/50 font-mono">
                    C{dSeg.ownerId}
                  </span>
                )}
                {dSeg?.status === 'cooldown' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
