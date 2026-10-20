"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatsRow } from "@/types/stats";
import { countryFlag } from "@/lib/worldStats";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakdownCardProps {
  title: string;
  rows: StatsRow[];
  limit?: number;
  highlightedCode?: string | null;
  selectedCode?: string | null;
  onRowHover?: (row: StatsRow | null) => void;
  onRowClick?: (row: StatsRow) => void;
}

export function BreakdownCard({
  title,
  rows,
  limit = 5,
  highlightedCode,
  selectedCode,
  onRowHover,
  onRowClick,
}: BreakdownCardProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, limit);
  const maxRowValue =
    rows.length > 0 ? Math.max(...rows.map((row) => row.value)) : 0;
  const interactive = Boolean(onRowClick);

  return (
    <Card className="gap-2 h-full bg-[#121215]/80 backdrop-blur-md border-white/10 shadow-xl rounded-2xl overflow-hidden hover:border-white/20 transition-colors duration-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white/90">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col">
        <div className="text-white/40 mb-3 flex items-center justify-between text-[10px] tracking-wider uppercase font-medium">
          <span>{title}</span>
          <span>Visits</span>
        </div>
        {rows.length === 0 && (
          <p className="text-white/30 text-xs py-6 text-center">No data for this period</p>
        )}
        <div className={cn("space-y-2", expanded && "max-h-80 overflow-y-auto pr-1")}>
          {visibleRows.map((row, i) => {
            const pct = maxRowValue ? (row.value / maxRowValue) * 100 : 0;
            const active = Boolean(row.code) && (row.code === highlightedCode || row.code === selectedCode);
            const flag = countryFlag(row.code);
            const Row = interactive ? motion.button : motion.div;
            return (
              <Row
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 5) * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(255,255,255,0.08)" }}
                key={`${row.code ?? ""}-${row.label}`}
                onMouseEnter={() => onRowHover?.(row)}
                onMouseLeave={() => onRowHover?.(null)}
                onFocus={() => onRowHover?.(row)}
                onBlur={() => onRowHover?.(null)}
                onClick={() => onRowClick?.(row)}
                {...(interactive ? { type: "button" as const, "aria-pressed": row.code === selectedCode } : {})}
                className={cn(
                  "relative w-full flex items-center justify-between overflow-hidden rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/5 text-left",
                  interactive ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40" : "cursor-default",
                  active && "border-white/40 bg-white/10"
                )}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.2 + Math.min(i, 5) * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="bg-white/20 absolute inset-y-0 left-0 rounded-lg"
                  aria-hidden
                />
                <span className="text-white/90 relative truncate pr-2 font-medium z-10 flex items-center gap-2">
                  {flag && <span aria-hidden>{flag}</span>}
                  {row.label}
                </span>
                <span className="text-white relative font-semibold tabular-nums z-10">
                  {row.value.toLocaleString()}
                </span>
              </Row>
            );
          })}
        </div>
        {rows.length > limit && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 self-center flex items-center gap-1 text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {expanded ? "Show less" : `Show all ${rows.length}`}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
