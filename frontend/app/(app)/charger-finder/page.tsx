"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Bolt, Search, MapPin, Clock, Zap, Filter, CheckCircle2, XCircle, Navigation, ExternalLink, Info, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { stations, geocode, type Station } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import type { MapMarker } from "@/components/ui/MapView";
import { formatKm, formatMinutes } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/ui/MapView").then((m) => m.MapView), { ssr: false });

const SORT_OPTIONS = [
  { value: "score", label: "Best overall" },
  { value: "nearest", label: "Nearest" },
  { value: "fastest", label: "Fastest charger" },
  { value: "least_wait", label: "Least wait" },
];

function StationCard({ station, rank }: { station: Station; rank: number }) {
  const available = station.free_slots > 0;
  // C: Google Maps navigate deep-link
  const mapsUrl = `https://maps.google.com/?q=${station.latitude},${station.longitude}`;

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
          {available
            ? <><CheckCircle2 className="h-3 w-3" />Available</>
            : <><XCircle className="h-3 w-3" />Busy</>}
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

      {/* C: Navigate link */}
      <div className="ml-7">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Navigation className="h-3 w-3" />
          Navigate
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
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
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    geocode.cities().then(setCities).catch(() => {});
  }, []);

  // B: GPS "Use my location" handler
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        setLocation(coords);
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
        toast.success("Location detected");
      },
      () => {
        toast.error("Could not get your location");
        setGeoLoading(false);
      },
    );
  };

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
      setUserCoords([geo.lat!, geo.lon!]);
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
        <div className="flex gap-2">
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
          {/* B: GPS button */}
          <Button
            onClick={handleGeolocate}
            loading={geoLoading}
            variant="secondary"
            size="md"
            title="Use my current location"
          >
            <LocateFixed className="h-4 w-4" />
          </Button>
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

        {/* D: data disclaimer */}
        <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Info className="h-3 w-3 shrink-0" />
          Availability and slot counts may not reflect real-time conditions.
        </p>
      </Card>

      {/* Map + Results — side by side so the list doesn't get pushed below the fold */}
      {userCoords ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Card className="p-0 overflow-hidden h-[280px] lg:h-[560px]">
            <MapView
              height="100%"
              markers={[
                { position: userCoords, kind: "user", popup: "Your location" },
                ...stationList.map((s): MapMarker => ({
                  position: [s.latitude, s.longitude],
                  kind: s.free_slots > 0 ? "stationAvailable" : "stationBusy",
                  popup: (
                    <div className="text-xs">
                      <p className="font-semibold">{s.station_name}</p>
                      <p>{formatKm(s.distance_km)} away · {formatMinutes(s.wait_minutes)} wait</p>
                      <p>{s.free_slots}/{s.total_slots} slots · {s.rate_kw} kW</p>
                    </div>
                  ),
                })),
              ]}
            />
          </Card>

          {stationList.length > 0 ? (
            <div className="lg:h-[560px] lg:overflow-y-auto lg:pr-1 space-y-3">
              <p className="text-xs text-[var(--muted)]">{stationList.length} stations found</p>
              {stationList.map((s, i) => (
                <StationCard key={`${s.station_name}-${i}`} station={s} rank={i + 1} />
              ))}
            </div>
          ) : searched ? (
            <Card className="flex flex-col items-center justify-center text-center lg:h-[560px]">
              <Bolt className="h-8 w-8 text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">No stations found. Try adjusting filters.</p>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center text-center lg:h-[560px]">
              <Search className="h-8 w-8 text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">Searching nearby...</p>
            </Card>
          )}
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
