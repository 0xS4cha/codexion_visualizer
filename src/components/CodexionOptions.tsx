import { useAppSelector, useAppDispatch } from '@/redux/hook/index';
import { setInstantAction } from "@/redux/slice/settingsSlice";
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText"; // Utilisé pour le titre

export default function CodexionOptions() {
  const padding = useAppSelector((state) => state.settings.instantActionPadding);
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
          <ShinyText text="Simulation Settings" disabled={false} speed={3} className="" />
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
              Action Padding
            </span>
            <span className="min-w-[3rem] text-right text-sm font-medium text-white/70">
              {padding}
            </span>
          </div>
          <div className="flex items-center mt-1">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={padding}
              onChange={(e) => dispatch(setInstantAction(Number(e.target.value)))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white/70 hover:bg-white/20 transition-all"
              style={{ outline: 'none', WebkitAppearance: 'none' }}
            />
          </div>

          <p className="text-[10px] text-white/30 leading-relaxed mt-1">
            Adjusts the visual width of instant actions on the timeline.
          </p>
        </div>
                
        <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
              More soon
            </span>
            </div>
        </div>
      </div>
    </div>
  );
}