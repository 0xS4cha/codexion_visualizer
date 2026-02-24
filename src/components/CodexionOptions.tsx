import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/redux/hook/index';
import { setInstantAction, setDongleCooldown } from "@/redux/slice/settingsSlice";
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText";

export default function CodexionOptions() {
  const padding = useAppSelector((state) => state.settings.instantActionPadding);
  const dongleCooldown = useAppSelector((state) => state.settings.dongleCooldown);
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-4 sm:p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between border-b border-white/10 pb-4 outline-none"
      >
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
          <ShinyText text="Simulation Settings" disabled={false} speed={3} className="" />
        </h2>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-white/50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">

              <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                    Action Padding
                  </span>
                  <span className="min-w-[3rem] text-right text-sm font-medium text-white/70">
                    {padding}
                  </span>
                </div>
                <div className="flex mt-1 items-center">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={padding}
                    onChange={(e) => dispatch(setInstantAction(Number(e.target.value)))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 transition-all hover:bg-white/20 accent-white/70"
                    style={{ outline: 'none', WebkitAppearance: 'none' }}
                  />
                </div>

                <p className="mt-1 text-[10px] leading-relaxed text-white/30">
                  Adjusts the visual width of instant actions on the timeline.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                    Dongle Cooldown
                  </span>
                  <span className="min-w-[3rem] text-right text-sm font-medium text-white/70">
                    {dongleCooldown}ms
                  </span>
                </div>
                <div className="flex mt-1 items-center">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={dongleCooldown}
                    onChange={(e) => dispatch(setDongleCooldown(Number(e.target.value)))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 transition-all hover:bg-white/20 accent-white/70"
                    style={{ outline: 'none', WebkitAppearance: 'none' }}
                  />
                </div>

                <p className="mt-1 text-[10px] leading-relaxed text-white/30">
                  Visualizes the period where dongles are unavailable after release.
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}