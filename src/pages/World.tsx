import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Map, MapControls, MapGeoJSON, MapPopup } from "@/components/ui/map";
import { useWorldData } from "@/lib/use-world-data";
import { TrendingUp, Users, Loader2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OverviewCard } from "@/components/Codexion/OverviewCard";
import { BreakdownCard } from "@/components/Codexion/BreakdownCard";
import { BackButton } from "@/components/Codexion/BackButton";
import Header from "@/components/Codexion/Header";
import Footer from "@/components/Codexion/Footer";

function buildFillColor(): unknown[] {
  const { base, ramp, hover } = {
    base: "#2a2a2a",
    ramp: ["#404040", "#737373", "#a3a3a3", "#d4d4d4"],
    hover: "#ffffff",
  };
  const [s0, s1, s2, s3, s4] = [0, 1, 5, 15, 50];
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
          ISO_A2_EH: f.properties.ISO_A2_EH,
          visitors: stats.visitorsByCountry?.[f.properties.ISO_A2_EH] ?? 0,
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

    <>
      <Header />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full min-h-screen bg-[#0a0a0d] overflow-x-hidden pb-16 pt-24"
      >
        <div className="absolute top-6 left-6 z-30">
          <BackButton />
        </div>
        <div className="relative w-full h-[75vh] min-h-[600px] border-b border-white/5">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            className="absolute top-20 left-8 z-20 p-6 rounded-2xl border border-white/10 bg-[#121215]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[300px] overflow-hidden group"
          >
            <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-white/40" />
              Global users
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-extrabold text-white tracking-tighter tabular-nums leading-none">
                {stats.totalVisitors.toLocaleString()}
              </span>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-2.5 py-1 mb-1 backdrop-blur-md">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
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
                      className="bg-[#121215]/80 backdrop-blur-2xl border border-white/20 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[160px]"
                    >
                      <p className="text-sm font-bold text-white mb-2.5">{hover.name}</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-white/60 flex items-center gap-1.5 text-xs font-medium">
                          <Users className="w-3.5 h-3.5" />
                          Visitors
                        </span>
                        <span className="text-white text-xs font-bold tabular-nums bg-white/10 px-2 py-1 rounded-md">
                          {hover.visitors.toLocaleString()}
                        </span>
                      </div>
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
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch"
          >
            <div className="lg:col-span-1 h-full">
              <OverviewCard
                totalVisitors={stats.totalVisitors}
                visitorGrowth={stats.visitorGrowth}
                usersPerDay={stats.usersPerDay}
                deviceCategoryData={stats.deviceCategoryData}
              />
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                <BreakdownCard title="Visited pages" rows={stats.visitedPagesRows} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                <BreakdownCard title="Referrers" rows={stats.referrersRows} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
                <BreakdownCard title="Countries" rows={stats.countriesRows} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}>
                <BreakdownCard title="Browsers" rows={stats.browsersRows} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      <Footer />
    </>
  );
}
