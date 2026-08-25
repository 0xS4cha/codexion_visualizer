import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Map, MapControls, MapGeoJSON, MapPopup, MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/map";
import { useWorldData } from "@/lib/use-world-data";
import { TrendingUp, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OverviewCard } from "@/components/Codexion/OverviewCard";
import { BreakdownCard } from "@/components/Codexion/BreakdownCard";

function buildFillColor(): unknown[] {
  const { base, ramp, hover } = {
    base: "#2a2a2a",
    ramp: ["#404040", "#737373", "#a3a3a3", "#d4d4d4"],
    hover: "#ffffff",
  };
  const [s0, s1, s2, s3, s4] = [0, 25, 50, 75, 100];
  const ramped = [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "visitors"], 0],
    s0,
    base,
    s1,
    ramp[0],
    s2,
    ramp[1],
    s3,
    ramp[2],
    s4,
    ramp[3],
  ];
  return [
    "case",
    [
      "all",
      ["boolean", ["feature-state", "hover"], false],
      [">", ["coalesce", ["get", "visitors"], 0], 0],
    ],
    hover,
    ramped,
  ];
}

export default function World() {
  const [hover, setHover] = useState<any | null>(null);
  const world = useWorldData();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (!data.empty && !data.error) {
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const countries = useMemo<any | null>(() => {
    if (!world || !stats) return null;
    return {
      type: "FeatureCollection",
      features: world.features.map((f) => ({
        ...f,
        properties: {
          NAME_LONG: f.properties.NAME_LONG,
          visitors: stats.visitorsByCountry?.[f.properties.NAME_LONG] ?? 0,
        },
      })),
    };
  }, [world, stats]);

  const fillPaint = useMemo(
    () => ({
      "fill-color": buildFillColor() as never,
      "fill-opacity": 0.92,
    }),
    [],
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0d] flex items-center justify-center">
        <p className="text-white/40 font-medium">No dashboard data available yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative w-full min-h-screen bg-[#0a0a0d] overflow-x-hidden pb-16"
    >
      <div className="relative w-full h-[75vh] min-h-[600px] border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute top-8 left-8 z-20 p-5 rounded-2xl border border-white/10 bg-[#121215]/80 backdrop-blur-md shadow-2xl min-w-[280px]"
        >
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Global Simulation Reach</h3>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
              {stats.totalVisitors.toLocaleString()}
            </span>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-2 py-0.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {stats.visitorGrowth}
            </Badge>
          </div>
        </motion.div>

        <div className="absolute inset-0 w-full h-full">
          <Map
            blank
            center={[12, 28]}
            zoom={2}
            minZoom={1.5}
            maxZoom={6}
            scrollZoom={false}
            dragRotate={false}
            pitchWithRotate={false}
            loading={!countries}
          >
            {countries && (
              <MapGeoJSON
                data={countries}
                promoteId="NAME_LONG"
                fillPaint={fillPaint}
                interactive
                onHover={(e) => {
                  const visitors = e?.feature?.properties?.visitors ?? 0;
                  if (!e || visitors <= 0) {
                    setHover(null);
                    return;
                  }
                  setHover({
                    name: e.feature?.properties?.NAME_LONG,
                    visitors,
                    lng: e.longitude,
                    lat: e.latitude,
                  });
                }}
              />
            )}


            <MapControls className="bottom-8 right-8 z-20" />

            {stats.locations?.map((location: any) => (
              <MapMarker
                key={location.city}
                longitude={location.lng}
                latitude={location.lat}
              >
                <MarkerContent className="group">
                  <div
                    className="bg-white/80 group-hover:bg-white rounded-full transition-all duration-300 group-hover:scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    style={{
                      width: location.size * 3,
                      height: location.size * 3,
                    }}
                  />
                </MarkerContent>
                <MarkerTooltip
                  offset={15}
                  className="bg-[#1a1a1f]/90 backdrop-blur-xl border-white/10 text-white rounded-lg p-2 shadow-2xl"
                >
                  <p className="font-semibold text-xs">{location.city}</p>
                  <p className="text-white/60 text-[10px] mt-0.5 font-medium">
                    {location.count} visits
                  </p>
                </MarkerTooltip>
              </MapMarker>
            ))}

            {hover && (
              <MapPopup
                longitude={hover.lng}
                latitude={hover.lat}
                offset={12}
                closeOnClick={false}
                className="pointer-events-none z-50 p-0 bg-transparent border-none shadow-none"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#1a1a1f]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl min-w-[140px]"
                >
                  <p className="text-xs font-semibold text-white/90 mb-2">{hover.name}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/50 flex items-center gap-1.5 text-[11px]">
                      <Users className="w-3 h-3" />
                      Visitors
                    </span>
                    <span className="text-white text-xs font-medium tabular-nums bg-white/10 px-1.5 py-0.5 rounded">
                      {hover.visitors.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              </MapPopup>
            )}
          </Map>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-[#0a0a0d]"
          aria-hidden
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          <div className="lg:col-span-1 h-full">
            <OverviewCard
              totalVisitors={stats.totalVisitors}
              visitorGrowth={stats.visitorGrowth}
              usersPerDay={stats.usersPerDay}
              deviceCategoryData={stats.deviceCategoryData}
            />
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <BreakdownCard title="Visited pages" rows={stats.visitedPagesRows} />
            <BreakdownCard title="Referrers" rows={stats.referrersRows} />
            <BreakdownCard title="Countries" rows={stats.countriesRows} />
            <BreakdownCard title="Browsers" rows={stats.browsersRows} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
