from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.db import PredictionEntry


def save_prediction(
    db: Session,
    user_id: int,
    vehicle_name: str,
    battery_level: float,
    battery_health: float,
    weather: str,
    terrain: str,
    traffic: str,
    ride_mode: str,
    predicted_range_km: float,
    performance_score: float,
) -> PredictionEntry:
    entry = PredictionEntry(
        user_id=user_id,
        predicted_at=datetime.now(timezone.utc).isoformat(),
        vehicle_name=vehicle_name,
        battery_level=battery_level,
        battery_health=battery_health,
        weather=weather,
        terrain=terrain,
        traffic=traffic,
        ride_mode=ride_mode,
        predicted_range_km=predicted_range_km,
        performance_score=performance_score,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_user_predictions(db: Session, user_id: int, limit: int = 20) -> list[PredictionEntry]:
    return (
        db.query(PredictionEntry)
        .filter(PredictionEntry.user_id == user_id)
        .order_by(PredictionEntry.id.desc())
        .limit(limit)
        .all()
    )
