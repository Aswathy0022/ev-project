"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ElevationPoint } from "@/lib/api";

export function ElevationChart({ data, height = 180 }: { data: ElevationPoint[] | null; height?: number }) {
  if (!data || data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="distance_km"
          tickFormatter={(v: number) => `${v.toFixed(0)}km`}
          tick={{ fontSize: 10, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `${v.toFixed(0)}m`}
          tick={{ fontSize: 10, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value) => [`${value} m`, "Elevation"]}
          labelFormatter={(label) => `${label} km`}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="elevation_m"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#elevationFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
