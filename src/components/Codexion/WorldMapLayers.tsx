import { useEffect, useRef } from "react";
import { MapMarker, MarkerContent, MarkerTooltip, useMap } from "@/components/ui/map";
import type { CityStat, RecentVisit } from "@/types/stats";
import { countryFlag } from "@/lib/worldStats";

export const INITIAL_VIEW = { center: [12, 28] as [number, number], zoom: 2 };

export function FeatureState({ sourceId, id, stateKey, ready }: { sourceId: string; id: string | null; stateKey: string; ready: boolean }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !ready || !id || !map.getSource(sourceId)) return;
    map.setFeatureState({ source: sourceId, id }, { [stateKey]: true });
    return () => {
      if (map.getSource(sourceId)) map.setFeatureState({ source: sourceId, id }, { [stateKey]: false });
    };
  }, [map, isLoaded, ready, sourceId, id, stateKey]);

  return null;
}

export function CountryFocus({ bounds }: { bounds: [[number, number], [number, number]] | null }) {
  const { map, isLoaded } = useMap();
  const focused = useRef(false);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200;
    if (bounds) {
      focused.current = true;
      map.fitBounds(bounds, { padding: { top: 120, bottom: 80, left: 60, right: 380 }, maxZoom: 5, duration });
    } else if (focused.current) {
      focused.current = false;
      map.flyTo({ ...INITIAL_VIEW, duration });
    }
  }, [map, isLoaded, bounds]);

  return null;
}

export function CityMarkers({ cities, onSelect }: { cities: CityStat[]; onSelect: (city: CityStat) => void }) {
  const max = cities.reduce((m, c) => Math.max(m, c.count), 1);

  return (
    <>
      {cities.map((city) => {
        const size = 6 + Math.sqrt(city.count / max) * 14;
        return (
          <MapMarker key={`${city.city}-${city.lat}-${city.lng}`} longitude={city.lng} latitude={city.lat} onClick={() => onSelect(city)}>
            <MarkerContent>
              <span
                className="block rounded-full bg-white/70 border border-white shadow-[0_0_12px_rgba(255,255,255,0.45)] transition-transform hover:scale-125"
                style={{ width: size, height: size }}
              />
            </MarkerContent>
            <MarkerTooltip className="bg-[#121215]/90 backdrop-blur-xl border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white shadow-xl">
              <span className="font-semibold">
                {countryFlag(city.country)} {city.city}
              </span>
              <span className="text-white/60 tabular-nums"> · {city.count.toLocaleString()} visits</span>
            </MarkerTooltip>
          </MapMarker>
        );
      })}
    </>
  );
}

export function LatestVisit({ visits }: { visits: RecentVisit[] }) {
  const latest = visits[visits.length - 1];

  if (!latest) return null;

  return (
    <MapMarker longitude={latest.lng} latitude={latest.lat}>
      <MarkerContent>
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-3 rounded-full bg-emerald-400 border border-[#0a0a0d]" />
        </span>
      </MarkerContent>
      <MarkerTooltip className="bg-[#121215]/90 backdrop-blur-xl border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white shadow-xl">
        Latest visit · {countryFlag(latest.country)} {latest.city}
      </MarkerTooltip>
    </MapMarker>
  );
}
