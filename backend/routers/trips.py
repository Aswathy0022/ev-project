from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.db import Station, get_db
from models.schemas import TripEvaluateRequest, TripResult
from services.prediction_service import travel_readiness
from services.route_service import find_charging_stops, get_elevation_profile, get_route

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/evaluate", response_model=TripResult)
def evaluate_trip(body: TripEvaluateRequest, db: Session = Depends(get_db)):
    route = get_route(body.current_lat, body.current_lon, body.destination_lat, body.destination_lon)
    trip_distance = route.distance_km
    safety_buffer = max(body.required_arrival_range_km, trip_distance * (body.safety_buffer_percent / 100.0))
    needed_range = trip_distance + safety_buffer
    remaining_range = body.predicted_range_km - trip_distance
    decision, detail = travel_readiness(body.predicted_range_km, needed_range)

    all_stations = db.query(Station).all()
    charging_stops = find_charging_stops(route.polyline, all_stations)
    elevation_profile = get_elevation_profile(route.polyline)

    return TripResult(
        trip_distance_km=round(trip_distance, 1),
        duration_min=round(route.duration_min, 1),
        needed_range_km=round(needed_range, 1),
        remaining_range_km=round(remaining_range, 1),
        decision=decision,
        detail=detail,
        polyline=route.polyline,
        is_real_route=route.is_real,
        elevation_profile=elevation_profile,
        charging_stops=charging_stops,
    )
