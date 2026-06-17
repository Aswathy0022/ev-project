from typing import Optional

from fastapi import APIRouter, Cookie, Depends
from sqlalchemy.orm import Session

from models.db import get_db
from models.schemas import (
    ChargeTimeRequest,
    PredictionEntryOut,
    RangeRequest,
    RangeResponse,
    TravelReadinessRequest,
    WaitTimeRequest,
)
from services.auth_service import decode_token, get_user_by_id
from services.prediction_history_service import get_user_predictions, save_prediction
from services.prediction_service import (
    predict_charge_time,
    predict_range,
    predict_wait_time,
    travel_readiness,
)
from routers.auth import get_current_user

router = APIRouter(prefix="/predict", tags=["predict"])


def _get_optional_user(
    access_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not access_token:
        return None
    payload = decode_token(access_token)
    if not payload:
        return None
    return get_user_by_id(db, int(payload["sub"]))


@router.post("/range", response_model=RangeResponse)
def range_prediction(
    body: RangeRequest,
    user=Depends(_get_optional_user),
    db: Session = Depends(get_db),
):
    result = predict_range(
        battery_level=body.battery_level,
        temperature=body.temperature,
        weather=body.weather,
        battery_health=body.battery_health,
        speed_kmph=body.speed_kmph,
        vehicle_base_range_km=body.vehicle_base_range_km,
        ride_mode=body.ride_mode,
        terrain=body.terrain,
        traffic=body.traffic,
        rider_weight_kg=body.rider_weight_kg,
        passenger_count=body.passenger_count,
        luggage_kg=body.luggage_kg,
    )
    if user:
        save_prediction(
            db,
            user_id=user.id,
            vehicle_name=body.vehicle_name or "Unknown",
            battery_level=body.battery_level,
            battery_health=body.battery_health,
            weather=body.weather,
            terrain=body.terrain or "City roads",
            traffic=body.traffic or "Moderate traffic",
            ride_mode=body.ride_mode or "Normal",
            predicted_range_km=result["predicted_range_km"],
            performance_score=result["performance_score"],
        )
    return result


@router.post("/charge-time")
def charge_time(body: ChargeTimeRequest):
    minutes = predict_charge_time(
        battery_level=body.battery_level,
        charging_rate_kw=body.charging_rate_kw,
        charging_load_kw=body.charging_load_kw,
        battery_health=body.battery_health,
        target_level=body.target_level,
        charge_bias=body.charge_bias,
    )
    return {"charge_minutes": minutes}


@router.post("/wait-time")
def wait_time(body: WaitTimeRequest):
    minutes = predict_wait_time(crowd=body.crowd, slots=body.slots, hour=body.hour)
    return {"wait_minutes": minutes}


@router.post("/travel-readiness")
def readiness(body: TravelReadinessRequest):
    decision, detail = travel_readiness(body.predicted_range_km, body.trip_distance_km)
    return {"decision": decision, "detail": detail}


@router.get("/history", response_model=list[PredictionEntryOut])
def prediction_history(
    limit: int = 20,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = get_user_predictions(db, current_user.id, limit)
    return [
        PredictionEntryOut(
            id=r.id,
            predicted_at=r.predicted_at,
            vehicle_name=r.vehicle_name,
            battery_level=r.battery_level,
            battery_health=r.battery_health,
            weather=r.weather,
            terrain=r.terrain,
            traffic=r.traffic,
            ride_mode=r.ride_mode,
            predicted_range_km=r.predicted_range_km,
            performance_score=r.performance_score,
        )
        for r in rows
    ]
