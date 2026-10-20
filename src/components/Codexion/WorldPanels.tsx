import { motion } from "motion/react";
import { MapPin, Share2, Users, X } from "lucide-react";
import type { CityStat } from "@/types/stats";
import { countryFlag, MAP_BASE_COLOR, shareOf } from "@/lib/worldStats";

export function MapLegend({
  title,
  items,
  showViewer,
  showCities,
  showRecent,
}: {
  title: string;
  items: { color: string; label: string }[];
  showViewer: boolean;
  showCities: boolean;
  showRecent: boolean;
}) {
  return (
    <div className="pointer-events-auto rounded-xl border border-white/10 bg-[#121215]/80 backdrop-blur-xl px-3.5 py-3 text-[11px] text-white/70 shadow-xl max-w-[260px]">
      <p className="text-white/40 text-[10px] tracking-wider uppercase font-medium mb-2">{title}</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-white/10" style={{ backgroundColor: MAP_BASE_COLOR }} />0
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 tabular-nums">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>
      {(showViewer || showCities || showRecent) && (
        <ul className="hidden sm:block mt-2.5 pt-2.5 border-t border-white/10 space-y-1.5">
          {showViewer && (
            <li className="flex items-center gap-2">
              <span className="w-4 border-t-2 border-dashed border-white" />
              You are here
            </li>
          )}
          {showCities && (
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-white/70 border border-white ml-1 mr-1" />
              Cities with 3+ visits
            </li>
          )}
          {showRecent && (
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 ml-1 mr-1" />
              Latest visit
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export type CountryDetails = {
  code: string;
  name: string;
  visitors: number;
  runs: number;
  rank: number | null;
  rankedCount: number;
  totalVisitors: number;
  isViewer: boolean;
  cities: CityStat[];
};

export function CountryPanel({ country, periodLabel, onClose }: { country: CountryDetails; periodLabel: string; onClose: () => void }) {
  return (
    <motion.aside
      key={country.code}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3 }}
      aria-label={`${country.name} details`}
      className="pointer-events-auto w-full sm:w-[320px] rounded-2xl border border-white/15 bg-[#121215]/85 backdrop-blur-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white/40 text-[10px] tracking-wider uppercase font-medium">
            {country.rank ? `#${country.rank} of ${country.rankedCount} countries` : "No visits yet"}
          </p>
          <h2 className="mt-1 text-lg font-bold text-white truncate">
            <span aria-hidden className="mr-2">{countryFlag(country.code)}</span>
            {country.name}
          </h2>
          {country.isViewer && (
            <span className="mt-1.5 inline-block rounded-full border border-white/30 px-2 py-0.5 text-[10px] font-medium text-white/80">You are here</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close country details"
          className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/5 border border-white/5 p-2">
          <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/40"><Users className="w-3 h-3" />Visits</dt>
          <dd className="mt-1 text-sm font-bold text-white tabular-nums">{country.visitors.toLocaleString()}</dd>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 p-2">
          <dt className="text-[10px] uppercase tracking-wide text-white/40">Share</dt>
          <dd className="mt-1 text-sm font-bold text-white tabular-nums">{shareOf(country.visitors, country.totalVisitors)}</dd>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 p-2">
          <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/40"><Share2 className="w-3 h-3" />Runs</dt>
          <dd className="mt-1 text-sm font-bold text-white tabular-nums">{country.runs.toLocaleString()}</dd>
        </div>
      </dl>
      <p className="mt-1.5 text-[10px] text-white/30">Visits for {periodLabel}, runs shared all time</p>

      <div className="mt-4">
        <p className="text-white/40 text-[10px] tracking-wider uppercase font-medium mb-2">Top cities</p>
        {country.cities.length === 0 ? (
          <p className="text-xs text-white/30">No city with enough visits to be shown</p>
        ) : (
          <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {country.cities.slice(0, 8).map((city) => (
              <li key={`${city.city}-${city.lat}`} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-white/80 truncate"><MapPin className="w-3 h-3 text-white/40" />{city.city}</span>
                <span className="text-white font-semibold tabular-nums">{city.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.aside>
  );
}
