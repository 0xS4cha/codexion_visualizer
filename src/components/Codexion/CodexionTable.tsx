import { useRef } from "react";
import {
  getStatusAtTime,
  getDongleStatusAtTime,
  findSegmentIndex,
  ACTION_COLORS
} from "@/core/codexionSimulation";
import { ACTIONS } from "@/core/validateCodexionLog";
import { useCodexionSimulation } from "@/hooks/useCodexionSimulation";
import { useCodexionSimulationContext } from "@/context/CodexionSimulationContext";
import { useAppSelector } from "@/store/hooks";
import PlaybackControls from "@/components/Codexion/PlaybackControls";
import html2canvas from 'html2canvas-pro';

export default function CodexionTable() {
  const cursor = useAppSelector((s) => s.view.cursor);
  const { data } = useCodexionSimulation();
  const { timeToBurnout: timeToBurnoutParam } = useCodexionSimulationContext();
  const tableRef = useRef<HTMLDivElement>(null);
  const radius = 200;
  const dongleRadius = 140;
  const center = 250;
  const coderCount = data?.coderIds.length ?? 0;
  const bubble = coderCount > 40 ? 18 : coderCount > 16 ? 30 : 64;
  const dongleSize = coderCount > 40 ? 10 : coderCount > 16 ? 18 : 32;

  const handleDownload = async () => {
    if (tableRef.current === null) return;

    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#121212',
        scale: 1,
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

  if (!data) {
    return (<></>);
  }
  const { coderIds, dongleSegments, minTime, maxTime, segments, visualToReal, realToVisual } = data;
  if (coderIds && coderIds.length === 0) {
    return (<></>);
  }

  const realTime = cursor;
  const currentTime = realToVisual(cursor);

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        </div>
        <PlaybackControls start={visualToReal(minTime)} end={visualToReal(maxTime)} entries={data.entries} />
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/5 bg-black/10 flex justify-center" ref={tableRef}>
        <div
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

          {coderIds && coderIds.map((id, index) => {
            const angle = (index / coderIds.length) * 2 * Math.PI;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            const coderSegments = segments.get(id) || [];
            const status = getStatusAtTime(coderSegments, currentTime);

            let lastCompile = undefined;
            for (let si = findSegmentIndex(coderSegments, currentTime); si >= 0; si--) {
              if (coderSegments[si].action === ACTIONS.COMPILE) {
                lastCompile = coderSegments[si];
                break;
              }
            }

            let healthPct = 100;
            if (timeToBurnoutParam > 0) {
              const elapsedSinceCompile = realTime - (lastCompile ? lastCompile.realStart : 0);
              healthPct = Math.max(0, 100 - (elapsedSinceCompile / timeToBurnoutParam) * 100);
            }

            return (
              <div
                key={`coder-${id}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: x - 40,
                  top: y - 40,
                  transform: bubble < 64 ? `scale(${bubble / 64})` : undefined,
                }}
                title={`Coder ${id}: ${status}`}
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
                {bubble === 64 && (
                  <span className="mt-2 text-[10px] text-white/70 text-center w-24">
                    {status}
                  </span>
                )}
              </div>
            );
          })}

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
                  className="rounded-lg flex items-center justify-center text-[8px] font-bold shadow-md border border-white/10 transition-colors duration-200"
                  style={{
                    width: dongleSize,
                    height: dongleSize,
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
                {dSeg?.ownerId && dongleSize === 32 && (
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
