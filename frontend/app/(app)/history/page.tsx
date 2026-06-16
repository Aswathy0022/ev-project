"use client";

import { useEffect, useState } from "react";
import { History, Zap, Clock, Battery, Star, Lock } from "lucide-react";
import Link from "next/link";
import { history, type HistoryEntry, type HistorySummary } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatMinutes } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([history.list(20), history.summary()])
      .then(([e, s]) => { setEntries(e); setSummary(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <Lock className="h-8 w-8 text-[var(--muted)]" />
        </div>
        <h2 className="text-xl font-bold">Sign in to view history</h2>
        <p className="text-sm text-[var(--muted)] max-w-xs">
          Your charging sessions are saved to your account. Sign in or create a free account.
        </p>
        <div className="flex gap-3">
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const chartData = entries.slice(0, 10).reverse().map((e) => ({
    name: e.session_time.slice(5, 10),
    energy: e.energy_drawn_kwh,
    battery: e.battery_percent,
  }));

  const weatherBadge = (w: string) => {
    if (w === "Rain" || w === "Storm") return "warning";
    if (w === "Clear") return "success";
    return "default";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Charging History</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Your past charging sessions</p>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Sessions" value={summary.sessions} icon={History} color="accent" />
          <MetricCard label="Energy Used" value={summary.energy_kwh} unit=" kWh" icon={Zap} color="success" />
          <MetricCard label="Avg Wait" value={formatMinutes(summary.avg_wait)} icon={Clock} color="warning" />
          <MetricCard label="Top Station" value={summary.favorite_station} icon={Star} color="default" />
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Energy per session (kWh)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="energy" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? "#00d4ff" : "rgba(0,212,255,0.4)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Session list */}
      {entries.length > 0 ? (
        <Card>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Recent Sessions</h3>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-white/5">
            {entries.map((e) => (
              <div key={e.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-medium truncate">{e.station_name}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{e.session_time.slice(0, 10)}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs font-mono font-semibold">{e.energy_drawn_kwh} kWh</p>
                  <p className="text-xs text-[var(--muted)] font-mono">{e.battery_percent}% · {formatMinutes(e.charge_minutes)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-white/8">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Station</th>
                  <th className="pb-3 pr-4 font-medium">Battery</th>
                  <th className="pb-3 pr-4 font-medium">Charge</th>
                  <th className="pb-3 pr-4 font-medium">Energy</th>
                  <th className="pb-3 font-medium">Weather</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4 text-[var(--muted)] text-xs whitespace-nowrap">{e.session_time.slice(0, 10)}</td>
                    <td className="py-3 pr-4 font-medium text-xs">{e.station_name}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Battery className="h-3 w-3 text-[var(--muted)]" />
                        <span className="font-mono text-xs">{e.battery_percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{formatMinutes(e.charge_minutes)}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{e.energy_drawn_kwh} kWh</td>
                    <td className="py-3">
                      <Badge variant={weatherBadge(e.weather) as "warning" | "success" | "default"}>
                        {e.weather}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-8 w-8 text-[var(--muted)] mb-2" />
          <p className="text-sm text-[var(--muted)]">No charging sessions yet</p>
        </Card>
      )}
    </div>
  );
}
