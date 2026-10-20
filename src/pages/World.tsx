import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AlertCircle, Download, Link2, Loader2, RotateCw, Share2, Users } from "lucide-react";
import { Map, MapControls, MapGeoJSON, MapPopup } from "@/components/ui/map";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { useWorldData } from "@/lib/use-world-data";
import { useWorldStats } from "@/hooks/useWorldStats";
import { getVisitorCountry } from "@/lib/analytics";
import { downloadBlob } from "@/lib/exporters";
import {
  RANGE_OPTIONS,
  type MapMetric,
  buildFillColor,
  countryFlag,
  geometryBounds,
  geometryContains,
  isStatsRange,
  legendItems,
  quantileStops,
  rangeLabel,
  shareOf,
} from "@/lib/worldStats";
import type { StatsRange, StatsRow } from "@/types/stats";
import { OverviewCard } from "@/components/Codexion/OverviewCard";
import { BreakdownCard } from "@/components/Codexion/BreakdownCard";
import { BackButton } from "@/components/Codexion/BackButton";
import { KpiRow, ProductCard, StatsSkeleton } from "@/components/Codexion/WorldStatsCards";
import { CityMarkers, CountryFocus, FeatureState, INITIAL_VIEW, LatestVisit } from "@/components/Codexion/WorldMapLayers";
import { CountryPanel, MapLegend, type CountryDetails } from "@/components/Codexion/WorldPanels";
import Header from "@/components/Codexion/Header";
import Footer from "@/components/Codexion/Footer";

const COUNTRIES_SOURCE = "geojson-source-countries";
const COUNTRY_CODE = /^[A-Z]{2}$/;

type HoverInfo = {
  code: string;
  name: string;
  visitors: number;
  runs: number;
  lng: number;
  lat: number;
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string, fallback?: string) {
  try {
    return fallback ?? regionNames.of(code) ?? code;
  } catch {
    return fallback ?? code;
  }
}

const toggleItemClass =
  "h-8 px-3 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 data-[state=on]:bg-white data-[state=on]:text-black cursor-pointer";

