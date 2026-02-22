import { useMemo, useState, useRef } from "react";
import { motion } from "motion/react";
import {
    prepareCodexionSimulation,
  } from "@/lib/codexionSimulation";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";
import TiltedCard from "./utils/Components/TiltedCard/TiltedCard";
import dev_logo from "@/assets/dev.svg"
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText"

interface CodexionStatsProps {
  rawLog: string;
}

export default function CodexionStats({ rawLog }: CodexionStatsProps) {
  const { entries, coderIds, minTime, maxTime, segments, visualToReal, coderStats } = useMemo(() => prepareCodexionSimulation(rawLog), [rawLog]);


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
      <div className="pt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">
        
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