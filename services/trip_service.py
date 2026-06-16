import pandas as pd

from services.prediction_service import travel_readiness
from services.station_service import haversine_km, rank_nearby_stations


def evaluate_trip(
    df: pd.DataFrame,
    current_lat: float,
    current_lon: float,
    destination_lat: float,
    destination_lon: float,
    predicted_range_km: float,
    required_arrival_range_km: float = 8.0,
    safety_buffer_percent: float = 15.0,
) -> dict:
    trip_distance = haversine_km(current_lat, current_lon, destination_lat, destination_lon)
    safety_buffer = max(required_arrival_range_km, trip_distance * (safety_buffer_percent / 100.0))
    needed_range = trip_distance + safety_buffer
    remaining_range = predicted_range_km - trip_distance
    decision, detail = travel_readiness(predicted_range_km, needed_range)
    stations = rank_nearby_stations(df, current_lat, current_lon)
    best = stations.iloc[0]
    return {
        "trip_distance_km": round(trip_distance, 1),
        "needed_range_km": round(needed_range, 1),
        "remaining_range_km": round(remaining_range, 1),
        "decision": decision,
        "detail": detail,
        "backup_station": {
            "name": f"Station EV-{int(best['station_id']) if pd.notna(best['station_id']) else 'NA'}",
            "distance_km": round(float(best["distance_km"]), 1),
            "wait_minutes": round(float(best["avg_wait"]), 1),
            "rate_kw": round(float(best["avg_rate"]), 1),
            "free_slots": int(best["free_slots_est"]),
        },
    }
