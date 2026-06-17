"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Route, Battery, BatteryCharging, AlertTriangle, TrendingDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import { predict, vehicles, type RangeResult, type Vehicle } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { DecisionBanner } from "@/components/ui/DecisionBanner";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Slider } from "@/components/ui/Slider";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { formatKm, formatMinutes } from "@/lib/utils";

const WEATHER_OPTIONS = [
  { value: "Clear", label: "Clear" },
  { value: "Cloudy", label: "Cloudy" },
  { value: "Rain", label: "Rain" },
  { value: "Storm", label: "Storm" },
];
const RIDE_MODES = [
  { value: "Eco", label: "Eco" },
  { value: "Normal", label: "Normal" },
  { value: "Sport", label: "Sport" },
];
const TERRAINS = [
  { value: "City roads", label: "City roads" },
  { value: "Highway", label: "Highway" },
  { value: "Hill roads", label: "Hill roads" },
  { value: "Rough roads", label: "Rough roads" },
];
const TRAFFIC_OPTIONS = [
  { value: "Light traffic", label: "Light traffic" },
  { value: "Moderate traffic", label: "Moderate traffic" },
  { value: "Heavy traffic", label: "Heavy traffic" },
];

function getSaved(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  return v !== null ? Number(v) : fallback;
}

