from fastapi import APIRouter

from models.schemas import GeocodeResponse
from services.geocoding_service import geocode_place, get_offline_place_options

router = APIRouter(prefix="/geocode", tags=["geocode"])


@router.get("", response_model=GeocodeResponse)
def geocode(place: str):
    result = geocode_place(place)
    return GeocodeResponse(
        lat=result.lat,
        lon=result.lon,
        label=result.label,
        status=result.status,
        message=result.message,
    )


@router.get("/cities", response_model=list[str])
def offline_cities():
    return get_offline_place_options()
