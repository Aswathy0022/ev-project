"use client";

import { useEffect, useState } from "react";
import { geocode, weather, type WeatherResult } from "@/lib/api";

const FALLBACK_PLACE = "Coimbatore";

export function useWeather() {
  const [data, setData] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFor = async (lat: number, lon: number) => {
      try {
        const result = await weather.current(lat, lon);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError("Weather unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const useFallback = async () => {
      try {
        const geo = await geocode.search(FALLBACK_PLACE);
        if (geo.lat && geo.lon) await loadFor(geo.lat, geo.lon);
        else if (!cancelled) { setError("Weather unavailable"); setLoading(false); }
      } catch {
        if (!cancelled) { setError("Weather unavailable"); setLoading(false); }
      }
    };

    if (!navigator.geolocation) {
      useFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => loadFor(pos.coords.latitude, pos.coords.longitude),
      () => useFallback(),
      { timeout: 8000 },
    );

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

export function useWeatherAt(lat: number | null, lon: number | null) {
  const [data, setData] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let cancelled = false;
    setLoading(true);
    weather.current(lat, lon)
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lon]);

  return { data, loading };
}