const FACTOR_LABELS: Record<string, string> = {
  weather: "Weather",
  temperature: "Temperature",
  battery_health: "Battery health",
  ride_mode: "Ride mode",
  terrain: "Terrain",
  traffic: "Traffic",
  load: "Rider load",
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [battery, setBattery] = useState(65);
  const [health, setHealth] = useState(92);
  const [temperature, setTemperature] = useState(28);
  const [weather, setWeather] = useState("Clear");
  const [rideMode, setRideMode] = useState("Normal");
  const [terrain, setTerrain] = useState("City roads");
  const [traffic, setTraffic] = useState("Moderate traffic");
  const [weight, setWeight] = useState(70);
  const [luggage, setLuggage] = useState(0);
  const [result, setResult] = useState<RangeResult | null>(null);
  const [readiness, setReadiness] = useState<{ decision: string; detail: string } | null>(null);
  const [chargeTime80, setChargeTime80] = useState<number | null>(null);
  const [chargeTime100, setChargeTime100] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"battery" | "conditions" | "preferences">("battery");
  const [formCollapsed, setFormCollapsed] = useState(false);

  useEffect(() => {
    vehicles.list().then((v) => {
      setVehicleList(v);
      if (v.length > 0) {
        const savedName = localStorage.getItem("voltiq-vehicle");
        const saved = savedName ? v.find((x) => x.name === savedName) : null;
        setSelectedVehicle(saved ?? v[0]);
      }
    }).catch(() => {});
  }, []);

  // Sync from localStorage after mount — avoids SSR/client hydration mismatch
  useEffect(() => {
    setBattery(getSaved("voltiq-battery", 65));
    setHealth(getSaved("voltiq-health", 92));
  }, []);

  useEffect(() => { localStorage.setItem("voltiq-battery", String(battery)); }, [battery]);
  useEffect(() => { localStorage.setItem("voltiq-health", String(health)); }, [health]);
  useEffect(() => {
    if (selectedVehicle) localStorage.setItem("voltiq-vehicle", selectedVehicle.name);
  }, [selectedVehicle]);

  const handlePredict = async () => {
    if (!selectedVehicle) return;
    setLoading(true);
    try {
      const [rangeRes, ct80, ct100] = await Promise.all([
        predict.range({
          battery_level: battery, temperature, weather, battery_health: health,
          vehicle_base_range_km: selectedVehicle.base_range_km,
          vehicle_name: selectedVehicle.name,
          ride_mode: rideMode, terrain, traffic,
          rider_weight_kg: weight, luggage_kg: luggage,
        }),
        predict.chargeTime({ battery_level: battery, charging_rate_kw: 30, charging_load_kw: 20, battery_health: health, target_level: 80, charge_bias: selectedVehicle.fast_charge_bias }),
        predict.chargeTime({ battery_level: battery, charging_rate_kw: 30, charging_load_kw: 20, battery_health: health, target_level: 100, charge_bias: selectedVehicle.full_charge_bias }),
      ]);
      setResult(rangeRes);
      const rd = await predict.readiness(rangeRes.predicted_range_km);
      setReadiness(rd);
      setChargeTime80(ct80.charge_minutes);
      setChargeTime100(ct100.charge_minutes);
      setFormCollapsed(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Prediction failed — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "battery", label: "Battery" },
    { id: "conditions", label: "Conditions" },
    { id: "preferences", label: "Preferences" },
  ] as const;

  const significantFactors = result?.factors
    ? Object.entries(result.factors)
        .filter(([, v]) => Math.abs(v) > 0.5)
        .sort(([, a], [, b]) => a - b)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Battery Check</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Get your real-world range prediction</p>
      </div>

      <div className="grid gap-6">
        {/* Input Panel — collapses to a summary once a result exists, so the result gets the room */}
        {formCollapsed && result ? (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{selectedVehicle?.name}</span>
              <span className="text-[var(--muted)]">· {battery}% battery · {health}% health · {weather}, {terrain}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setFormCollapsed(false)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Card>
        ) : (
        <Card>
          {/* Vehicle selector */}
          <div className="mb-5">
            <Select
              label="Vehicle"
              value={selectedVehicle?.name ?? ""}
              onChange={(e) => setSelectedVehicle(vehicleList.find((v) => v.name === e.target.value) ?? null)}
              options={vehicleList.map((v) => ({ value: v.name, label: v.name }))}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-white/4 p-1 mb-5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === t.id
                    ? "bg-white/10 text-foreground shadow-sm"
                    : "text-[var(--muted)] hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "battery" && (
            <div className="space-y-5">
              <Slider label="Battery level" value={battery} min={0} max={100} unit="%" onChange={setBattery} />
              <Slider
                label="Battery health"
                value={health}
                min={60}
                max={100}
                unit="%"
                onChange={setHealth}
                hint="Battery health degrades over time. Find it in your vehicle's companion app, or estimate: 100% if under 1 year old, ~90% at 2 years, ~80% at 3–4 years."
              />
            </div>
          )}
          {activeTab === "conditions" && (
            <div className="space-y-4">
              <Slider label="Temperature" value={temperature} min={-10} max={50} unit="°C" onChange={setTemperature} />
              <Select label="Weather" value={weather} onChange={(e) => setWeather(e.target.value)} options={WEATHER_OPTIONS} />
              <Select label="Terrain" value={terrain} onChange={(e) => setTerrain(e.target.value)} options={TERRAINS} />
              <Select label="Traffic" value={traffic} onChange={(e) => setTraffic(e.target.value)} options={TRAFFIC_OPTIONS} />
            </div>
          )}
          {activeTab === "preferences" && (
            <div className="space-y-4">
              <Select label="Ride mode" value={rideMode} onChange={(e) => setRideMode(e.target.value)} options={RIDE_MODES} />
              <Slider label="Rider weight" value={weight} min={40} max={120} unit=" kg" onChange={setWeight} />
              <Slider label="Luggage" value={luggage} min={0} max={30} unit=" kg" onChange={setLuggage} />
            </div>
          )}

          {/* G: low health warning */}
          {health < 75 && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-400">Battery health below 75% — predictions may be less accurate. Consider battery servicing.</p>
            </div>
          )}

          <Button onClick={handlePredict} loading={loading} size="lg" className="w-full mt-6">
            <Zap className="h-4 w-4" />
            Predict range
          </Button>
        </Card>
        )}

        {/* Results — always below input */}
        <div className="space-y-4">
          {readiness && <DecisionBanner decision={readiness.decision} detail={readiness.detail} />}

          {result ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="flex flex-col items-center py-6">
                  <ProgressRing value={battery} label="Battery" size={110} />
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {selectedVehicle?.name ?? "Select vehicle"}
                  </p>
                </Card>
                {/* I: confidence interval */}
                <MetricCard
                  label="Predicted Range"
                  value={formatKm(result.predicted_range_km)}
                  icon={Route}
                  color="accent"
                  subtext={`Range: ${result.range_min_km.toFixed(0)}–${result.range_max_km.toFixed(0)} km · Full charge: ${formatKm(result.full_charge_range_km)}`}
                />
                <MetricCard
                  label="Performance Score"
                  value={result.performance_score}
                  unit="/100"
                  icon={Zap}
                  color={result.performance_score >= 80 ? "success" : result.performance_score >= 60 ? "warning" : "danger"}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* J: factor explainability */}
                {significantFactors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Range Factors</CardTitle>
                      <TrendingDown className="h-4 w-4 text-[var(--muted)]" />
                    </CardHeader>
                    <div className="space-y-2">
                      {significantFactors.map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-[var(--muted)]">{FACTOR_LABELS[key] ?? key}</span>
                          <span className={`text-xs font-mono font-semibold ${val < 0 ? "text-red-400" : val > 0 ? "text-green-400" : "text-[var(--muted)]"}`}>
                            {val > 0 ? "+" : ""}{val}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {chargeTime80 !== null && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Charge Time</CardTitle>
                      <BatteryCharging className="h-4 w-4 text-[var(--muted)]" />
                    </CardHeader>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-lg font-bold font-mono text-yellow-400">{formatMinutes(chargeTime80)}</p>
                        <p className="text-xs text-[var(--muted)]">to 80%</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div>
                        <p className="text-lg font-bold font-mono text-green-400">{formatMinutes(chargeTime100!)}</p>
                        <p className="text-xs text-[var(--muted)]">to 100%</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* K: signup nudge for guests */}
              {!authLoading && !user && (
                <Card className="border-cyan-500/20 bg-cyan-500/5">
                  <p className="text-sm font-semibold text-cyan-400">Save this result</p>
                  <p className="text-xs text-[var(--muted)] mt-1 mb-3">
                    Create a free account to track predictions and compare rides over time.
                  </p>
                  <Link href="/signup">
                    <Button size="sm" className="w-full">Create free account</Button>
                  </Link>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-10 text-center">
              <Battery className="h-8 w-8 text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">Set your conditions and tap Predict range</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
