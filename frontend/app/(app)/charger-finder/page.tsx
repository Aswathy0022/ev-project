"use client";

import { useState, useEffect } from "react";
import { Bolt, Search, MapPin, Clock, Zap, Filter } from "lucide-react";
import { toast } from "sonner";
import { stations, geocode, type Station } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import { formatKm, formatMinutes } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "score", label: "Best overall" },
  { value: "nearest", label: "Nearest" },
  { value: "fastest", label: "Fastest charger" },
  { value: "least_wait", label: "Least wait" },
];

function StationCard({ station, rank }: { station: Station; rank: number }) {
  const available = station.free_slots > 0;
  return (
    <Card glow className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted)] w-5">#{rank}</span>
            <h3 className="font-semibold text-sm">{station.station_name}</h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5 ml-7">{station.city}</p>
        </div>
        <Badge variant={available ? "success" : "danger"}>
          {available ? "Available" : "Busy"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 ml-7">
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="h-3 w-3 text-cyan-400" />
          <span className="text-[var(--muted)]">{formatKm(station.distance_km)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3 w-3 text-yellow-400" />
          <span className="text-[var(--muted)]">{formatMinutes(station.wait_minutes)} wait</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Zap className="h-3 w-3 text-green-400" />
          <span className="text-[var(--muted)]">{station.rate_kw} kW</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Bolt className="h-3 w-3 text-[var(--muted)]" />
          <span className="text-[var(--muted)]">{station.free_slots}/{station.total_slots} slots</span>
        </div>
      </div>

      {/* Load bar */}
      <div className="ml-7">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--muted)]">Load</span>
          <span className="text-xs text-[var(--muted)]">{station.load_kw}/{station.rate_kw} kW</span>
        </div>
        <div className="h-1 rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (station.load_kw / station.rate_kw) * 100)}%`,
              background: station.load_kw / station.rate_kw > 0.9 ? "#ef4444" : station.load_kw / station.rate_kw > 0.6 ? "#eab308" : "#22c55e",
            }}
          />
        </div>
      </div>
    </Card>
  );
}

export default function ChargerFinderPage() {
  const [cities, setCities] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [maxDistance, setMaxDistance] = useState(20);
  const [minRate, setMinRate] = useState(0);
  const [stationList, setStationList] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    geocode.cities().then(setCities).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!location.trim()) {
      toast.error("Enter a location");
      return;
    }
    setLoading(true);
    try {
      const geo = await geocode.search(location);
      if (!geo.lat) {
        toast.error(`Could not find: ${location}`);
        return;
      }
      const result = await stations.rank(geo.lat!, geo.lon!, {
        max_distance_km: maxDistance > 0 ? maxDistance : undefined,
        min_rate_kw: minRate > 0 ? minRate : undefined,
        sort_by: sortBy,
      });
      setStationList(result);
      setSearched(true);
      if (result.length === 0) toast.info("No stations found with these filters");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Charger</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Discover nearby EV charging stations</p>
      </div>

      {/* Search bar */}
      <Card className="space-y-4">
        <datalist id="charger-cities">
          {cities.map((c) => <option key={c} value={c} />)}
        </datalist>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Chennai, Coimbatore, or coordinates..."
              icon={<MapPin className="h-4 w-4" />}
              list="charger-cities"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={() => setShowFilters(!showFilters)} variant="secondary" size="md">
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={handleSearch} loading={loading} size="md">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/8">
            <Select label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={SORT_OPTIONS} />
            <Slider label="Max distance" value={maxDistance} min={1} max={50} unit=" km" onChange={setMaxDistance} />
            <Slider label="Min charge rate" value={minRate} min={0} max={100} unit=" kW" onChange={setMinRate} />
          </div>
        )}
      </Card>

      {/* Results */}
      {stationList.length > 0 ? (
        <div>
          <p className="text-xs text-[var(--muted)] mb-3">{stationList.length} stations found</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stationList.map((s, i) => (
              <StationCard key={`${s.station_name}-${i}`} station={s} rank={i + 1} />
            ))}
          </div>
        </div>
      ) : searched ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <Bolt className="h-8 w-8 text-[var(--muted)] mb-2" />
          <p className="text-sm text-[var(--muted)]">No stations found. Try adjusting filters.</p>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-8 w-8 text-[var(--muted)] mb-2" />
          <p className="text-sm text-[var(--muted)]">Enter a city or coordinates to find chargers</p>
          <p className="text-xs text-[var(--muted)] mt-1">Try: Chennai, Coimbatore, Kochi</p>
        </Card>
      )}
    </div>
  );
}
