"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, Pie, PieChart, XAxis } from "recharts";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import type { DailyPoint, DeviceSlice } from "@/types/stats";
import { formatGrowth } from "@/lib/worldStats";

const deviceCategoryChartConfig = {
  desktop: { label: "Desktop", color: "#ffffff" },
  mobile: { label: "Mobile", color: "#a3a3a3" },
  tablet: { label: "Tablet", color: "#525252" },
};

const dailyChartConfig = {
  visits: { label: "Visits", color: "#ffffff" },
  uniques: { label: "Unique", color: "#737373" },
};

interface OverviewCardProps {
  periodLabel: string;
  visits: number;
  uniqueVisitors: number;
  growth: number | null;
  showGrowth: boolean;
  daily: DailyPoint[];
  deviceCategoryData: DeviceSlice[];
}

function formatDay(value: unknown) {
  return typeof value === "string" ? format(parseISO(value), "MMM d, yyyy") : "";
}

function MetricChart({ data }: { data: DailyPoint[] }) {
  return (
    <ChartContainer
      config={dailyChartConfig}
      className="aspect-auto h-24 w-full"
    >
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
          tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
        />
        <Area type="monotone" dataKey="visits" stroke="#ffffff" strokeWidth={2} fill="url(#usersGradient)" />
        <Area type="monotone" dataKey="uniques" stroke="#737373" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
        <ChartTooltip content={<ChartTooltipContent indicator="line" labelFormatter={(_, payload) => formatDay(payload?.[0]?.payload?.date)} />} />
      </AreaChart>
    </ChartContainer>
  );
}

export function OverviewCard({ periodLabel, visits, uniqueVisitors, growth, showGrowth, daily, deviceCategoryData }: OverviewCardProps) {
  const totalDevices = deviceCategoryData.reduce((acc, curr) => acc + curr.value, 0);
  const formattedDevices = deviceCategoryData.map(d => ({
    ...d,
    percentage: totalDevices > 0 ? Math.round((d.value / totalDevices) * 100) : 0
  }));
  const GrowthIcon = growth === null || growth > 0 ? TrendingUp : growth < 0 ? TrendingDown : Minus;

  return (
    <Card className="bg-[#121215]/80 backdrop-blur-md border-white/10 shadow-xl rounded-2xl h-full flex flex-col hover:border-white/20 transition-colors duration-500">
      <CardHeader className="pb-2 flex-none">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-white/40 pb-2 text-[10px] tracking-wider uppercase font-medium">
            Visits in {periodLabel}
          </p>
          <p className="text-3xl leading-none font-bold text-white tracking-tight tabular-nums">{visits.toLocaleString()}</p>
          {/* <p className="text-white/50 text-xs mt-2 tabular-nums">
            {uniqueVisitors.toLocaleString()} unique visitors
          </p> */}
        </motion.div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="mb-4">
          <MetricChart data={daily} />
          {showGrowth && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="mt-3 flex items-center gap-1.5 text-xs bg-white/10 text-white border border-white/20 px-2 py-1 rounded-full w-fit cursor-default"
            >
              <GrowthIcon className="size-3.5" />
              <span className="font-semibold">{formatGrowth(growth)}</span>
              <span className="text-white/70 font-medium">vs previous period</span>
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="border-white/10 mt-auto border-t pt-5">
          <p className="text-white/40 text-[10px] tracking-wider uppercase font-medium text-center">
            Device category
          </p>

          {formattedDevices.length === 0 ? (
            <p className="text-white/30 text-xs py-8 text-center">No data for this period</p>
          ) : (
            <>
              <ChartContainer
                config={deviceCategoryChartConfig}
                className="mx-auto mt-4 aspect-square h-32 w-32 drop-shadow-xl"
              >
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={formattedDevices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={56}
                    strokeWidth={3}
                    stroke="#121215"
                  />
                </PieChart>
              </ChartContainer>

              <div className="mt-6 grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                {formattedDevices.map((device, i) => (
                  <motion.div
                    key={device.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="text-center rounded-lg p-1 transition-colors cursor-default"
                  >
                    <p className="text-white/60 flex items-center justify-center gap-1.5 text-[10px] tracking-wide uppercase font-semibold">
                      <span className="size-2 rounded-full shadow-sm" style={{ backgroundColor: device.fill }} />
                      {device.name}
                    </p>
                    <p className="text-white mt-1.5 leading-none font-bold tabular-nums">
                      {device.percentage}%
                    </p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
