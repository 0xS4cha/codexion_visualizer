import { useMemo, useState, useRef } from "react";
import { motion } from "motion/react";
import {
  prepareCodexionSimulation,
  getActionColor,
  ACTION_COLORS
} from "@/lib/codexionSimulation";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";
import html2canvas from "html2canvas";
import { useAppSelector, useAppDispatch } from '@/redux/hook/index';

export default function CodexionTimeline({}) {
  const padding = useAppSelector((state) => state.settings.instantActionPadding);
  const rawLog =  useAppSelector((state) => state.user_input.output);
  const command = useAppSelector((state) => state.user_input.command);
  const [zoom, setZoom] = useState<number>(1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { entries, coderIds, minTime, maxTime, segments, visualToReal } = useMemo(() => {
    const commandParts = command.split(' ');
    const timeToRefactor = commandParts.length > 5 ? parseInt(commandParts[5], 10) : undefined;
    return prepareCodexionSimulation(rawLog, padding, timeToRefactor);
  }, [rawLog, padding, command]);

  const handleDownload = async () => {
    if (timelineRef.current === null) return;

    try {
      const canvas = await html2canvas(timelineRef.current, {
        backgroundColor: '#121212',
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = 'codexion-stats.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error with the screen', err);
    }
  };

  if (entries.length === 0) {
    return (
      <GlassSurface
        width="100%"
        height={56}
        borderRadius={16}
        className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/40"
      >
        Paste the Codexion logs above to view them.
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
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">Zoom</span>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-white/10 accent-white/70 hover:bg-white/20"
            style={{ outline: 'none', WebkitAppearance: 'none' }}
          />
          <span className="min-w-[3rem] text-right text-sm font-medium text-white/70">
            {zoom.toFixed(1)}×
          </span>
        </div>
        <div className="text-xs font-medium text-white/60">
          Time (ms)
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/5 bg-black/10 relative">
        
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }} className="flex flex-col py-2">
          <div ref={timelineRef} className="relative flex flex-col gap-2">
            {coderIds.map((coderId) => (
              <div key={coderId} className="flex items-center h-10 group">
                
                <div className="sticky left-0 z-20 w-24 shrink-0 flex items-center justify-end px-3 font-mono text-sm text-white/80 bg-[#121212]/90 backdrop-blur-md h-full border-r border-white/10 shadow-[4px_0_15px_rgba(0,0,0,0.5)] transition-colors group-hover:bg-[#1a1a1a]/90">
                  Coder {coderId}
                </div>


                <div className="flex-1 relative h-8 mx-2 bg-white/5 rounded-md overflow-hidden">
                  {(segments.get(coderId) ?? []).map((seg, i) => {
                    const timeSpan = maxTime - minTime || 1;
                    const trueLeft = ((seg.startTime - minTime) / timeSpan) * 100;
                    const trueWidth = ((seg.endTime - seg.startTime) / timeSpan) * 100;
                    const isWideEnough = (trueWidth * zoom) > 3;

                    return (
                      <motion.div
                        key={`${coderId}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="absolute top-0 bottom-0 rounded-md overflow-hidden border-r border-black/20"
                        style={{
                          left: `${trueLeft}%`,
                          width: `${trueWidth}%`,
                          backgroundColor: getActionColor(seg.action),
                        }}
                        title={`Coder ${coderId} ${seg.action}\nStart: ${seg.realStart}\nEnd: ${seg.realEnd}`}
                      >
                        {isWideEnough && (
                          <span className="absolute inset-0 flex items-center justify-center truncate px-2 text-[11px] font-medium text-white/90 drop-shadow-md">
                            {seg.action}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center mt-3 h-6">
          <div className="sticky left-0 z-20 w-24 shrink-0 flex items-center justify-end px-3 font-mono text-sm text-white/80 bg-[#121212]/90 backdrop-blur-md h-full border-r border-white/10 shadow-[4px_0_15px_rgba(0,0,0,0.5)] transition-colors group-hover:bg-[#1a1a1a]/90">Time</div>
            <div className="flex-1 relative mx-2">
              {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                const t = Math.round(minTime + (maxTime - minTime) * p);
                return (
                  <div
                    key={p}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${p * 100}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="h-1 w-[1px] bg-white/30 mb-1" />
                    <span className="font-mono text-[10px] text-white/40">
                      {visualToReal(t)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4">
        {Object.entries(ACTION_COLORS).map(([action, color]) => (
          <div key={action} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-white/70">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}