from __future__ import annotations

from sqlalchemy.orm import Session

from models.db import ChargingSession


def get_user_history(db: Session, user_id: int, limit: int = 20) -> list[ChargingSession]:
    return (
        db.query(ChargingSession)
        .filter(ChargingSession.user_id == user_id)
        .order_by(ChargingSession.id.desc())
        .limit(limit)
        .all()
    )


def get_user_history_summary(db: Session, user_id: int) -> dict:
    rows = db.query(ChargingSession).filter(ChargingSession.user_id == user_id).all()
    if not rows:
        return {"sessions": 0, "energy_kwh": 0.0, "avg_wait": 0.0, "favorite_station": "No history"}
    stations: dict[str, int] = {}
    for row in rows:
        stations[row.station_name] = stations.get(row.station_name, 0) + 1
    favorite = max(stations, key=lambda k: stations[k])
    return {
        "sessions": len(rows),
        "energy_kwh": round(sum(r.energy_drawn_kwh for r in rows), 1),
        "avg_wait": round(sum(r.wait_minutes for r in rows) / len(rows), 1),
        "favorite_station": favorite,
    }


def save_history_entry(db: Session, user_id: int, **kwargs) -> ChargingSession:
    entry = ChargingSession(user_id=user_id, **kwargs)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def seed_history_for_user(db: Session, user_id: int) -> None:
    existing = db.query(ChargingSession).filter(ChargingSession.user_id == user_id).first()
    if existing:
        return
    import random
    from datetime import datetime, timedelta

    stations = ["EV-Station Adyar", "EV-Station T.Nagar", "EV-Station Anna Nagar",
                "EV-Station OMR", "EV-Station Velachery", "EV-Station Guindy"]
    weathers = ["Clear", "Cloudy", "Rain", "Clear", "Clear"]

    for i in range(12):
        days_ago = random.randint(1, 90)
        session_time = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M")
        entry = ChargingSession(
            user_id=user_id,
            session_time=session_time,
            station_name=random.choice(stations),
            battery_percent=random.randint(20, 70),
            battery_health=random.randint(80, 98),
            charge_minutes=random.randint(25, 80),
            wait_minutes=random.randint(2, 20),
            energy_drawn_kwh=round(random.uniform(8, 22), 1),
            weather=random.choice(weathers),
        )
        db.add(entry)
    db.commit()
