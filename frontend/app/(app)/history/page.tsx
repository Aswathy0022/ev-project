"use client";

import { useEffect, useState } from "react";
import { History, Zap, Clock, Battery, Star, Lock, Route, Gauge } from "lucide-react";
import Link from "next/link";
import { history, predictions, type HistoryEntry, type HistorySummary, type PredictionEntry } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatMinutes, formatKm } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Tab = "predictions" | "charging";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("predictions");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [preds, setPreds] = useState<PredictionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([history.list(20), history.summary(), predictions.list(20)])
      .then(([e, s, p]) => { setEntries(e); setSummary(s); setPreds(p); })
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
          Track your range predictions and charging sessions. Sign in or create a free account.
        </p>
        <div className="flex gap-3">
          <Link href="/login"><Button>Sign in</Button></Link>
          <Link href="/signup"><Button variant="secondary">Create account</Button></Link>
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

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-400" : s >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Your predictions and charging sessions</p>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Predictions" value={preds.length} icon={Route} color="accent" />
          <MetricCard label="Charging Sessions" value={summary.sessions} icon={History} color="default" />
          <MetricCard label="Energy Used" value={summary.energy_kwh} unit=" kWh" icon={Zap} color="success" />
          <MetricCard label="Top Station" value={summary.favorite_station} icon={Star} color="warning" />
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-white/4 p-1 w-fit">
        {([
          { id: "predictions" as Tab, label: "Range Predictions", icon: Route },
          { id: "charging" as Tab, label: "Charging Sessions", icon: Battery },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-white/10 text-foreground shadow-sm"
                : "text-[var(--muted)] hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Prediction history tab */}
      {activeTab === "predictions" && (
        <>
          {preds.length > 0 ? (
            <Card>
              <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Recent Predictions</h3>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-white/5">
                {preds.map((p) => (
                  <div key={p.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-medium truncate">{p.vehicle_name}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{p.predicted_at.slice(0, 10)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-cyan-400">{formatKm(p.predicted_range_km)}</p>
                        <p className={`text-xs font-mono ${scoreColor(p.performance_score)}`}>{p.performance_score}/100</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="default">{p.battery_level}% battery</Badge>
                      <Badge variant={weatherBadge(p.weather) as "warning" | "success" | "default"}>{p.weather}</Badge>
                      <Badge variant="default">{p.terrain}</Badge>
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
                      <th className="pb-3 pr-4 font-medium">Vehicle</th>
                      <th className="pb-3 pr-4 font-medium">Battery</th>
                      <th className="pb-3 pr-4 font-medium">Conditions</th>
                      <th className="pb-3 pr-4 font-medium">Predicted Range</th>
                      <th className="pb-3 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {preds.map((p) => (
                      <tr key={p.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 pr-4 text-[var(--muted)] text-xs whitespace-nowrap">{p.predicted_at.slice(0, 10)}</td>
                        <td className="py-3 pr-4 font-medium text-xs">{p.vehicle_name}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <Battery className="h-3 w-3 text-[var(--muted)]" />
                            <span className="font-mono text-xs">{p.battery_level}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant={weatherBadge(p.weather) as "warning" | "success" | "default"}>{p.weather}</Badge>
                            <Badge variant="default">{p.ride_mode}</Badge>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-cyan-400 font-semibold">{formatKm(p.predicted_range_km)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-[var(--muted)]" />
                            <span className={`font-mono text-xs font-semibold ${scoreColor(p.performance_score)}`}>{p.performance_score}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <Route className="h-8 w-8 text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">No predictions yet</p>
              <p className="text-xs text-[var(--muted)] mt-1">Run a range prediction from Battery Check to see it here</p>
              <Link href="/dashboard" className="mt-4">
                <Button size="sm" variant="secondary">Check battery</Button>
              </Link>
            </Card>
          )}
        </>
      )}

      {/* Charging history tab */}
      {activeTab === "charging" && (
        <>
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

          {entries.length > 0 ? (
            <Card>
              <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Recent Sessions</h3>

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
                          <Badge variant={weatherBadge(e.weather) as "warning" | "success" | "default"}>{e.weather}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-8 w-8 text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">No charging sessions yet</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
