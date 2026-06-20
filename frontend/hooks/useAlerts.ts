"use client";

import { useEffect, useState } from "react";
import { useWeather } from "./useWeather";

export interface Alert {
  id: string;
  severity: "warning" | "danger";
  message: string;
}

const HEALTH_KEY = "voltiq-health";
export const VOLTIQ_STATE_EVENT = "voltiq:state-changed";

function readHealth(): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(HEALTH_KEY);
  return v !== null ? Number(v) : null;
}

export function useAlerts(): Alert[] {
  const [health, setHealth] = useState<number | null>(null);
  const { data: weather } = useWeather();

  useEffect(() => {
    setHealth(readHealth());
    const sync = () => setHealth(readHealth());
    window.addEventListener("storage", sync);
    window.addEventListener(VOLTIQ_STATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(VOLTIQ_STATE_EVENT, sync);
    };
  }, []);

  const alerts: Alert[] = [];

  if (health !== null && health < 75) {
    alerts.push({
      id: "battery-health",
      severity: health < 60 ? "danger" : "warning",
      message: `Battery health at ${health}% — consider servicing soon.`,
    });
  }

  if (weather && (weather.condition === "Storm" || weather.condition === "Snow")) {
    alerts.push({
      id: "weather",
      severity: "danger",
      message: `${weather.condition_label} at your location — ride with caution.`,
    });
  }

  return alerts;
}
