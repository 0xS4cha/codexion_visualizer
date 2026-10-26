import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FlaskConical, MessageSquare, Play, Plus, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch } from "@/store/hooks";
import { setCommand } from "@/store/features/inputSlice";
import { setInstantAction, setDongleCooldown } from "@/store/features/settingsSlice";
import type { HubPulse, TrendingEdgecase } from "@/types/stats";

export default function HubCTA({ hub }: { hub: HubPulse | null }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const trending = hub?.trending ?? [];

  const tryCase = (ec: TrendingEdgecase) => {
    dispatch(setCommand(ec.command));
    dispatch(setInstantAction(ec.instantActionPadding));
    dispatch(setDongleCooldown(ec.dongleCooldown));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/80 backdrop-blur-md p-6 sm:p-8 hover:border-white/20 transition-colors duration-500"
    >
      <div className="absolute inset-0 -z-10 bg-[#0a0a0d] sm:hidden" />
      <div className="absolute -right-16 -top-16 -z-10 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 -z-10 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Community
            </Badge>
            {hub && hub.count > 0 && (
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60 flex items-center gap-1">
                <FlaskConical className="w-3 h-3" />
                {hub.count.toLocaleString()} edge case{hub.count > 1 ? "s" : ""} shared
              </Badge>
            )}
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white/90 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-white/80" />
            Edge Case Hub
          </h3>
          <p className="text-sm text-white/45 max-w-xl leading-relaxed">
            Not sure your scheduler survives the tricky cases? Load scenarios that broke other students' Codexion, check your log against them, and share the ones you found.
          </p>
        </div>

        {trending.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-white/40 text-[10px] tracking-wider uppercase font-medium">Top voted</p>
            {trending.map((ec, i) => (
              <motion.div
                key={ec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-colors"
              >
                <span className="flex w-8 shrink-0 flex-col items-center text-white tabular-nums">
                  <ThumbsUp className="w-3 h-3 text-white/40" />
                  <span className="text-xs font-semibold">{ec.votes}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/90">{ec.title}</p>
                  <p className="flex items-center gap-2 truncate text-[11px] text-white/40">
                    <span>by @{ec.author}</span>
                    {ec.commentCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {ec.commentCount}
                      </span>
                    )}
                    {ec.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="hidden sm:inline rounded-full border border-white/5 bg-white/5 px-2 text-[10px] text-white/50">
                        {tag}
                      </span>
                    ))}
                  </p>
                </div>
                {ec.command && (
                  <button
                    type="button"
                    onClick={() => tryCase(ec)}
                    title="Load this command and settings, then run your program"
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <Play className="w-3 h-3" />
                    Try it
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/hub")}
            className="group rounded-full bg-white text-black hover:bg-white/90 px-5 py-2 text-xs font-semibold cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Browse the hub
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/hub")}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Plus className="w-3.5 h-3.5" />
            Share an edge case
          </button>
        </div>
      </div>
    </motion.div>
  );
}
