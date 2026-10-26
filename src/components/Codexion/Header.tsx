import { Link, NavLink } from "react-router-dom";
import { Earth, FlaskConical } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import logo42 from "@/assets/42_Logo.svg";

const NAV_ITEMS = [
  { to: "/hub", label: "Edge Case Hub", short: "Hub", icon: FlaskConical },
  { to: "/world", label: "World", short: "World", icon: Earth },
];

export default function Header() {
  return (
    <TooltipProvider>
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-6 h-16">
          <Link to="/" className="flex items-center gap-4 group min-w-0">
            <img
              src={logo42}
              alt="42 Logo"
              className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-105 opacity-80"
            />
            <div className="h-6 w-px bg-zinc-800" />
            <span className="text-lg font-semibold tracking-tight text-zinc-100 truncate">
              CODEXION<span className="hidden sm:inline text-zinc-500 font-mono "> VISUALIZER</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Main">
            {NAV_ITEMS.map(({ to, label, short, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
    </TooltipProvider>
  );
}
