"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, ShieldAlert, Zap, MapPin, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type StationAdmin, type StationIn, type CityAdmin, type CityIn } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

const EMPTY_STATION: StationIn = {
  station_name: "", city: "", latitude: 0, longitude: 0,
  free_slots: 2, total_slots: 4, wait_minutes: 10, rate_kw: 30, load_kw: 15, status: "Available",
};

function CityForm({
  initial, onSave, onCancel, loading,
}: {
  initial: CityIn; onSave: (data: CityIn) => Promise<void>; onCancel: () => void; loading: boolean;
}) {
  const [form, setForm] = useState<CityIn>(initial);
  const set = (field: keyof CityIn) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };
  const validate = (): string | null => {
    if (!form.name.trim()) return "Lookup key required";
    if (!form.display_name.trim()) return "Display name required";
    if (!form.lat || !form.lon) return "Coordinates required";
    return null;
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4 border border-green-500/20">
      <h3 className="text-sm font-semibold text-green-600">Edit City</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Lookup key (lowercase)" value={form.name} onChange={set("name")} placeholder="bengaluru" />
        <Input label="Display name" value={form.display_name} onChange={set("display_name")} placeholder="Bengaluru, Karnataka, India" />
        <Input label="Latitude" type="number" step="0.0001" value={form.lat} onChange={set("lat")} placeholder="12.9716" />
        <Input label="Longitude" type="number" step="0.0001" value={form.lon} onChange={set("lon")} placeholder="77.5946" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={() => { const err = validate(); if (err) { toast.error(err); return; } onSave(form); }} loading={loading} size="sm">
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  );
}

function StationForm({
  initial,
  onSave,
  onCancel,
  loading,
  cities,
}: {
  initial: StationIn;
  onSave: (data: StationIn) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  cities: CityAdmin[];
}) {
  const [form, setForm] = useState<StationIn>(initial);
  const set = (field: keyof StationIn) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const validateStation = (): string | null => {
    if (!form.station_name.trim()) return "Station name required";
    if (!form.city) return "City required";
    if (form.total_slots < 1) return "Total slots must be ≥ 1";
    if (form.free_slots > form.total_slots) return "Free slots cannot exceed total slots";
    return null;
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4 border border-green-500/20">
      <h3 className="text-sm font-semibold text-green-600">
        {initial.station_name ? "Edit Station" : "Add New Station"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Station name" value={form.station_name} onChange={set("station_name")} placeholder="Chennai Central Fast Charge" />
        <Select
          label="City"
          value={form.city}
          onChange={set("city")}
          options={cities.map((c) => ({ value: c.name, label: c.display_name }))}
        />
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
        <Button onClick={() => { const err = validateStation(); if (err) { toast.error(err); return; } onSave(form); }} loading={loading} size="sm">
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
  const [tab, setTab] = useState<"stations" | "cities">("stations");

  // Stations state
  const [stations, setStations] = useState<StationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: "station" | "city"; id: number } | null>(null);

  // Cities state
  const [cities, setCities] = useState<CityAdmin[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [editCityId, setEditCityId] = useState<number | null>(null);
  const [savingCity, setSavingCity] = useState(false);

  const load = () =>
    adminApi.listStations().then(setStations).catch(() => {}).finally(() => setLoading(false));

  const loadCities = () =>
    adminApi.listCities().then(setCities).catch(() => {}).finally(() => setCitiesLoading(false));

  useEffect(() => {
    if (user?.is_admin) { load(); loadCities(); }
    else { setLoading(false); setCitiesLoading(false); }
  }, [user]);

  if (authLoading || loading || citiesLoading) {
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

  const handleUpdateCity = async (id: number, data: CityIn) => {
    setSavingCity(true);
    try {
      const updated = await adminApi.updateCity(id, data);
      setCities((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditCityId(null);
      toast.success("City updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingCity(false);
    }
  };

  const handleDeleteCity = async (id: number) => {
    try {
      await adminApi.deleteCity(id);
      setCities((prev) => prev.filter((c) => c.id !== id));
      setPendingDelete(null);
      toast.success("City deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
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

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteStation(id);
      setStations((prev) => prev.filter((s) => s.id !== id));
      setPendingDelete(null);
      toast.success("Station deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Admin: {user.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === "stations" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("stations")}
        >
          <Zap className="h-3.5 w-3.5" /> Stations ({stations.length})
        </Button>
        <Button
          variant={tab === "cities" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("cities")}
        >
          <MapPin className="h-3.5 w-3.5" /> Cities ({cities.length})
        </Button>
      </div>

      {/* ── Stations tab ── */}
      {tab === "stations" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setShowAdd(true); setEditId(null); }} size="sm">
              <Plus className="h-4 w-4" /> Add station
            </Button>
          </div>

          {showAdd && (
            <StationForm
              initial={EMPTY_STATION}
              onSave={handleAdd}
              onCancel={() => setShowAdd(false)}
              loading={saving}
              cities={cities}
            />
          )}

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
                  cities={cities}
                />
              ) : (
                <Card key={s.id} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 shrink-0">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{s.station_name}</p>
                      <Badge variant={s.status === "Available" ? "success" : s.status === "Busy" ? "warning" : "danger"}>
                        {s.status === "Available" && <CheckCircle2 className="h-3 w-3" />}
                        {s.status === "Busy" && <AlertCircle className="h-3 w-3" />}
                        {s.status === "Offline" && <XCircle className="h-3 w-3" />}
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
                  {pendingDelete?.type === "station" && pendingDelete.id === s.id ? (
                    <div className="flex gap-2 shrink-0 items-center">
                      <span className="text-xs text-red-400">Delete?</span>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>Yes</Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>No</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => { setEditId(s.id); setShowAdd(false); setPendingDelete(null); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setPendingDelete({ type: "station", id: s.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
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
      )}

      {/* ── Cities tab ── */}
      {tab === "cities" && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted)]">
            Cities used as an offline fallback cache for geocoding in charger finder and trip planner.
          </p>

          <div className="space-y-3">
            {cities.map((c) =>
              editCityId === c.id ? (
                <CityForm
                  key={c.id}
                  initial={{ name: c.name, display_name: c.display_name, lat: c.lat, lon: c.lon }}
                  onSave={(data) => handleUpdateCity(c.id, data)}
                  onCancel={() => setEditCityId(null)}
                  loading={savingCity}
                />
              ) : (
                <Card key={c.id} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 shrink-0">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.display_name}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      key: {c.name} · {c.lat.toFixed(4)}, {c.lon.toFixed(4)}
                    </p>
                  </div>
                  {pendingDelete?.type === "city" && pendingDelete.id === c.id ? (
                    <div className="flex gap-2 shrink-0 items-center">
                      <span className="text-xs text-red-400">Delete?</span>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteCity(c.id)}>Yes</Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>No</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => { setEditCityId(c.id); setPendingDelete(null); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setPendingDelete({ type: "city", id: c.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>
              )
            )}
            {cities.length === 0 && (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="h-8 w-8 text-[var(--muted)] mb-2" />
                <p className="text-sm text-[var(--muted)]">No cities yet.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
