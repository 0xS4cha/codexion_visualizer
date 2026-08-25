"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type BreakdownRow } from "@/lib/mock-data";

interface BreakdownCardProps {
  title: string;
  rows: BreakdownRow[];
}

export function BreakdownCard({ title, rows }: BreakdownCardProps) {
  const maxRowValue =
    rows.length > 0 ? Math.max(...rows.map((row) => row.value)) : 0;

  return (
    <Card className="gap-2 bg-[#121215]/80 backdrop-blur-md border-white/10 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white/90">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-white/40 mb-3 flex items-center justify-between text-[10px] tracking-wider uppercase font-medium">
          <span>{title}</span>
          <span>Visitors</span>
        </div>
        <div className="space-y-2">
          {rows.map((row) => {
            const pct = maxRowValue ? (row.value / maxRowValue) * 100 : 0;
            return (
              <div
                key={row.label}
                className="relative flex items-center justify-between overflow-hidden rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/5"
              >
                <div
                  className="bg-white/20 absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
                <span className="text-white/90 relative truncate pr-2 font-medium z-10">
                  {row.label}
                </span>
                <span className="text-white relative font-semibold tabular-nums z-10">
                  {row.value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
