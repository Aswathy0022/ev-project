from fastapi import APIRouter

from models.schemas import RegionResponse
from services.geocoding_service import reverse_geocode_region

router = APIRouter(prefix="/location", tags=["location"])


@router.get("/region", response_model=RegionResponse)
def region(lat: float, lon: float):
    result = reverse_geocode_region(lat, lon)
    return RegionResponse(country=result.country, country_code=result.country_code, city=result.city)
