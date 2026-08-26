"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type BreakdownRow } from "@/lib/mock-data";
import { motion } from "motion/react";

interface BreakdownCardProps {
  title: string;
  rows: BreakdownRow[];
}

export function BreakdownCard({ title, rows }: BreakdownCardProps) {
  const maxRowValue =
    rows.length > 0 ? Math.max(...rows.map((row) => row.value)) : 0;

  return (
    <Card className="gap-2 bg-[#121215]/80 backdrop-blur-md border-white/10 shadow-xl rounded-2xl overflow-hidden hover:border-white/20 transition-colors duration-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white/90">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-white/40 mb-3 flex items-center justify-between text-[10px] tracking-wider uppercase font-medium">
          <span>{title}</span>
          <span>Visitors</span>
        </div>
        <div className="space-y-2">
          {rows.map((row, i) => {
            const pct = maxRowValue ? (row.value / maxRowValue) * 100 : 0;
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(255,255,255,0.08)" }}
                key={row.label}
                className="relative flex items-center justify-between overflow-hidden rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/5 cursor-default"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="bg-white/20 absolute inset-y-0 left-0 rounded-lg"
                  aria-hidden
                />
                <span className="text-white/90 relative truncate pr-2 font-medium z-10">
                  {row.label}
                </span>
                <span className="text-white relative font-semibold tabular-nums z-10">
                  {row.value.toLocaleString()}
                </span>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
