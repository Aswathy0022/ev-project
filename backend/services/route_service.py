from __future__ import annotations

from dataclasses import dataclass

import httpx

from services.station_service import haversine_km

OSRM_URL = "https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"
ELEVATION_URL = "https://api.open-elevation.com/api/v1/lookup"


@dataclass
class RouteResult:
    polyline: list[list[float]]  # [[lat, lon], ...]
    distance_km: float
    duration_min: float
    is_real: bool


def get_route(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float) -> RouteResult:
    """Real driving route from the public OSRM demo server. Falls back to a straight-line
    interpolation (haversine distance) if that service is unreachable."""
    try:
        url = OSRM_URL.format(lon1=origin_lon, lat1=origin_lat, lon2=dest_lon, lat2=dest_lat)
        resp = httpx.get(url, params={"overview": "full", "geometries": "geojson"}, timeout=6.0)
        resp.raise_for_status()
        route = resp.json()["routes"][0]
        polyline = [[lat, lon] for lon, lat in route["geometry"]["coordinates"]]
        return RouteResult(
            polyline=polyline,
            distance_km=route["distance"] / 1000.0,
            duration_min=route["duration"] / 60.0,
            is_real=True,
        )
    except Exception:
        distance_km = haversine_km(origin_lat, origin_lon, dest_lat, dest_lon)
        steps = 10
        polyline = [
            [origin_lat + (dest_lat - origin_lat) * i / steps, origin_lon + (dest_lon - origin_lon) * i / steps]
            for i in range(steps + 1)
        ]
        return RouteResult(
            polyline=polyline,
            distance_km=distance_km,
            duration_min=(distance_km / 35.0) * 60.0,  # ~35 km/h assumed average, fallback-only estimate
            is_real=False,
        )


def get_elevation_profile(polyline: list[list[float]], samples: int = 12) -> list[dict] | None:
    """Real elevation samples along the route from Open-Elevation. Returns None (not synthetic
    data) if that service is unreachable, so the frontend can hide the chart gracefully."""
    if not polyline or len(polyline) < 2:
        return None

    step = max(1, len(polyline) // samples)
    sampled = polyline[::step]
    if sampled[-1] != polyline[-1]:
        sampled.append(polyline[-1])

    try:
        locations = [{"latitude": lat, "longitude": lon} for lat, lon in sampled]
        resp = httpx.post(ELEVATION_URL, json={"locations": locations}, timeout=8.0)
        resp.raise_for_status()
        results = resp.json()["results"]
    except Exception:
        return None

    profile = []
    cumulative_km = 0.0
    prev_lat, prev_lon = sampled[0]
    for point, (lat, lon) in zip(results, sampled):
        cumulative_km += haversine_km(prev_lat, prev_lon, lat, lon)
        profile.append({"distance_km": round(cumulative_km, 2), "elevation_m": round(point["elevation"], 1)})
        prev_lat, prev_lon = lat, lon
    return profile


def find_charging_stops(polyline: list[list[float]], stations: list, max_detour_km: float = 5.0, limit: int = 3) -> list[dict]:
    """Stations within max_detour_km of the route, ranked by how far along the route they sit."""
    if not polyline or not stations:
        return []

    cumulative = [0.0]
    for i in range(1, len(polyline)):
        cumulative.append(cumulative[-1] + haversine_km(*polyline[i - 1], *polyline[i]))

    check_step = max(1, len(polyline) // 50)
    checked_indices = list(range(0, len(polyline), check_step))
    if checked_indices[-1] != len(polyline) - 1:
        checked_indices.append(len(polyline) - 1)

    candidates = []
    for s in stations:
        best_detour_km = None
        best_progress_km = 0.0
        for idx in checked_indices:
            lat, lon = polyline[idx]
            d = haversine_km(s.latitude, s.longitude, lat, lon)
            if best_detour_km is None or d < best_detour_km:
                best_detour_km = d
                best_progress_km = cumulative[idx]
        if best_detour_km is not None and best_detour_km <= max_detour_km:
            candidates.append((best_progress_km, s))

    candidates.sort(key=lambda c: c[0])
    return [
        {
            "station_id": s.id,
            "name": s.station_name,
            "distance_km": round(progress_km, 1),
            "wait_minutes": round(s.wait_minutes, 1),
            "rate_kw": round(s.rate_kw, 1),
            "free_slots": s.free_slots,
            "latitude": s.latitude,
            "longitude": s.longitude,
        }
        for progress_km, s in candidates[:limit]
    ]
