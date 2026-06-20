from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.db import City, get_db
from models.schemas import GeocodeResponse
from services.geocoding_service import geocode_place, suggest_places

router = APIRouter(prefix="/geocode", tags=["geocode"])


@router.get("", response_model=GeocodeResponse)
def geocode(place: str, db: Session = Depends(get_db)):
    city_map = {c.name: (c.lat, c.lon, c.display_name) for c in db.query(City).all()}
    result = geocode_place(place, city_map=city_map)
    return GeocodeResponse(
        lat=result.lat, lon=result.lon, label=result.label,
        status=result.status, message=result.message,
    )


@router.get("/suggest", response_model=list[str])
def suggest(q: str, country_code: str | None = None, db: Session = Depends(get_db)):
    city_map = {c.name: (c.lat, c.lon, c.display_name) for c in db.query(City).all()}
    return suggest_places(q, country_code=country_code, city_map=city_map)


@router.get("/cities", response_model=list[str])
def offline_cities(country_code: str | None = None, db: Session = Depends(get_db)):
    query = db.query(City)
    if country_code:
        query = query.filter(City.country == country_code.upper())
    names = {c.display_name.split(",")[0].strip() for c in query.all()}
    return sorted(names)
