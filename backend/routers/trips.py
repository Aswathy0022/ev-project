from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.db import Station, get_db
from models.schemas import TripEvaluateRequest, TripResult
from services.prediction_service import travel_readiness
from services.station_service import haversine_km

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/evaluate", response_model=TripResult)
def evaluate_trip(body: TripEvaluateRequest, db: Session = Depends(get_db)):
    trip_distance = haversine_km(body.current_lat, body.current_lon, body.destination_lat, body.destination_lon)
    safety_buffer = max(body.required_arrival_range_km, trip_distance * (body.safety_buffer_percent / 100.0))
    needed_range = trip_distance + safety_buffer
    remaining_range = body.predicted_range_km - trip_distance
    decision, detail = travel_readiness(body.predicted_range_km, needed_range)

    backup_station = None
    all_stations = db.query(Station).all()
    if all_stations:
        closest = min(
            all_stations,
            key=lambda s: haversine_km(body.current_lat, body.current_lon, s.latitude, s.longitude),
        )
        backup_station = {
            "name": closest.station_name,
            "distance_km": round(haversine_km(body.current_lat, body.current_lon, closest.latitude, closest.longitude), 1),
            "wait_minutes": round(closest.wait_minutes, 1),
            "rate_kw": round(closest.rate_kw, 1),
            "free_slots": closest.free_slots,
            "latitude": closest.latitude,
            "longitude": closest.longitude,
        }

    return TripResult(
        trip_distance_km=round(trip_distance, 1),
        needed_range_km=round(needed_range, 1),
        remaining_range_km=round(remaining_range, 1),
        decision=decision,
        detail=detail,
        backup_station=backup_station,
    )
