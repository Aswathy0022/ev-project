from __future__ import annotations

import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather codes (https://open-meteo.com/en/docs) mapped to the condition
# vocabulary already used by prediction_service._weather_factor.
_WMO_CONDITION: dict[int, tuple[str, str]] = {
    0: ("Clear", "Clear Sky"),
    1: ("Clear", "Mainly Clear"),
    2: ("Cloudy", "Partly Cloudy"),
    3: ("Cloudy", "Overcast"),
    45: ("Cloudy", "Fog"),
    48: ("Cloudy", "Freezing Fog"),
    51: ("Rain", "Light Drizzle"),
    53: ("Rain", "Drizzle"),
    55: ("Rain", "Dense Drizzle"),
    56: ("Rain", "Freezing Drizzle"),
    57: ("Rain", "Freezing Drizzle"),
    61: ("Rain", "Light Rain"),
    63: ("Rain", "Rain"),
    65: ("Rain", "Heavy Rain"),
    66: ("Rain", "Freezing Rain"),
    67: ("Rain", "Freezing Rain"),
    71: ("Snow", "Light Snow"),
    73: ("Snow", "Snow"),
    75: ("Snow", "Heavy Snow"),
    77: ("Snow", "Snow Grains"),
    80: ("Rain", "Light Showers"),
    81: ("Rain", "Showers"),
    82: ("Storm", "Violent Showers"),
    85: ("Snow", "Snow Showers"),
    86: ("Snow", "Heavy Snow Showers"),
    95: ("Storm", "Thunderstorm"),
    96: ("Storm", "Thunderstorm with Hail"),
    99: ("Storm", "Severe Thunderstorm"),
}


def _condition_for_code(code: int) -> tuple[str, str]:
    return _WMO_CONDITION.get(code, ("Cloudy", "Unknown"))


def fetch_current_weather(lat: float, lon: float) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m",
        "timezone": "auto",
    }
    response = httpx.get(OPEN_METEO_URL, params=params, timeout=10.0)
    response.raise_for_status()
    current = response.json()["current"]
    condition, condition_label = _condition_for_code(int(current["weather_code"]))
    return {
        "temperature_c": round(float(current["temperature_2m"]), 1),
        "condition": condition,
        "condition_label": condition_label,
        "humidity": round(float(current["relative_humidity_2m"]), 1),
        "wind_kmph": round(float(current["wind_speed_10m"]), 1),
    }


def reverse_geocode_label(lat: float, lon: float) -> str | None:
    try:
        from geopy.exc import GeocoderServiceError, GeocoderTimedOut, GeocoderUnavailable
        from services.geocoding_service import _build_nominatim
    except Exception:
        return None

    try:
        geocoder = _build_nominatim()
        location = geocoder.reverse((lat, lon), timeout=10, exactly_one=True)
    except (GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError):
        return None

    if not location:
        return None

    address = location.raw.get("address", {})
    city = address.get("city") or address.get("town") or address.get("village") or address.get("county")
    state = address.get("state")
    if city and state:
        return f"{city}, {state}"
    return city or location.address
