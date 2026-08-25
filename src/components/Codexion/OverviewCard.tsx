"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, Pie, PieChart } from "recharts";

const deviceCategoryChartConfig = {
  desktop: { label: "Desktop", color: "#ffffff" },
  mobile: { label: "Mobile", color: "#a3a3a3" },
  tablet: { label: "Tablet", color: "#525252" },
};

const usersPerDayChartConfig = {
  users: { label: "Users", color: "#ffffff" },
};

interface OverviewCardProps {
  totalVisitors: number | string;
  visitorGrowth: string;
  usersPerDay: { day: string; users: number }[];
  deviceCategoryData: { name: string; value: number; fill: string }[];
}

function MetricChart({ data }: { data: { day: string; users: number }[] }) {
  return (
    <ChartContainer
      config={usersPerDayChartConfig}
      className="aspect-auto h-20 w-full"
    >
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="users" stroke="#ffffff" strokeWidth={2} fill="url(#usersGradient)" />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
      </AreaChart>
    </ChartContainer>
  );
}

export function OverviewCard({ totalVisitors, visitorGrowth, usersPerDay, deviceCategoryData }: OverviewCardProps) {
  // Compute percentages for devices
  const totalDevices = deviceCategoryData.reduce((acc, curr) => acc + curr.value, 0);
  const formattedDevices = deviceCategoryData.map(d => ({
    ...d,
    percentage: totalDevices > 0 ? Math.round((d.value / totalDevices) * 100) : 0
  }));

  return (
    <Card className="bg-[#121215]/80 backdrop-blur-md border-white/10 shadow-xl rounded-2xl h-full flex flex-col">
      <CardHeader className="pb-2 flex-none">
        <div>
          <p className="text-white/40 pb-2 text-[10px] tracking-wider uppercase font-medium">
            Users in last 30 days
          </p>
          <p className="text-3xl leading-none font-bold text-white tracking-tight">{totalVisitors.toLocaleString()}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <MetricChart data={usersPerDay} />
          <div className="mt-3 flex items-center gap-1.5 text-xs bg-white/10 text-white border border-white/20 px-2 py-1 rounded-full w-fit">
            <TrendingUp className="size-3.5" />
            <span className="font-semibold">{visitorGrowth}</span>
            <span className="text-white/70 font-medium">vs previous 30 days</span>
          </div>
        </div>

        <div className="border-white/10 mt-auto border-t pt-5">
          <p className="text-white/40 text-[10px] tracking-wider uppercase font-medium text-center">
            Device category
          </p>

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
            {formattedDevices.map((device) => (
              <div key={device.name} className="text-center">
                <p className="text-white/60 flex items-center justify-center gap-1.5 text-[10px] tracking-wide uppercase font-semibold">
                  <span className="size-2 rounded-full shadow-sm" style={{ backgroundColor: device.fill }} />
                  {device.name}
                </p>
                <p className="text-white mt-1.5 leading-none font-bold tabular-nums">
                  {device.percentage}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
