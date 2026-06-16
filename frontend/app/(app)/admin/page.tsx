"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, ShieldAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type StationAdmin, type StationIn } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

const EMPTY_FORM: StationIn = {
  station_name: "", city: "", latitude: 0, longitude: 0,
  free_slots: 2, total_slots: 4, wait_minutes: 10, rate_kw: 30, load_kw: 15, status: "Available",
};

function StationForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: StationIn;
  onSave: (data: StationIn) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<StationIn>(initial);
  const set = (field: keyof StationIn) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4 border border-cyan-500/20">
      <h3 className="text-sm font-semibold text-cyan-400">
        {initial.station_name ? "Edit Station" : "Add New Station"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Station name" value={form.station_name} onChange={set("station_name")} placeholder="Chennai Central Fast Charge" />
        <Input label="City" value={form.city} onChange={set("city")} placeholder="Chennai" />
        <Input label="Latitude" type="number" step="0.0001" value={form.latitude} onChange={set("latitude")} placeholder="13.0827" />
        <Input label="Longitude" type="number" step="0.0001" value={form.longitude} onChange={set("longitude")} placeholder="80.2707" />
        <Input label="Free slots" type="number" min={0} value={form.free_slots} onChange={set("free_slots")} />
        <Input label="Total slots" type="number" min={1} value={form.total_slots} onChange={set("total_slots")} />
        <Input label="Wait time (min)" type="number" min={0} value={form.wait_minutes} onChange={set("wait_minutes")} />
        <Input label="Rate (kW)" type="number" min={1} value={form.rate_kw} onChange={set("rate_kw")} />
        <Input label="Load (kW)" type="number" min={0} value={form.load_kw} onChange={set("load_kw")} />
        <Select
          label="Status"
          value={form.status}
          onChange={set("status")}
          options={[
            { value: "Available", label: "Available" },
            { value: "Busy", label: "Busy" },
            { value: "Offline", label: "Offline" },
          ]}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSave(form)} loading={loading} size="sm">
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stations, setStations] = useState<StationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    adminApi.listStations().then(setStations).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => {
    if (user?.is_admin) load();
    else setLoading(false);
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  if (!user?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <ShieldAlert className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold">Admin only</h2>
        <p className="text-sm text-[var(--muted)]">Sign in as admin to manage stations.</p>
        <Link href="/login"><Button>Sign in</Button></Link>
      </div>
    );
  }

  const handleAdd = async (data: StationIn) => {
    setSaving(true);
    try {
      const created = await adminApi.createStation(data);
      setStations((prev) => [...prev, created]);
      setShowAdd(false);
      toast.success(`Station "${created.station_name}" added`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add station");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, data: StationIn) => {
    setSaving(true);
    try {
      const updated = await adminApi.updateStation(id, data);
      setStations((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditId(null);
      toast.success("Station updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete station "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteStation(id);
      setStations((prev) => prev.filter((s) => s.id !== id));
      toast.success("Station deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Station Manager</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {stations.length} stations · Admin: {user.name}
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditId(null); }} size="sm">
          <Plus className="h-4 w-4" /> Add station
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <StationForm
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={saving}
        />
      )}

      {/* Station list */}
      <div className="space-y-3">
        {stations.map((s) =>
          editId === s.id ? (
            <StationForm
              key={s.id}
              initial={{
                station_name: s.station_name, city: s.city,
                latitude: s.latitude, longitude: s.longitude,
                free_slots: s.free_slots, total_slots: s.total_slots,
                wait_minutes: s.wait_minutes, rate_kw: s.rate_kw,
                load_kw: s.load_kw, status: s.status,
              }}
              onSave={(data) => handleUpdate(s.id, data)}
              onCancel={() => setEditId(null)}
              loading={saving}
            />
          ) : (
            <Card key={s.id} className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 shrink-0">
                <Zap className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{s.station_name}</p>
                  <Badge variant={s.status === "Available" ? "success" : s.status === "Busy" ? "warning" : "danger"}>
                    {s.status}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {s.city} · {s.rate_kw} kW · {s.free_slots}/{s.total_slots} slots · {s.wait_minutes} min wait
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="secondary" size="sm"
                  onClick={() => { setEditId(s.id); setShowAdd(false); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="danger" size="sm"
                  onClick={() => handleDelete(s.id, s.station_name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )
        )}

        {stations.length === 0 && !showAdd && (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-8 w-8 text-[var(--muted)] mb-2" />
            <p className="text-sm text-[var(--muted)]">No stations yet. Add one above.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
