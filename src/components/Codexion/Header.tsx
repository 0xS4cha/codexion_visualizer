import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GlassSurface from "@/components/ui/Components/GlassSurface/GlassSurface";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";
import { TooltipProvider } from "@/components/ui/tooltip";
import logo42 from "@/assets/42_Logo.svg";

export default function Header() {
  return (
    <TooltipProvider>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6">
        <GlassSurface
          width="100%"
          height={64}
          borderRadius={16}
          className="mx-auto max-w-7xl flex items-center justify-between px-6 border border-white/5 bg-[#121215]/80 backdrop-blur-md"
        >
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo42}
              alt="42 Logo"
              className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-white/40">|</span>
            <ShinyText
              text="Codexion Visualizer"
              className="text-lg sm:text-xl font-bold tracking-tight"
              color="#a0a0a0"
              shineColor="#e8e8e8"
              speed={3}
              spread={90}
            />
          </Link>
        </GlassSurface>
      </header>
    </TooltipProvider>
  );
}
