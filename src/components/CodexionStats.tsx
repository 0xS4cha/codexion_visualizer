import { useMemo, useState, useRef } from "react";
import { motion } from "motion/react";
import {
  prepareCodexionSimulation,
} from "@/lib/codexionSimulation";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";
import TiltedCard from "./utils/Components/TiltedCard/TiltedCard";
import dev_logo from "@/assets/dev.svg"
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText"
import { useAppSelector, useAppDispatch } from '@/redux/hook/index';



export default function CodexionStats({ }) {
  const padding = useAppSelector((state) => state.settings.instantActionPadding);
  const rawLog = useAppSelector((state) => state.user_input.output);
  const command = useAppSelector((state) => state.user_input.command);
  const { entries, coderIds, minTime, maxTime, segments, visualToReal, coderStats } = useMemo(() => prepareCodexionSimulation(rawLog, padding), [rawLog, padding]);

  const scheduler = useMemo(() => {
    const commandParts = command.split(' ').filter(p => p.length > 0);
    return commandParts.length > 8 ? commandParts[8] : undefined;
  }, [command]);


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
    <div className="rounded-xl border border-white/10 bg-black/20 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
          <ShinyText text="Coders Statistics" disabled={false} speed={3} className="" />
        </h2>
        {scheduler && (
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-white/50">
            <span className="text-white/30">Scheduler:</span>
            <span className="font-bold text-white/70">{scheduler}</span>
          </div>
        )}
      </div>
      <div className="py-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">

        {coderIds.map((coderId) => (
          <div key={coderId} className="flex justify-center items-center">
            <TiltedCard
              imageSrc={dev_logo}
              altText={`Coder #${coderId}`}
              captionText={`Compiling: ${coderStats[coderId]?.["is compiling"] || 0},\n
              Taken dongle: ${coderStats[coderId]?.["has taken a dongle"] || 0},
              Debugging: ${coderStats[coderId]?.["is debugging"] || 0},
              Refactoring: ${coderStats[coderId]?.["is refactoring"] || 0},
              Burn out: ${coderStats[coderId]?.["burned out"] || 0},
              Unkown: ${coderStats[coderId]?.["unknow action"] || 0}`}
              containerHeight="120px"
              containerWidth="120px"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={15}
              scaleOnHover={1.08}
              showMobileWarning={false}
              showTooltip
              displayOverlayContent
              overlayContent={
                <div className="absolute inset-0 z-[50] will-change-transform [transform:translateZ(20px)] flex flex-col justify-end p-2">
                  <div className="w-full text-center shadow-lg">
                    <ShinyText
                      text={`Coder #${coderId}`}
                      className="font-bold text-[10px] sm:text-xs tracking-wide mx-auto"
                      color="#d1d5db"
                      shineColor="#ffffff"
                      speed={3}
                      spread={80}
                    />
                  </div>
                </div>
              }
            />
          </div>
        ))}

      </div>
    </div>
  );
}