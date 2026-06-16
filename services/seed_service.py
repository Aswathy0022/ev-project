from __future__ import annotations

import pandas as pd

from services.db_service import read_db, write_db


def seed_history_for_user(user_id: int, df: pd.DataFrame) -> None:
    data = read_db()
    existing = [row for row in data["charging_history"] if row["user_id"] == user_id]
    if existing:
        return

    sample = df.tail(12).copy()
    station_col = "station_id" if "station_id" in sample.columns else None
    time_col = "Date_Time" if "Date_Time" in sample.columns else None
    next_history_id = 1 if not data["charging_history"] else max(int(row["id"]) for row in data["charging_history"]) + 1

    for _, row in sample.iterrows():
        station_name = f"EV-{int(row[station_col])}" if station_col and pd.notna(row[station_col]) else "EV-Station"
        session_time = str(row[time_col]) if time_col and pd.notna(row[time_col]) else "2026-01-01 09:00"
        data["charging_history"].append(
            {
                "id": next_history_id,
                "user_id": user_id,
                "session_time": session_time,
                "station_name": station_name,
                "battery_percent": float(row.get("soc", 50)),
                "battery_health": float(row.get("battery_health", 85)),
                "charge_minutes": float(row.get("charge_minutes", 40)),
                "wait_minutes": float(row.get("queue_minutes", 8)),
                "energy_drawn_kwh": float(row.get("energy_drawn_kwh", 18)),
                "weather": str(row.get("weather", "Clear")),
            }
        )
        next_history_id += 1

    write_db(data)
