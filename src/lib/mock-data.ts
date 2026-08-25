export interface BreakdownRow {
  label: string;
  value: number;
}

export const visitedPagesRows: BreakdownRow[] = [
  { label: "/home", value: 12000 },
  { label: "/about", value: 8500 },
  { label: "/dashboard", value: 6200 },
  { label: "/pricing", value: 4100 },
  { label: "/contact", value: 2300 },
];

export const referrersRows: BreakdownRow[] = [
  { label: "Google", value: 15000 },
  { label: "Direct", value: 8000 },
  { label: "Twitter", value: 4500 },
  { label: "GitHub", value: 3200 },
  { label: "LinkedIn", value: 2400 },
];

export const countriesRows: BreakdownRow[] = [
  { label: "United States", value: 14500 },
  { label: "France", value: 8900 },
  { label: "United Kingdom", value: 5200 },
  { label: "Germany", value: 3400 },
  { label: "Canada", value: 1100 },
];

export const browsersRows: BreakdownRow[] = [
  { label: "Chrome", value: 22000 },
  { label: "Safari", value: 7500 },
  { label: "Firefox", value: 2100 },
  { label: "Edge", value: 1200 },
  { label: "Opera", value: 300 },
];

export const deviceCategoryData = [
  { name: "Desktop", value: 65, fill: "#3b82f6" },
  { name: "Mobile", value: 30, fill: "#10b981" },
  { name: "Tablet", value: 5, fill: "#f59e0b" },
];

export const deviceCategoryChartConfig = {
  desktop: {
    label: "Desktop",
    color: "#3b82f6",
  },
  mobile: {
    label: "Mobile",
    color: "#10b981",
  },
  tablet: {
    label: "Tablet",
    color: "#f59e0b",
  },
};

export const usersPerDay = [
  { day: "01", users: 400 },
  { day: "05", users: 300 },
  { day: "10", users: 550 },
  { day: "15", users: 450 },
  { day: "20", users: 700 },
  { day: "25", users: 650 },
  { day: "30", users: 800 },
];

export const usersPerDayChartConfig = {
  users: {
    label: "Users",
    color: "#10b981",
  },
};
