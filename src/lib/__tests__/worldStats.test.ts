import { describe, expect, it } from "vitest";
import {
  MAP_RAMP,
  countryFlag,
  formatGrowth,
  geometryBounds,
  geometryContains,
  isStatsRange,
  legendItems,
  quantileStops,
  shareOf,
  summarizeSeries,
} from "@/lib/worldStats";

const square: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
  ],
};

describe("world stats helpers", () => {
  it("computes increasing quantile stops", () => {
    expect(quantileStops([])).toEqual([1]);
    expect(quantileStops([0, 0, 3])).toEqual([3]);
    expect(quantileStops([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([1, 3, 5, 7]);
    expect(quantileStops([5, 5, 5, 5, 9])).toEqual([5, 9]);
  });

  it("maps stops to the brightest ramp colors with readable labels", () => {
    expect(legendItems([1, 3, 5, 7])).toEqual([
      { color: MAP_RAMP[0], label: "1–2" },
      { color: MAP_RAMP[1], label: "3–4" },
      { color: MAP_RAMP[2], label: "5–6" },
      { color: MAP_RAMP[3], label: "7+" },
    ]);
    expect(legendItems([5, 6])).toEqual([
      { color: MAP_RAMP[2], label: "5" },
      { color: MAP_RAMP[3], label: "6+" },
    ]);
  });

  it("builds flag emoji from country codes", () => {
    expect(countryFlag("FR")).toBe("🇫🇷");
    expect(countryFlag("us")).toBe("🇺🇸");
    expect(countryFlag("-99")).toBe("");
    expect(countryFlag(null)).toBe("");
  });

  it("tests points against polygons with holes", () => {
    expect(geometryContains(square, 2, 2)).toBe(true);
    expect(geometryContains(square, 5, 5)).toBe(false);
    expect(geometryContains(square, 12, 2)).toBe(false);
    expect(geometryContains({ type: "MultiPolygon", coordinates: [square.coordinates] }, 8, 8)).toBe(true);
    expect(geometryBounds(square)).toEqual([[0, 0], [10, 10]]);
    expect(geometryBounds(null)).toBeNull();
  });

  it("summarizes a daily series", () => {
    const series = [
      { date: "2026-01-01", visits: 2, uniques: 1 },
      { date: "2026-01-02", visits: 6, uniques: 4 },
      { date: "2026-01-03", visits: 1, uniques: 1 },
    ];
    expect(summarizeSeries(series)).toEqual({ peak: series[1], average: 3 });
    expect(summarizeSeries([{ date: "2026-01-01", visits: 0, uniques: 0 }]).peak).toBeNull();
  });

  it("formats growth, shares and ranges", () => {
    expect(formatGrowth(12.5)).toBe("+12.5%");
    expect(formatGrowth(-3)).toBe("-3%");
    expect(formatGrowth(0)).toBe("0%");
    expect(formatGrowth(null)).toBe("New");
    expect(shareOf(1, 3)).toBe("33%");
    expect(shareOf(1, 400)).toBe("0.3%");
    expect(shareOf(1, 0)).toBe("0%");
    expect(isStatsRange("90d")).toBe(true);
    expect(isStatsRange("1y")).toBe(false);
  });
});
