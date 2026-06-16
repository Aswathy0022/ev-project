"use client";

import { useState } from "react";
import { Map, Navigation, ArrowRight, MapPin, Zap } from "lucide-react";
import { toast } from "sonner";
import { predict, trips, geocode, vehicles, type TripResult, type Vehicle } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { DecisionBanner } from "@/components/ui/DecisionBanner";
import { Slider } from "@/components/ui/Slider";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatKm, formatMinutes } from "@/lib/utils";
import { useEffect } from "react";

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

export default function TripPlannerPage() {
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [battery, setBattery] = useState(70);
  const [health, setHealth] = useState(90);
  const [temperature, setTemperature] = useState(28);
  const [weather, setWeather] = useState("Clear");
  const [terrain, setTerrain] = useState("City roads");
  const [traffic, setTraffic] = useState("Moderate traffic");
  const [safetyBuffer, setSafetyBuffer] = useState(15);
  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vehicles.list().then((v) => {
      setVehicleList(v);
      if (v.length > 0) setSelectedVehicle(v[0]);
    }).catch(() => {});
    geocode.cities().then(setCities).catch(() => {});
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
      const rangeRes = await predict.range({
        battery_level: battery, temperature, weather, battery_health: health,
        vehicle_base_range_km: selectedVehicle.base_range_km, terrain, traffic,
      });
      const tripRes = await trips.evaluate({
        current_lat: originGeo.lat!, current_lon: originGeo.lon!,
        destination_lat: destGeo.lat!, destination_lon: destGeo.lon!,
        predicted_range_km: rangeRes.predicted_range_km,
        safety_buffer_percent: safetyBuffer,
      });
      setResult(tripRes);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Trip planning failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trip Planner</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Check if your battery can make the journey</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Form */}
        <Card className="space-y-5">
          {/* Route inputs */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Route</h3>
            {/* datalist for city autocomplete */}
            <datalist id="trip-cities">
              {cities.map((c) => <option key={c} value={c} />)}
            </datalist>
            <div className="relative flex flex-col gap-2">
              <Input
                label="From"
                placeholder="Chennai, Coimbatore, or 13.08, 80.27"
                icon={<Navigation className="h-4 w-4" />}
                list="trip-cities"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-white/8" />
                <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
                <div className="h-px flex-1 bg-white/8" />
              </div>
              <Input
                label="To"
                placeholder="Destination city or coordinates"
                icon={<MapPin className="h-4 w-4" />}
                list="trip-cities"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          <div className="h-px bg-white/8" />

          {/* Vehicle & Battery */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Vehicle</h3>
            <Select
              label="Vehicle"
              value={selectedVehicle?.name ?? ""}
              onChange={(e) => setSelectedVehicle(vehicleList.find((v) => v.name === e.target.value) ?? null)}
              options={vehicleList.map((v) => ({ value: v.name, label: v.name }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Slider label="Battery" value={battery} min={0} max={100} unit="%" onChange={setBattery} />
              <Slider label="Health" value={health} min={60} max={100} unit="%" onChange={setHealth} />
            </div>
          </div>

          <div className="h-px bg-white/8" />

          {/* Conditions */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Conditions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Weather" value={weather} onChange={(e) => setWeather(e.target.value)} options={WEATHER_OPTIONS} />
              <Select label="Terrain" value={terrain} onChange={(e) => setTerrain(e.target.value)} options={TERRAINS} />
              <Select label="Traffic" value={traffic} onChange={(e) => setTraffic(e.target.value)} options={TRAFFIC_OPTIONS} />
              <Slider label="Temp" value={temperature} min={-10} max={50} unit="°C" onChange={setTemperature} />
            </div>
            <Slider label="Safety buffer" value={safetyBuffer} min={5} max={30} unit="%" onChange={setSafetyBuffer} />
          </div>

          <Button onClick={handlePlan} loading={loading} size="lg" className="w-full">
            <Map className="h-4 w-4" />
            Plan trip
          </Button>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <MetricCard label="Trip Distance" value={formatKm(result.trip_distance_km)} icon={Map} color="accent" />
              <MetricCard
                label="Range Needed"
                value={formatKm(result.needed_range_km)}
                icon={Zap}
                color={result.remaining_range_km >= 0 ? "success" : "danger"}
                subtext={`Remaining after trip: ${formatKm(result.remaining_range_km)}`}
              />

              {result.backup_station && (
                <Card>
                  <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Nearest Charger</h3>
                  <p className="font-medium text-sm">{result.backup_station.name}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="accent">{formatKm(result.backup_station.distance_km)} away</Badge>
                    <Badge variant="default">{formatMinutes(result.backup_station.wait_minutes)} wait</Badge>
                    <Badge variant="success">{result.backup_station.rate_kw} kW</Badge>
                    <Badge variant={result.backup_station.free_slots > 0 ? "success" : "danger"}>
                      {result.backup_station.free_slots} slots
                    </Badge>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <Map className="h-8 w-8 text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">Enter your route and tap Plan trip</p>
            </Card>
          )}
        </div>
      </div>

      {result && (
        <DecisionBanner decision={result.decision} detail={result.detail} />
      )}
    </div>
  );
}
