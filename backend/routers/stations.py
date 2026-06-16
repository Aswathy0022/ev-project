from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.db import Station, get_db
from models.schemas import StationOut, StationRankRequest
from services.station_service import haversine_km

router = APIRouter(prefix="/stations", tags=["stations"])


def _score(distance_km: float, wait_minutes: float, load_kw: float, free_slots: int, rate_kw: float) -> float:
    return distance_km * 1.8 + wait_minutes * 0.8 + load_kw * 0.04 - free_slots * 1.4 - rate_kw * 0.08


@router.post("/rank", response_model=list[StationOut])
def rank_stations(body: StationRankRequest, db: Session = Depends(get_db)):
    all_stations = db.query(Station).all()
    if not all_stations:
        return []

    results = []
    for s in all_stations:
        dist = haversine_km(body.user_lat, body.user_lon, s.latitude, s.longitude)
        if body.max_distance_km is not None and dist > body.max_distance_km:
            continue
        if body.min_rate_kw is not None and s.rate_kw < body.min_rate_kw:
            continue
        score = _score(dist, s.wait_minutes, s.load_kw, s.free_slots, s.rate_kw)
        results.append((score, dist, StationOut(
            id=s.id,
            station_name=s.station_name, city=s.city,
            latitude=s.latitude, longitude=s.longitude,
            distance_km=round(dist, 1),
            free_slots=s.free_slots, total_slots=s.total_slots,
            wait_minutes=round(s.wait_minutes, 1),
            rate_kw=round(s.rate_kw, 1),
            load_kw=round(s.load_kw, 1),
            status=s.status,
            score=round(score, 2),
        )))

    sort_key = {
        "nearest": lambda x: x[1],
        "fastest": lambda x: -x[0],  # higher rate = lower score
        "least_wait": lambda x: x[2].wait_minutes,
    }.get(body.sort_by, lambda x: x[0])

    results.sort(key=sort_key)
    return [r[2] for r in results[:20]]


@router.get("/offline-cities")
def offline_cities(db: Session = Depends(get_db)):
    from models.db import City
    city_names = {c.display_name.split(",")[0].strip() for c in db.query(City).all()}
    station_cities = {row.city for row in db.query(Station.city).distinct() if row.city}
    return sorted(city_names | station_cities)
