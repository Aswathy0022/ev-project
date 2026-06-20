from fastapi import APIRouter, HTTPException

from models.schemas import WeatherResponse
from services.weather_service import fetch_current_weather, reverse_geocode_label

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("", response_model=WeatherResponse)
def current_weather(lat: float, lon: float):
    try:
        data = fetch_current_weather(lat, lon)
    except Exception:
        raise HTTPException(status_code=502, detail="Weather service unavailable")
    label = reverse_geocode_label(lat, lon)
    return WeatherResponse(location_label=label, **data)
