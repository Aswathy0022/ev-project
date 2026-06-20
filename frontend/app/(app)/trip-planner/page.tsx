"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Map, Navigation, ArrowRight, MapPin, Zap, Pencil, Clock, Mountain, BatteryCharging, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { predict, trips, geocode, vehicles, bookings, weather as weatherApi, type TripResult, type Vehicle, type ChargingStop } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { DecisionBanner } from "@/components/ui/DecisionBanner";
import { Slider } from "@/components/ui/Slider";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ElevationChart } from "@/components/ui/ElevationChart";
import type { MapMarker } from "@/components/ui/MapView";
import { formatKm, formatMinutes } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const MapView = dynamic(() => import("@/components/ui/MapView").then((m) => m.MapView), { ssr: false });

const STOP_DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

function ChargingStopRow({ stop }: { stop: ChargingStop }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slotStart, setSlotStart] = useState("");
  const [duration, setDuration] = useState("60");
  const [submitting, setSubmitting] = useState(false);

  const handleBookClick = () => {
    if (!user) {
      toast.error("Sign in to book a charging slot");
      router.push("/login");
      return;
    }
    setOpen((o) => !o);
  };

  const handleConfirmBooking = async () => {
    if (!slotStart) {
      toast.error("Pick a start time");
      return;
    }
    setSubmitting(true);
    try {
      const start = new Date(slotStart);
      const end = new Date(start.getTime() + Number(duration) * 60_000);
      await bookings.create(stop.station_id, start.toISOString(), end.toISOString());
      toast.success(`Slot booked at ${stop.name}`);
      setOpen(false);
      setSlotStart("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/8 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{stop.name}</p>
          <p className="text-xs text-[var(--muted)]">{formatKm(stop.distance_km)} along route</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="default">{formatMinutes(stop.wait_minutes)} wait</Badge>
          <Badge variant="success">{stop.rate_kw} kW</Badge>
          <Badge variant={stop.free_slots > 0 ? "success" : "danger"}>{stop.free_slots} slots</Badge>
          <Button size="sm" variant="secondary" disabled={stop.free_slots <= 0} onClick={handleBookClick}>
            <CalendarClock className="h-3.5 w-3.5" />
            Book slot
          </Button>
        </div>
      </div>
      {open && (
        <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-black/8">
          <Input
            type="datetime-local"
            label="Start time"
            value={slotStart}
            onChange={(e) => setSlotStart(e.target.value)}
          />
          <Select
            label="Duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            options={STOP_DURATION_OPTIONS}
          />
          <Button size="sm" loading={submitting} onClick={handleConfirmBooking}>
            Confirm booking
          </Button>
        </div>
      )}
    </div>
  );
}

const WEATHER_OPTIONS = [
  { value: "Clear", label: "☀️ Clear" },
  { value: "Cloudy", label: "⛅ Cloudy" },
  { value: "Rain", label: "🌧️ Rain" },
  { value: "Storm", label: "⛈️ Storm" },
];
const TERRAINS = [
  { value: "City roads", label: "🏙️ City roads" },
  { value: "Highway", label: "🛣️ Highway" },
  { value: "Hill roads", label: "⛰️ Hill roads" },
  { value: "Rough roads", label: "🪨 Rough roads" },
];
const TRAFFIC_OPTIONS = [
  { value: "Light traffic", label: "🟢 Light" },
  { value: "Moderate traffic", label: "🟡 Moderate" },
  { value: "Heavy traffic", label: "🔴 Heavy" },
];

// E: read shared state from localStorage (same keys as dashboard)
function getSaved(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  return v !== null ? Number(v) : fallback;
}

export default function TripPlannerPage() {
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [originCities, setOriginCities] = useState<string[]>([]);
  const [destCities, setDestCities] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const debouncedOrigin = useDebouncedValue(origin, 400);
  const debouncedDestination = useDebouncedValue(destination, 400);
  // E: initialize from shared localStorage keys set by dashboard
  const [battery, setBattery] = useState(70);
  const [health, setHealth] = useState(90);
  const [temperature, setTemperature] = useState(28);
  const [weather, setWeather] = useState("Clear");
  const [terrain, setTerrain] = useState("City roads");
  const [traffic, setTraffic] = useState("Moderate traffic");
  const [safetyBuffer, setSafetyBuffer] = useState(15);
  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{ origin: [number, number]; destination: [number, number] } | null>(null);
  const [activeTab, setActiveTab] = useState<"vehicle" | "conditions">("vehicle");
  const [formCollapsed, setFormCollapsed] = useState(false);

  useEffect(() => {
    vehicles.list().then((v) => {
      setVehicleList(v);
      if (v.length > 0) {
        // E: also restore vehicle selection
        const savedName = localStorage.getItem("voltiq-vehicle");
        const saved = savedName ? v.find((x) => x.name === savedName) : null;
        setSelectedVehicle(saved ?? v[0]);
      }
    }).catch(() => {});
    geocode.cities().then((c) => { setOriginCities(c); setDestCities(c); }).catch(() => {});
  }, []);

  useEffect(() => {
    const q = debouncedOrigin.trim();
    if (q.length < 2) return;
    geocode.suggest(q).then(setOriginCities).catch(() => {});
  }, [debouncedOrigin]);

  useEffect(() => {
    const q = debouncedDestination.trim();
    if (q.length < 2) return;
    geocode.suggest(q).then(setDestCities).catch(() => {});
  }, [debouncedDestination]);

  // Sync from localStorage after mount — avoids SSR/client hydration mismatch
  useEffect(() => {
    setBattery(getSaved("voltiq-battery", 70));
    setHealth(getSaved("voltiq-health", 90));
  }, []);

  const handlePlan = async () => {
    if (!selectedVehicle || !origin.trim() || !destination.trim()) {
      toast.error("Enter origin, destination, and select a vehicle");
      return;
    }
    setLoading(true);
    try {
      const [originGeo, destGeo] = await Promise.all([
        geocode.search(origin),
        geocode.search(destination),
      ]);
      if (!originGeo.lat || !destGeo.lat) {
        toast.error(`Could not find: ${!originGeo.lat ? origin : destination}`);
        return;
      }
      setRouteCoords({ origin: [originGeo.lat, originGeo.lon!], destination: [destGeo.lat, destGeo.lon!] });

      // Auto-fill conditions from real weather at the origin — user edits in the
      // Conditions tab still take effect on the next "Plan trip" click.
      let effectiveTemperature = temperature;
      let effectiveWeather = weather;
      try {
        const originWeather = await weatherApi.current(originGeo.lat, originGeo.lon!);
        effectiveTemperature = Math.round(originWeather.temperature_c);
        effectiveWeather = originWeather.condition;
        setTemperature(effectiveTemperature);
        setWeather(effectiveWeather);
      } catch {
        // Weather lookup is best-effort — fall back to current manual conditions.
      }

      const rangeRes = await predict.range({
        battery_level: battery, temperature: effectiveTemperature, weather: effectiveWeather, battery_health: health,
        vehicle_base_range_km: selectedVehicle.base_range_km,
        vehicle_name: selectedVehicle.name,
        terrain, traffic,
      });
      const tripRes = await trips.evaluate({
        current_lat: originGeo.lat!, current_lon: originGeo.lon!,
        destination_lat: destGeo.lat!, destination_lon: destGeo.lon!,
        predicted_range_km: rangeRes.predicted_range_km,
        safety_buffer_percent: safetyBuffer,
      });
      setResult(tripRes);
      setFormCollapsed(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Trip planning failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "vehicle", label: "Vehicle & Battery" },
    { id: "conditions", label: "Conditions" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trip Planner</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Check if your battery can make the journey</p>
      </div>

      <div className="grid gap-6">
        {/* Form — collapses to a summary once a result exists, so the result gets the room */}
        {formCollapsed && result ? (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{origin}</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--muted)]" />
              <span className="font-medium">{destination}</span>
              <span className="text-[var(--muted)]">· {selectedVehicle?.name} · {battery}% battery</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setFormCollapsed(false)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Card>
        ) : (
        <Card className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Route</h3>
            <datalist id="trip-cities-origin">
              {Array.from(new Set(originCities)).map((c) => <option key={c} value={c} />)}
            </datalist>
            <datalist id="trip-cities-destination">
              {Array.from(new Set(destCities)).map((c) => <option key={c} value={c} />)}
            </datalist>
            <div className="relative flex flex-col gap-2">
              <Input
                label="From"
                placeholder="Chennai, Coimbatore, or 13.08, 80.27"
                icon={<Navigation className="h-4 w-4" />}
                list="trip-cities-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-black/8" />
                <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
                <div className="h-px flex-1 bg-black/8" />
              </div>
              <Input
                label="To"
                placeholder="Destination city or coordinates"
                icon={<MapPin className="h-4 w-4" />}
                list="trip-cities-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          <div className="h-px bg-black/8" />

          {/* Tabs — collapse Vehicle/Battery + Conditions so defaults stay out of the way */}
          <div className="flex gap-1 rounded-xl bg-black/4 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === t.id
                    ? "bg-white text-foreground shadow-sm"
                    : "text-[var(--muted)] hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "vehicle" && (
            <div className="space-y-4">
              <Select
                label="Vehicle"
                value={selectedVehicle?.name ?? ""}
                onChange={(e) => setSelectedVehicle(vehicleList.find((v) => v.name === e.target.value) ?? null)}
                options={vehicleList.map((v) => ({ value: v.name, label: v.name }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Battery" value={battery} min={0} max={100} unit="%" onChange={setBattery} />
                <Slider
                  label="Health"
                  value={health}
                  min={60}
                  max={100}
                  unit="%"
                  onChange={setHealth}
                  hint="Battery health degrades over time. Find in your vehicle app or estimate based on age."
                />
              </div>
            </div>
          )}

          {activeTab === "conditions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select label="Weather" value={weather} onChange={(e) => setWeather(e.target.value)} options={WEATHER_OPTIONS} />
                <Select label="Terrain" value={terrain} onChange={(e) => setTerrain(e.target.value)} options={TERRAINS} />
                <Select label="Traffic" value={traffic} onChange={(e) => setTraffic(e.target.value)} options={TRAFFIC_OPTIONS} />
                <Slider label="Temp" value={temperature} min={-10} max={50} unit="°C" onChange={setTemperature} />
              </div>
              <Slider
                label="Safety buffer"
                value={safetyBuffer}
                min={5}
                max={30}
                unit="%"
                onChange={setSafetyBuffer}
                hint="Extra range margin added on top of trip distance. 15% = if trip is 50 km, you need 57.5 km range. Higher = safer."
              />
            </div>
          )}

          <Button onClick={handlePlan} loading={loading} size="lg" className="w-full">
            <Map className="h-4 w-4" />
            Plan trip
          </Button>
        </Card>
        )}

        {/* Results — always below the form, compact grid so it fits in one screen */}
        <div className="space-y-4">
          {result ? (
            <>
              <DecisionBanner decision={result.decision} detail={result.detail} />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MetricCard label="Trip Distance" value={formatKm(result.trip_distance_km)} icon={Map} color="accent" />
                <MetricCard label="Travel Time" value={formatMinutes(result.duration_min)} icon={Clock} color="default" />
                <MetricCard
                  label="Range Needed"
                  value={formatKm(result.needed_range_km)}
                  icon={Zap}
                  color={result.remaining_range_km >= 0 ? "success" : "danger"}
                />
                <MetricCard
                  label="Remaining Range"
                  value={formatKm(result.remaining_range_km)}
                  icon={BatteryCharging}
                  color={result.remaining_range_km >= 0 ? "success" : "danger"}
                />
              </div>

              {routeCoords && (
                <Card className="p-0 overflow-hidden">
                  <MapView
                    height={320}
                    polyline={result.polyline ?? undefined}
                    markers={[
                      { position: routeCoords.origin, kind: "origin", popup: "From" },
                      { position: routeCoords.destination, kind: "destination", popup: "To" },
                      ...result.charging_stops.map((s): MapMarker => ({
                        position: [s.latitude, s.longitude],
                        kind: s.free_slots > 0 ? "stationAvailable" : "stationBusy",
                        popup: (
                          <div className="text-xs">
                            <p className="font-semibold">{s.name}</p>
                            <p>{formatKm(s.distance_km)} along route · {formatMinutes(s.wait_minutes)} wait</p>
                          </div>
                        ),
                      })),
                    ]}
                  />
                </Card>
              )}

              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <Card>
                  <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Recommended Charging Stops</h3>
                  {result.charging_stops.length > 0 ? (
                    <div className="space-y-3">
                      {result.charging_stops.map((s, i) => (
                        <ChargingStopRow key={`${s.station_id}-${i}`} stop={s} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--muted)]">No chargers found within range of this route.</p>
                  )}
                </Card>

                <Card>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                    <Mountain className="h-3.5 w-3.5" />
                    Elevation Profile
                  </h3>
                  {result.elevation_profile ? (
                    <ElevationChart data={result.elevation_profile} />
                  ) : (
                    <p className="text-xs text-[var(--muted)]">Elevation data unavailable for this route.</p>
                  )}
                </Card>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-10 text-center">
              <Map className="h-8 w-8 text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">Enter your route and tap Plan trip</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
