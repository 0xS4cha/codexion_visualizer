import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Earth, FlaskConical, Radio, Share2, ThumbsUp, UserRound, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsResponse } from "@/types/stats";
import { summarizeSeries } from "@/lib/worldStats";

function StatTile({ icon, label, value, hint, delay }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-[#121215]/80 backdrop-blur-md px-4 py-3.5 hover:border-white/20 transition-colors duration-500"
    >
      <p className="flex items-center gap-1.5 text-white/40 text-[10px] tracking-wider uppercase font-medium">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white tabular-nums leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-[11px] text-white/40 truncate">{hint}</p>}
    </motion.div>
  );
}

export function KpiRow({ stats, periodLabel }: { stats: StatsResponse; periodLabel: string }) {
  const { peak, average } = summarizeSeries(stats.daily);
  const countriesReached = Object.keys(stats.visitorsByCountry).length;
  const iconClass = "w-3.5 h-3.5";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatTile delay={0.1} icon={<Eye className={iconClass} />} label="Visits" value={stats.visits.toLocaleString()} hint={periodLabel} />
      {/* <StatTile delay={0.15} icon={<UserRound className={iconClass} />} label="Unique visitors" value={stats.uniqueVisitors.toLocaleString()} hint={`${stats.allTimeVisits.toLocaleString()} visits all time`} /> */}
      <StatTile
        delay={0.2}
        icon={<CalendarDays className={iconClass} />}
        label="Peak day"
        value={peak ? peak.visits.toLocaleString() : "—"}
        hint={peak ? `${format(parseISO(peak.date), "MMM d, yyyy")} · avg ${average.toFixed(1)}/day` : "No visits yet"}
      />
      <StatTile delay={0.25} icon={<Earth className={iconClass} />} label="Countries reached" value={countriesReached.toLocaleString()} hint={stats.countriesRows[0] ? `Top: ${stats.countriesRows[0].label}` : undefined} />
      <StatTile
        delay={0.3}
        icon={<Radio className={iconClass} />}
        label="Live now"
        value={
          <span className="flex items-center gap-2">
            {stats.liveVisitors.toLocaleString()}
            {stats.liveVisitors > 0 && (
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
            )}
          </span>
        }
        hint="visits in the last 5 minutes"
      />
    </div>
  );
}

export function ProductCard({ product }: { product: StatsResponse["product"] }) {
  const items = [
    { icon: Share2, label: "Runs shared", value: product.runsShared, to: "/" },
    { icon: FlaskConical, label: "Edge cases", value: product.edgecases, to: "/hub" },
    { icon: ThumbsUp, label: "Community votes", value: product.votes, to: "/hub" },
  ];

  return (
    <Card className="gap-2 h-full bg-[#121215]/80 backdrop-blur-md border-white/10 shadow-xl rounded-2xl hover:border-white/20 transition-colors duration-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white/90">Community activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(({ icon: Icon, label, value, to }, i) => (
          <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
            <Link
              to={to}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <span className="flex items-center gap-2 text-white/80 font-medium">
                <Icon className="w-3.5 h-3.5 text-white/50" />
                {label}
              </span>
              <span className="text-white font-semibold tabular-nums">{value.toLocaleString()}</span>
            </Link>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading statistics">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[86px] rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Skeleton className="h-[520px] rounded-2xl bg-white/5" />
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[250px] rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
