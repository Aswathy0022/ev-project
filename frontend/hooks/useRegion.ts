"use client";

import { useEffect, useState } from "react";
import { location, type RegionResult } from "@/lib/api";

export function useRegion() {
  const [data, setData] = useState<RegionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        location.region(pos.coords.latitude, pos.coords.longitude)
          .then((result) => { if (!cancelled) setData(result); })
          .catch(() => {})
          .finally(() => { if (!cancelled) setLoading(false); });
      },
      () => { if (!cancelled) setLoading(false); },
      { timeout: 8000 },
    );

    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}
