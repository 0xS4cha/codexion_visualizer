import { describe, expect, it } from "vitest";
import {
  addDays,
  buildSeries,
  computeGrowth,
  countryRows,
  dayKeys,
  daysBetween,
  escapeKey,
  mergeCities,
  mergeCounts,
  normalizeCountries,
  parseRange,
  publicCities,
  sumDays,
  toRows,
  unescapeKey,
} from "../stats";

describe("stats helpers", () => {
  it("parses ranges with a 30 day default", () => {
    expect(parseRange("7d")).toEqual({ range: "7d", days: 7 });
    expect(parseRange("all")).toEqual({ range: "all", days: null });
    expect(parseRange("1y")).toEqual({ range: "30d", days: 30 });
    expect(parseRange(undefined)).toEqual({ range: "30d", days: 30 });
  });

  it("builds contiguous day keys across month boundaries", () => {
    expect(dayKeys("2026-03-02", 4)).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(1);
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(31);
  });

  it("zero-fills the daily series and sums ranges", () => {
    const daily = { "2026-01-01": 4, "2026-01-03": 2 };
    const uniques = { "2026-01-01": 3 };
    const keys = dayKeys("2026-01-03", 3);
    expect(buildSeries(daily, uniques, keys)).toEqual([
      { date: "2026-01-01", visits: 4, uniques: 3 },
      { date: "2026-01-02", visits: 0, uniques: 0 },
      { date: "2026-01-03", visits: 2, uniques: 0 },
    ]);
    expect(sumDays(daily, keys)).toBe(6);
  });

  it("computes growth against the previous period", () => {
    expect(computeGrowth(150, 100)).toBe(50);
    expect(computeGrowth(50, 100)).toBe(-50);
    expect(computeGrowth(1, 3)).toBe(-66.7);
    expect(computeGrowth(10, 0)).toBeNull();
    expect(computeGrowth(0, 0)).toBe(0);
    expect(computeGrowth(10, null)).toBeNull();
  });

  it("escapes and unescapes Firestore keys", () => {
    expect(escapeKey("/hub")).toBe("_slash_hub");
    expect(escapeKey("github.com")).toBe("github_com");
    expect(unescapeKey("_slash_hub")).toBe("/hub");
    expect(unescapeKey("github_com")).toBe("github.com");
  });

  it("merges counts and cities", () => {
    expect(mergeCounts({ a: 1 }, { a: 2, b: 3, c: "x" })).toEqual({ a: 3, b: 3 });
    expect(mergeCities({ Paris: { count: 2, lat: 48.8, lng: 2.3 } }, { Paris: { count: 1, country: "FR" } })).toEqual({
      Paris: { count: 3, lat: 48.8, lng: 2.3, country: "FR" },
    });
  });

  it("sorts and limits rows", () => {
    expect(toRows({ b: 1, a: 5, z: 0, _slash_: 3 }, 2)).toEqual([
      { label: "a", value: 5 },
      { label: "/", value: 3 },
    ]);
  });

  it("normalizes country codes and names them", () => {
    const countries = normalizeCountries({ FR: 3, fr: 1, unknown: 9, US: 2, XX1: 4 });
    expect(countries).toEqual({ FR: 4, US: 2 });
    expect(countryRows(countries)).toEqual([
      { label: "France", value: 4, code: "FR" },
      { label: "United States", value: 2, code: "US" },
    ]);
  });

  it("hides small or unknown cities and rounds coordinates", () => {
    const cities = publicCities({
      Paris: { count: 5, lat: 48.85661, lng: 2.35222, country: "fr" },
      Lyon: { count: 2, lat: 45.76, lng: 4.83 },
      unknown: { count: 50, lat: 1, lng: 1 },
      Nowhere: { count: 10, lat: 0, lng: 0 },
      "S%C3%A3o%20Paulo": { count: 4, lat: -23.55, lng: -46.63 },
    });
    expect(cities).toEqual([
      { city: "Paris", country: "FR", lat: 48.86, lng: 2.35, count: 5 },
      { city: "São Paulo", country: null, lat: -23.55, lng: -46.63, count: 4 },
    ]);
  });
});
