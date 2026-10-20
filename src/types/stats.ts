export type StatsRange = "7d" | "30d" | "90d" | "all";

export type StatsRow = {
  label: string;
  value: number;
  code?: string;
};

export type DailyPoint = {
  date: string;
  visits: number;
  uniques: number;
};

export type CityStat = {
  city: string;
  country: string | null;
  lat: number;
  lng: number;
  count: number;
};

export type RecentVisit = {
  id: string;
  city: string;
  country: string | null;
  lat: number;
  lng: number;
  at: number;
};

export type DeviceSlice = {
  name: string;
  value: number;
  fill: string;
};

export type ProductStats = {
  runsShared: number;
  edgecases: number;
  votes: number;
};

export type StatsResponse = {
  range: StatsRange;
  breakdownScope: "range" | "all";
  visits: number;
  uniqueVisitors: number;
  previousVisits: number | null;
  growth: number | null;
  allTimeVisits: number;
  liveVisitors: number;
  visitorsByCountry: Record<string, number>;
  runsByCountry: Record<string, number>;
  daily: DailyPoint[];
  visitedPagesRows: StatsRow[];
  referrersRows: StatsRow[];
  countriesRows: StatsRow[];
  browsersRows: StatsRow[];
  deviceCategoryData: DeviceSlice[];
  cities: CityStat[];
  recentVisits: RecentVisit[];
  product: ProductStats;
};

export type RepoInfo = {
  stars: number;
  pushedAt: string;
  url: string;
};

export type PulseResponse = {
  liveVisitors: number;
  visitorsByCountry: Record<string, number>;
  repo: RepoInfo | null;
};
