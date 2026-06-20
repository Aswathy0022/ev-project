"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, XCircle, Star, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { bookings, type Booking } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookingList, setBookingList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    bookings.list()
      .then(setBookingList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancelBooking = async (id: number) => {
    try {
      const updated = await bookings.cancel(id);
      setBookingList((list) => list.map((b) => (b.id === id ? updated : b)));
      toast.success("Booking cancelled");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  const analytics = useMemo(() => {
    const confirmed = bookingList.filter((b) => b.status === "confirmed").length;
    const cancelled = bookingList.filter((b) => b.status === "cancelled").length;
    const stationCounts = bookingList.reduce<Record<string, number>>((acc, b) => {
      acc[b.station_name] = (acc[b.station_name] ?? 0) + 1;
      return acc;
    }, {});
    const topStation = Object.entries(stationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const stationChart = Object.entries(stationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
    return { confirmed, cancelled, topStation, stationChart };
  }, [bookingList]);

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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5">
          <Lock className="h-8 w-8 text-[var(--muted)]" />
        </div>
        <h2 className="text-xl font-bold">Sign in to view history</h2>
        <p className="text-sm text-[var(--muted)] max-w-xs">
          Track your charging slot bookings. Sign in or create a free account.
        </p>
        <div className="flex gap-3">
          <Link href="/login"><Button>Sign in</Button></Link>
          <Link href="/signup"><Button variant="secondary">Create account</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Your charging slot bookings</p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Bookings" value={bookingList.length} icon={CalendarClock} color="default" />
        <MetricCard label="Confirmed" value={analytics.confirmed} icon={CheckCircle2} color="success" />
        <MetricCard label="Cancelled" value={analytics.cancelled} icon={XCircle} color="warning" />
        <MetricCard label="Top Station" value={analytics.topStation} icon={Star} color="accent" />
      </div>

      {/* Bookings per station chart */}
      {analytics.stationChart.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Bookings by Station</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics.stationChart} margin={{ left: -20, right: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: "rgba(16,35,26,0.04)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {analytics.stationChart.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#16a34a" : "rgba(22,163,74,0.4)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Booking details */}
      {bookingList.length > 0 ? (
        <Card>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Charging Slot Bookings</h3>

          <div className="sm:hidden divide-y divide-black/5">
            {bookingList.map((b) => (
              <div key={b.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-medium truncate">{b.station_name}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{new Date(b.slot_start).toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <Badge variant={b.status === "confirmed" ? "success" : "default"}>{b.status}</Badge>
                  {b.status === "confirmed" && (
                    <Button size="sm" variant="secondary" onClick={() => handleCancelBooking(b.id)}>
                      <XCircle className="h-3 w-3" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-black/8">
                  <th className="pb-3 pr-4 font-medium">Station</th>
                  <th className="pb-3 pr-4 font-medium">Start</th>
                  <th className="pb-3 pr-4 font-medium">End</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {bookingList.map((b) => (
                  <tr key={b.id} className="hover:bg-black/2 transition-colors">
                    <td className="py-3 pr-4 font-medium text-xs">{b.station_name}</td>
                    <td className="py-3 pr-4 text-[var(--muted)] text-xs whitespace-nowrap">{new Date(b.slot_start).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-[var(--muted)] text-xs whitespace-nowrap">{new Date(b.slot_end).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={b.status === "confirmed" ? "success" : "default"}>{b.status}</Badge>
                    </td>
                    <td className="py-3">
                      {b.status === "confirmed" && (
                        <Button size="sm" variant="secondary" onClick={() => handleCancelBooking(b.id)}>
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarClock className="h-8 w-8 text-[var(--muted)] mb-2" />
          <p className="text-sm text-[var(--muted)]">No charging slot bookings yet</p>
          <p className="text-xs text-[var(--muted)] mt-1">Book a slot from Find Chargers or Trip Planner</p>
        </Card>
      )}
    </div>
  );
}
