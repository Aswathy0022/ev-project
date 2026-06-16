from fastapi import APIRouter

from models.schemas import (
    ChargeTimeRequest,
    RangeRequest,
    RangeResponse,
    TravelReadinessRequest,
    WaitTimeRequest,
)
from services.prediction_service import (
    predict_charge_time,
    predict_range,
    predict_wait_time,
    travel_readiness,
)

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("/range", response_model=RangeResponse)
def range_prediction(body: RangeRequest):
    return predict_range(
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
