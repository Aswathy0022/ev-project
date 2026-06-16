import pandas as pd

from services.db_service import next_id, read_db, write_db


def load_history(df: pd.DataFrame, limit: int = 12) -> pd.DataFrame:
    columns = [
        "Date_Time",
        "station_id",
        "soc",
        "battery_health",
        "charge_minutes",
        "queue_minutes",
        "energy_drawn_kwh",
        "weather",
    ]
    available = [column for column in columns if column in df.columns]
    history = df[available].copy().tail(limit)
    history = history.rename(
        columns={
            "Date_Time": "Date",
            "station_id": "Station",
            "soc": "Battery %",
            "battery_health": "Battery Health",
            "charge_minutes": "Charge Time (min)",
            "queue_minutes": "Wait Time (min)",
            "energy_drawn_kwh": "Energy Drawn (kWh)",
            "weather": "Weather",
        }
    )
    history["Station"] = history["Station"].apply(
        lambda value: f"EV-{int(value)}" if pd.notna(value) else "Unknown"
    )
    return history.iloc[::-1].reset_index(drop=True)


def history_summary(df: pd.DataFrame) -> dict:
    return {
        "sessions": int(len(df)),
        "energy_kwh": round(float(df["energy_drawn_kwh"].sum()), 1),
        "avg_wait": round(float(df["queue_minutes"].mean()), 1),
        "favorite_station": f"EV-{int(df['station_id'].mode().iloc[0])}",
    }


def load_user_history(user_id: int, limit: int = 20) -> pd.DataFrame:
    data = read_db()
    rows = [row for row in data["charging_history"] if row["user_id"] == user_id]
    rows = sorted(rows, key=lambda row: row["id"], reverse=True)[:limit]
    return pd.DataFrame(
        [
            {
                "Date": row["session_time"],
                "Station": row["station_name"],
                "Battery %": row["battery_percent"],
                "Battery Health": row["battery_health"],
                "Charge Time (min)": row["charge_minutes"],
                "Wait Time (min)": row["wait_minutes"],
                "Energy Drawn (kWh)": row["energy_drawn_kwh"],
                "Weather": row["weather"],
            }
            for row in rows
        ]
    )


def user_history_summary(user_id: int) -> dict:
    data = read_db()
    rows = [row for row in data["charging_history"] if row["user_id"] == user_id]
    if not rows:
        return {
            "sessions": 0,
            "energy_kwh": 0.0,
            "avg_wait": 0.0,
            "favorite_station": "No history",
        }
    stations = {row["station_name"] for row in rows}
    favorite_station = max(stations, key=lambda station: sum(1 for row in rows if row["station_name"] == station))
    return {
        "sessions": len(rows),
        "energy_kwh": round(sum(float(row["energy_drawn_kwh"]) for row in rows), 1),
        "avg_wait": round(sum(float(row["wait_minutes"]) for row in rows) / len(rows), 1),
        "favorite_station": favorite_station,
    }


def save_user_history_entry(
    user_id: int,
    station_name: str,
    battery_percent: float,
    battery_health: float,
    charge_minutes: float,
    wait_minutes: float,
    energy_drawn_kwh: float,
    weather: str,
    session_time: str,
) -> None:
    data = read_db()
    data["charging_history"].append(
        {
            "id": next_id(data["charging_history"]),
            "user_id": user_id,
            "session_time": session_time,
            "station_name": station_name,
            "battery_percent": float(battery_percent),
            "battery_health": float(battery_health),
            "charge_minutes": float(charge_minutes),
            "wait_minutes": float(wait_minutes),
            "energy_drawn_kwh": float(energy_drawn_kwh),
            "weather": str(weather),
        }
    )
    write_db(data)
