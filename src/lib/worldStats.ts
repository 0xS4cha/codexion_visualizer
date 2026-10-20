import type { DailyPoint, StatsRange } from "@/types/stats";

export const MAP_BASE_COLOR = "#2a2a2a";
export const MAP_RAMP = ["#404040", "#737373", "#a3a3a3", "#d4d4d4"];
const MAP_ACTIVE_COLOR = "#ffffff";

export const RANGE_OPTIONS: { value: StatsRange; label: string; long: string }[] = [
  { value: "7d", label: "7D", long: "last 7 days" },
  { value: "30d", label: "30D", long: "last 30 days" },
  { value: "90d", label: "90D", long: "last 90 days" },
  { value: "all", label: "All", long: "all time" },
];

export type MapMetric = "visitors" | "runs";

export function isStatsRange(value: string | null): value is StatsRange {
  return RANGE_OPTIONS.some((o) => o.value === value);
}

export function rangeLabel(range: StatsRange): string {
  return RANGE_OPTIONS.find((o) => o.value === range)?.long ?? "";
}

export function quantileStops(values: number[], buckets = MAP_RAMP.length): number[] {
  const sorted = [...new Set(values.filter((v) => v > 0))].sort((a, b) => a - b);
  if (sorted.length === 0) return [1];
  const stops: number[] = [];
  for (let i = 0; i < buckets; i++) {
    const index = Math.floor((i / buckets) * sorted.length);
    const value = sorted[Math.min(index, sorted.length - 1)];
    if (stops.length === 0 || value > stops[stops.length - 1]) stops.push(value);
  }
  return stops;
}

export function buildFillColor(stops: number[]): unknown[] {
  const value = ["coalesce", ["get", "value"], 0];
  const steps: unknown[] = [];
  stops.forEach((stop, i) => {
    const color = MAP_RAMP[Math.min(MAP_RAMP.length - 1, i + MAP_RAMP.length - stops.length)];
    steps.push(stop, color);
  });
  const ramped = ["step", value, MAP_BASE_COLOR, ...steps];
  const active = [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "highlight"], false],
    ["boolean", ["feature-state", "selected"], false],
  ];
  return ["case", ["all", active, [">", value, 0]], MAP_ACTIVE_COLOR, ramped];
}

export function legendItems(stops: number[]): { color: string; label: string }[] {
  return stops.map((stop, i) => {
    const color = MAP_RAMP[Math.min(MAP_RAMP.length - 1, i + MAP_RAMP.length - stops.length)];
    const next = stops[i + 1];
    const label = next === undefined ? `${stop.toLocaleString()}+` : next - 1 > stop ? `${stop.toLocaleString()}–${(next - 1).toLocaleString()}` : stop.toLocaleString();
    return { color, label };
  });
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function ringContains(ring: number[][], lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonContains(polygon: number[][][], lng: number, lat: number): boolean {
  if (!polygon.length || !ringContains(polygon[0], lng, lat)) return false;
  return !polygon.slice(1).some((hole) => ringContains(hole, lng, lat));
}

export function geometryContains(geometry: GeoJSON.Geometry | null | undefined, lng: number, lat: number): boolean {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return polygonContains(geometry.coordinates, lng, lat);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((p) => polygonContains(p, lng, lat));
  return false;
}

export function geometryBounds(geometry: GeoJSON.Geometry | null | undefined): [[number, number], [number, number]] | null {
  if (!geometry) return null;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0] ?? []) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!Number.isFinite(minX)) return null;
  return [[minX, minY], [maxX, maxY]];
}

export function summarizeSeries(series: DailyPoint[]) {
  const peak = series.reduce<DailyPoint | null>((best, p) => (!best || p.visits > best.visits ? p : best), null);
  const total = series.reduce((acc, p) => acc + p.visits, 0);
  return {
    peak: peak && peak.visits > 0 ? peak : null,
    average: series.length ? total / series.length : 0,
  };
}

export function formatGrowth(growth: number | null): string {
  if (growth === null) return "New";
  return `${growth > 0 ? "+" : ""}${growth}%`;
}

export function shareOf(value: number, total: number): string {
  if (total <= 0) return "0%";
  const pct = (value / total) * 100;
  return `${pct < 1 && pct > 0 ? pct.toFixed(1) : Math.round(pct)}%`;
}