export default function World() {
  const [params, setParams] = useSearchParams();
  const rangeParam = params.get("range");
  const range: StatsRange = isStatsRange(rangeParam) ? rangeParam : "all";
  const metric: MapMetric = params.get("metric") === "runs" ? "runs" : "visitors";
  const countryParam = params.get("country")?.toUpperCase() ?? null;
  const selectedCode = countryParam && COUNTRY_CODE.test(countryParam) ? countryParam : null;
  const periodLabel = rangeLabel(range);

  const { world, error: worldError } = useWorldData();
  const { data: stats, empty, error, loading, retry } = useWorldStats(range);
  const [viewerCountry, setViewerCountry] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [listHover, setListHover] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const selectCountry = useCallback(
    (code: string | null) => updateParams({ country: code && code === selectedCode ? null : code }),
    [updateParams, selectedCode]
  );

  useEffect(() => {
    let active = true;
    getVisitorCountry().then((code) => {
      if (active) setViewerCountry(code);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") updateParams({ country: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCode, updateParams]);

  const countries = useMemo(() => {
    if (!world) return null;
    const visitors = stats?.visitorsByCountry ?? {};
    const runs = stats?.runsByCountry ?? {};
    return {
      type: "FeatureCollection" as const,
      features: world.features.map((f) => {
        const code = f.properties.ISO_A2_EH;
        const v = visitors[code] ?? 0;
        const r = runs[code] ?? 0;
        return {
          ...f,
          properties: {
            NAME_LONG: f.properties.NAME_LONG,
            ISO_A2_EH: code,
            visitors: v,
            runs: r,
            value: metric === "runs" ? r : v,
          },
        };
      }),
    };
  }, [world, stats, metric]);

  const stops = useMemo(
    () => quantileStops(Object.values((metric === "runs" ? stats?.runsByCountry : stats?.visitorsByCountry) ?? {})),
    [stats, metric]
  );

  const fillPaint = useMemo(
    () => ({
      "fill-color": buildFillColor(stops) as never,
      "fill-opacity": 0.92,
    }),
    [stops]
  );

  const viewerFeature = useMemo(() => {
    if (!world || !viewerCountry) return null;
    const features = world.features.filter((f) => f.properties.ISO_A2_EH === viewerCountry);
    return features.length ? { type: "FeatureCollection" as const, features } : null;
  }, [world, viewerCountry]);

  const viewerCasingPaint = useMemo(() => ({ "line-color": "#0a0a0d", "line-width": 4 }), []);
  const viewerLinePaint = useMemo(
    () => ({ "line-color": "#ffffff", "line-width": 1.5, "line-dasharray": [2, 1.5] }),
    []
  );

  const cities = useMemo(() => {
    if (!stats) return [];
    return stats.cities.map((c) => ({
      ...c,
      country:
        c.country ??
        world?.features.find((f) => geometryContains(f.geometry, c.lng, c.lat))?.properties.ISO_A2_EH ??
        null,
    }));
  }, [stats, world]);

  const selectedFeature = useMemo(
    () => (selectedCode ? world?.features.find((f) => f.properties.ISO_A2_EH === selectedCode) ?? null : null),
    [world, selectedCode]
  );

  const selectedBounds = useMemo(() => geometryBounds(selectedFeature?.geometry), [selectedFeature]);

  const countryDetails = useMemo<CountryDetails | null>(() => {
    if (!selectedCode) return null;
    const visitors = stats?.visitorsByCountry ?? {};
    const ranked = Object.entries(visitors).sort((a, b) => b[1] - a[1]);
    const index = ranked.findIndex(([code]) => code === selectedCode);
    return {
      code: selectedCode,
      name: countryName(selectedCode, selectedFeature?.properties.NAME_LONG),
      visitors: visitors[selectedCode] ?? 0,
      runs: stats?.runsByCountry[selectedCode] ?? 0,
      rank: index >= 0 ? index + 1 : null,
      rankedCount: ranked.length,
      totalVisitors: ranked.reduce((acc, [, v]) => acc + v, 0),
      isViewer: selectedCode === viewerCountry,
      cities: cities.filter((c) => c.country === selectedCode),
    };
  }, [selectedCode, selectedFeature, stats, cities, viewerCountry]);

  const cityRows = useMemo<StatsRow[]>(
    () => cities.map((c) => ({ label: c.city, value: c.count, code: c.country ?? undefined })),
    [cities]
  );

  const totalCountryVisitors = useMemo(
    () => Object.values(stats?.visitorsByCountry ?? {}).reduce((a, b) => a + b, 0),
    [stats]
  );

  const handleRowClick = useCallback(
    (row: StatsRow) => {
      if (!row.code) return;
      selectCountry(row.code);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [selectCountry]
  );

  const copyLink = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Could not copy the link"));
  }, []);

  const exportPng = useCallback(async () => {
    if (!pageRef.current) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(pageRef.current, {
        backgroundColor: "#0a0a0d",
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Empty canvas");
      downloadBlob(blob, `codexion-world-${range}.png`, "image/png");
      toast.success("Snapshot downloaded");
    } catch {
      toast.error("Could not export the page");
    } finally {
      setExporting(false);
    }
  }, [range]);

  const highlightedCode = listHover ?? hover?.code ?? null;
  const legendTitle = metric === "runs" ? "Shared runs · all time" : `Visits · ${periodLabel}`;

  return (
    <>
      <Header />
      <motion.div
        ref={pageRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full min-h-screen bg-[#0a0a0d] overflow-x-hidden pb-16"
      >
        <div className="relative w-full h-[75vh] min-h-[600px] border-b border-white/5">
          <div className="absolute inset-0 w-full h-full">
            <Map
              blank
              center={INITIAL_VIEW.center}
              zoom={INITIAL_VIEW.zoom}
              minZoom={1.5}
              maxZoom={6}
              cooperativeGestures
              dragRotate={false}
              pitchWithRotate={false}
              canvasContextAttributes={{ preserveDrawingBuffer: true }}
              loading={!countries && !worldError}
            >
              {countries && (
                <MapGeoJSON
                  id="countries"
                  data={countries}
                  promoteId="ISO_A2_EH"
                  fillPaint={fillPaint}
                  interactive
                  onClick={(e) => {
                    const code = e.feature?.properties?.ISO_A2_EH;
                    if (code && COUNTRY_CODE.test(code)) selectCountry(code);
                  }}
                  onHover={(e) => {
                    const props = e?.feature?.properties;
                    const code = props?.ISO_A2_EH;
                    const visitors = props?.visitors ?? 0;
                    const runs = props?.runs ?? 0;
                    if (!e || !code || (visitors <= 0 && runs <= 0 && code !== viewerCountry)) {
                      setHover(null);
                      return;
                    }
                    setHover({ code, name: props.NAME_LONG, visitors, runs, lng: e.longitude, lat: e.latitude });
                  }}
                />
              )}
              {viewerFeature && <MapGeoJSON id="viewer-casing" data={viewerFeature} fillPaint={false} linePaint={viewerCasingPaint} />}
              {viewerFeature && <MapGeoJSON id="viewer" data={viewerFeature} fillPaint={false} linePaint={viewerLinePaint} />}
              <FeatureState sourceId={COUNTRIES_SOURCE} id={listHover} stateKey="highlight" ready={Boolean(countries)} />
              <FeatureState sourceId={COUNTRIES_SOURCE} id={selectedCode} stateKey="selected" ready={Boolean(countries)} />
              <CountryFocus bounds={selectedBounds} />
              {metric === "visitors" && <CityMarkers cities={cities} onSelect={(c) => c.country && selectCountry(c.country)} />}
              {stats && <LatestVisit visits={stats.recentVisits} />}

              <MapControls className="bottom-8 right-8 z-20" showFullscreen />
              {hover && (
                <MapPopup
                  longitude={hover.lng}
                  latitude={hover.lat}
                  offset={12}
                  closeOnClick={false}
                  className="pointer-events-none z-50 p-0 bg-transparent border-none shadow-none"
                >
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[#121215]/80 backdrop-blur-2xl border border-white/20 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[180px]"
                    >
                      <p className="text-sm font-bold text-white mb-2.5">
                        <span aria-hidden className="mr-1.5">{countryFlag(hover.code)}</span>
                        {hover.name}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-white/60 flex items-center gap-1.5 text-xs font-medium">
                            <Users className="w-3.5 h-3.5" />
                            Visits
                          </span>
                          <span className="text-white text-xs font-bold tabular-nums bg-white/10 px-2 py-1 rounded-md">
                            {hover.visitors.toLocaleString()} · {shareOf(hover.visitors, totalCountryVisitors)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-white/60 flex items-center gap-1.5 text-xs font-medium">
                            <Share2 className="w-3.5 h-3.5" />
                            Runs shared
                          </span>
                          <span className="text-white text-xs font-bold tabular-nums bg-white/10 px-2 py-1 rounded-md">
                            {hover.runs.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {hover.code === viewerCountry && <p className="mt-2.5 text-[10px] font-medium text-white/60">You are here</p>}
                      <p className="mt-2 text-[10px] text-white/40">Click for details</p>
                    </motion.div>
                  </AnimatePresence>
                </MapPopup>
              )}
            </Map>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-[#0a0a0d]"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-[#0a0a0d] via-[#0a0a0d]/60 to-transparent"
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 sm:px-6 pt-20 flex flex-wrap items-start justify-between gap-3">
            <div className="pointer-events-auto">
              <BackButton />
              <h1 className="mt-2 px-4 text-xl sm:text-2xl font-bold text-white tracking-tight">Global Simulation Reach</h1>
              <p className="px-4 text-xs text-white/40">Where Codexion Visualizer is used around the world</p>
            </div>
            <div className="pointer-events-auto flex flex-wrap items-center gap-2" data-html2canvas-ignore>
              <ToggleGroup
                type="single"
                value={range}
                onValueChange={(value) => value && updateParams({ range: value === "30d" ? null : value })}
                aria-label="Time range"
                spacing={0}
                className="rounded-full border border-white/10 bg-[#121215]/80 backdrop-blur-xl p-1"
              >
                {RANGE_OPTIONS.map((o) => (
                  <ToggleGroupItem key={o.value} value={o.value} aria-label={o.long} className={`${toggleItemClass} rounded-full`}>
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ToggleGroup
                type="single"
                value={metric}
                onValueChange={(value) => value && updateParams({ metric: value === "visitors" ? null : value })}
                aria-label="Map metric"
                spacing={0}
                className="rounded-full border border-white/10 bg-[#121215]/80 backdrop-blur-xl p-1"
              >
                <ToggleGroupItem value="visitors" className={`${toggleItemClass} rounded-full`}>Visits</ToggleGroupItem>
                <ToggleGroupItem value="runs" className={`${toggleItemClass} rounded-full`}>Runs</ToggleGroupItem>
              </ToggleGroup>
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                aria-label="Copy link to this view"
                className="rounded-full border-white/10 bg-[#121215]/80 backdrop-blur-xl text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={exportPng}
                disabled={exporting}
                aria-label="Download a PNG snapshot"
                className="rounded-full border-white/10 bg-[#121215]/80 backdrop-blur-xl text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="pointer-events-none absolute left-4 right-4 sm:left-auto sm:right-6 top-48 z-30 flex justify-end">
            <AnimatePresence>
              {countryDetails && (
                <CountryPanel country={countryDetails} periodLabel={periodLabel} onClose={() => updateParams({ country: null })} />
              )}
            </AnimatePresence>
          </div>

          <div className="pointer-events-none absolute bottom-8 left-4 sm:left-6 z-20">
            {worldError ? (
              <p className="pointer-events-auto rounded-xl border border-white/10 bg-[#121215]/80 px-3 py-2 text-xs text-white/60">
                The world map could not be loaded.
              </p>
            ) : (
              <MapLegend
                title={legendTitle}
                items={legendItems(stops)}
                showViewer={Boolean(viewerFeature)}
                showCities={metric === "visitors" && cities.length > 0}
                showRecent={(stats?.recentVisits.length ?? 0) > 0}
              />
            )}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-12 z-10 space-y-6">
          {error && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Could not load statistics: {error}
              </span>
              <Button variant="ghost" size="sm" onClick={retry} className="text-red-100 hover:bg-red-500/10 cursor-pointer">
                <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          )}

          {empty && (
            <p className="text-center text-white/40 font-medium py-12">No visits recorded yet.</p>
          )}

          {loading && !stats && !error && <StatsSkeleton />}

          {stats && (
            <div className={`space-y-6 transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`} aria-busy={loading}>
              {stats.breakdownScope === "all" && range !== "all" && (
                <p className="text-[11px] text-white/40">
                  Detailed breakdowns for this period are not available yet, so countries, pages, referrers, browsers, devices and cities show all-time data.
                </p>
              )}

              <KpiRow stats={stats} periodLabel={periodLabel} />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch"
              >
                <div className="lg:col-span-1 h-full">
                  <OverviewCard
                    periodLabel={periodLabel}
                    visits={stats.visits}
                    uniqueVisitors={stats.uniqueVisitors}
                    growth={stats.growth}
                    showGrowth={range !== "all"}
                    daily={stats.daily}
                    deviceCategoryData={stats.deviceCategoryData}
                  />
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BreakdownCard
                    title="Countries"
                    rows={stats.countriesRows}
                    highlightedCode={highlightedCode}
                    selectedCode={selectedCode}
                    onRowHover={(row) => setListHover(row?.code ?? null)}
                    onRowClick={handleRowClick}
                  />
                  <BreakdownCard
                    title="Cities"
                    rows={cityRows}
                    selectedCode={selectedCode}
                    onRowHover={(row) => setListHover(row?.code ?? null)}
                    onRowClick={handleRowClick}
                  />
                  <BreakdownCard title="Visited pages" rows={stats.visitedPagesRows} />
                  <BreakdownCard title="Referrers" rows={stats.referrersRows} />
                  <BreakdownCard title="Browsers" rows={stats.browsersRows} />
                  <ProductCard product={stats.product} />
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
      <Footer />
    </>
  );
}
