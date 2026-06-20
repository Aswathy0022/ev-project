"use client";

import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, MapPin } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";

const CONDITION_ICON: Record<string, React.ElementType> = {
  Clear: Sun,
  Cloudy: Cloud,
  Rain: CloudRain,
  Storm: CloudLightning,
  Snow: Snowflake,
};

export function WeatherPill() {
  const { data, loading } = useWeather();

  if (loading) {
    return <div className="h-8 w-32 rounded-full bg-black/5 animate-pulse" />;
  }
  if (!data) return null;

  const Icon = CONDITION_ICON[data.condition] ?? Cloud;

  return (
    <div className="flex items-center gap-2 rounded-full border border-black/8 bg-black/3 px-3 py-1.5 text-xs">
      <Icon className="h-4 w-4 text-green-600" />
      <span className="font-semibold text-foreground">{data.temperature_c}°C</span>
      <span className="text-muted hidden sm:inline">{data.condition_label}</span>
      {data.location_label && (
        <span className="hidden md:flex items-center gap-1 text-muted before:content-['·'] before:mr-1">
          <MapPin className="h-3 w-3" />
          {data.location_label}
        </span>
      )}
    </div>
  );
}
