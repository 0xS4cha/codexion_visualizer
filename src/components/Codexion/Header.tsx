import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import logo42 from "@/assets/42_Logo.svg";

export default function Header() {
  return (
    <TooltipProvider>
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-4 group">
            <img
              src={logo42}
              alt="42 Logo"
              className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-105 opacity-80"
            />
            <div className="h-6 w-px bg-zinc-800" />
            <span className="text-lg font-semibold tracking-tight text-zinc-100">
              CODEXION<span className="text-zinc-500 font-mono "> VISUALIZER</span>
            </span>
          </Link>
        </div>
      </header>
    </TooltipProvider>
  );
}
