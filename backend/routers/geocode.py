from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.db import City, get_db
from models.schemas import GeocodeResponse
from services.geocoding_service import geocode_place

router = APIRouter(prefix="/geocode", tags=["geocode"])


@router.get("", response_model=GeocodeResponse)
def geocode(place: str, db: Session = Depends(get_db)):
    city_map = {c.name: (c.lat, c.lon, c.display_name) for c in db.query(City).all()}
    result = geocode_place(place, city_map=city_map)
    return GeocodeResponse(
        lat=result.lat, lon=result.lon, label=result.label,
        status=result.status, message=result.message,
    )


@router.get("/cities", response_model=list[str])
def offline_cities(db: Session = Depends(get_db)):
    names = {c.display_name.split(",")[0].strip() for c in db.query(City).all()}
    return sorted(names)
