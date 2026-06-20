"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bolt, Search, MapPin, Clock, Zap, CheckCircle2, XCircle, Navigation, ExternalLink, Info, LocateFixed, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { stations, geocode, bookings, type Station } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRegion } from "@/hooks/useRegion";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import type { MapMarker } from "@/components/ui/MapView";
import { formatKm, formatMinutes } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

const MapView = dynamic(() => import("@/components/ui/MapView").then((m) => m.MapView), { ssr: false });

const SORT_OPTIONS = [
  { value: "score", label: "Best overall" },
  { value: "nearest", label: "Nearest" },
  { value: "fastest", label: "Fastest charger" },
  { value: "least_wait", label: "Least wait" },
];

function StationCard({ station, rank }: { station: Station; rank: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const available = station.free_slots > 0;
  // C: Google Maps navigate deep-link
  const mapsUrl = `https://maps.google.com/?q=${station.latitude},${station.longitude}`;
  const loadRatio = station.load_kw / station.rate_kw;

  const [bookingOpen, setBookingOpen] = useState(false);
  const [slotStart, setSlotStart] = useState("");
  const [duration, setDuration] = useState("60");
  const [submitting, setSubmitting] = useState(false);

  const handleBookClick = () => {
    if (!user) {
      toast.error("Sign in to book a charging slot");
      router.push("/login");
      return;
    }
    setBookingOpen((open) => !open);
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
      await bookings.create(station.id, start.toISOString(), end.toISOString());
      toast.success(`Slot booked at ${station.station_name}`);
      setBookingOpen(false);
      setSlotStart("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card glow className="space-y-3 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-[var(--muted)] w-5 shrink-0">#{rank}</span>

        <div className="min-w-[140px] flex-1">
          <h3 className="font-semibold text-sm truncate">{station.station_name}</h3>
          <p className="text-xs text-[var(--muted)]">{station.city}</p>
        </div>

        <Badge variant={available ? "success" : "danger"}>
          {available
            ? <><CheckCircle2 className="h-3 w-3" />Available</>
            : <><XCircle className="h-3 w-3" />Busy</>}
        </Badge>

        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <MapPin className="h-3 w-3 text-green-600" />
          {formatKm(station.distance_km)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Clock className="h-3 w-3 text-yellow-600" />
          {formatMinutes(station.wait_minutes)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Zap className="h-3 w-3 text-green-600" />
          {station.rate_kw} kW
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Bolt className="h-3 w-3" />
          {station.free_slots}/{station.total_slots}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 w-16">
          <div className="h-1 flex-1 rounded-full bg-black/8">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, loadRatio * 100)}%`,
                background: loadRatio > 0.9 ? "#ef4444" : loadRatio > 0.6 ? "#eab308" : "#22c55e",
              }}
            />
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          disabled={!available}
          onClick={handleBookClick}
          className="shrink-0"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Book slot
        </Button>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors shrink-0"
        >
          <Navigation className="h-3 w-3" />
          Navigate
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>

      {bookingOpen && (
        <div className="flex flex-wrap items-end gap-2 pt-3 border-t border-black/8">
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
            options={DURATION_OPTIONS}
          />
          <Button size="sm" loading={submitting} onClick={handleConfirmBooking}>
            Confirm booking
          </Button>
        </div>
      )}
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
  const [searched, setSearched] = useState(false);
  const { data: region } = useRegion();
  const debouncedLocation = useDebouncedValue(location, 400);

  useEffect(() => {
    geocode.cities().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!region?.country_code) return;
    geocode.cities(region.country_code).then((scoped) => {
      if (scoped.length > 0) setCities(scoped);
    }).catch(() => {});
  }, [region?.country_code]);

  useEffect(() => {
    const q = debouncedLocation.trim();
    if (q.length < 2) return;
    geocode.suggest(q, region?.country_code).then((s) => { if (s.length > 0) setCities(s); }).catch(() => {});
  }, [debouncedLocation, region?.country_code]);

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
        <h1 className="text-2xl font-bold">Find Chargers</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Discover nearby EV charging stations ranked by distance, speed, and availability</p>
      </div>

      <datalist id="charger-cities">
        {cities.map((c) => <option key={c} value={c} />)}
      </datalist>

      {/* Filters-left / map-right layout */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Left filter panel */}
        <Card className="space-y-4 lg:sticky lg:top-20 self-start">
          <Input
            label="Location"
            placeholder="Chennai, Coimbatore..."
            icon={<MapPin className="h-4 w-4" />}
            list="charger-cities"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleGeolocate} loading={geoLoading} variant="secondary" size="sm" className="w-full">
            <LocateFixed className="h-3.5 w-3.5" />
            Use my location
          </Button>

          <div className="h-px bg-black/8" />

          <Select label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={SORT_OPTIONS} />
          <Slider label="Max distance" value={maxDistance} min={1} max={50} unit=" km" onChange={setMaxDistance} />
          <Slider label="Min charge rate" value={minRate} min={0} max={100} unit=" kW" onChange={setMinRate} />

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSearch} loading={loading} size="sm" className="flex-1">
              <Search className="h-3.5 w-3.5" />
              Search
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setMaxDistance(20); setMinRate(0); setSortBy("score"); }}
            >
              Reset
            </Button>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-muted pt-1">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            Availability and slot counts may not reflect real-time conditions.
          </p>
        </Card>

        {/* Map + results */}
        {userCoords ? (
          <div className="space-y-4">
            <Card className="p-0 overflow-hidden h-[320px] lg:h-[420px]">
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
              <div className="space-y-3">
                <p className="text-xs text-muted">{stationList.length} chargers found</p>
                {stationList.map((s, i) => (
                  <StationCard key={`${s.station_name}-${i}`} station={s} rank={i + 1} />
                ))}
              </div>
            ) : searched ? (
              <Card className="flex flex-col items-center justify-center text-center py-12">
                <Bolt className="h-8 w-8 text-muted mb-2" />
                <p className="text-sm text-muted">No stations found. Try adjusting filters.</p>
              </Card>
            ) : null}
          </div>
        ) : searched ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <Bolt className="h-8 w-8 text-muted mb-2" />
            <p className="text-sm text-muted">No stations found. Try adjusting filters.</p>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-8 w-8 text-muted mb-2" />
            <p className="text-sm text-muted">Enter a city or coordinates to find chargers</p>
            <p className="text-xs text-muted mt-1">Try: Chennai, Coimbatore, Kochi</p>
          </Card>
        )}
      </div>
    </div>
  );
}
