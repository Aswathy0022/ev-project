from math import asin, cos, radians, sin, sqrt
from pathlib import Path

import pandas as pd


STATION_CATALOG_PATH = Path(__file__).resolve().parents[1] / "stations_tamil_nadu.csv"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def summarize_stations(df: pd.DataFrame) -> pd.DataFrame:
    grouped = (
        df.groupby("station_id", dropna=False)
        .agg(
            current_lat=("current_lat", "median"),
            current_lon=("current_lon", "median"),
            avg_wait=("queue_minutes", "median"),
            avg_rate=("charging_rate_kw", "median"),
            avg_load=("charging_load_kw", "median"),
            avg_vehicles=("vehicles", "median"),
            avg_slots=("slots", "median"),
            availability_signal=("availability_signal", "median"),
        )
        .reset_index()
    )
    grouped["free_slots_est"] = (grouped["avg_slots"] - grouped["avg_vehicles"]).round().clip(lower=0)
    return grouped


def dataset_region_summary(df: pd.DataFrame) -> dict:
    center_lat = float(df["current_lat"].median())
    center_lon = float(df["current_lon"].median())
    distances = df.apply(
        lambda row: haversine_km(center_lat, center_lon, float(row["current_lat"]), float(row["current_lon"])),
        axis=1,
    )
    return {
        "center_lat": center_lat,
        "center_lon": center_lon,
        "coverage_radius_km": round(float(distances.max()), 1),
    }


def load_station_catalog() -> pd.DataFrame:
    if not STATION_CATALOG_PATH.exists():
        return pd.DataFrame(
            columns=[
                "station_name",
                "city",
                "latitude",
                "longitude",
                "free_slots",
                "total_slots",
                "wait_minutes",
                "rate_kw",
                "load_kw",
                "status",
            ]
        )
    return pd.read_csv(STATION_CATALOG_PATH)


def catalog_region_summary(catalog: pd.DataFrame) -> dict:
    center_lat = float(catalog["latitude"].median())
    center_lon = float(catalog["longitude"].median())
    distances = catalog.apply(
        lambda row: haversine_km(center_lat, center_lon, float(row["latitude"]), float(row["longitude"])),
        axis=1,
    )
    return {
        "center_lat": center_lat,
        "center_lon": center_lon,
        "coverage_radius_km": round(float(distances.max()), 1),
    }


def rank_catalog_stations(catalog: pd.DataFrame, user_lat: float, user_lon: float) -> pd.DataFrame:
    stations = catalog.copy()
    stations["distance_km"] = stations.apply(
        lambda row: haversine_km(user_lat, user_lon, float(row["latitude"]), float(row["longitude"])),
        axis=1,
    )
    stations["score"] = (
        stations["distance_km"] * 1.8
        + stations["wait_minutes"] * 0.8
        + stations["load_kw"] * 0.04
        - stations["free_slots"] * 1.4
        - stations["rate_kw"] * 0.08
    )
    return stations.sort_values(["score", "distance_km"]).reset_index(drop=True)


def rank_nearby_stations(df: pd.DataFrame, user_lat: float, user_lon: float) -> pd.DataFrame:
    stations = summarize_stations(df).copy()
    stations["distance_km"] = stations.apply(
        lambda row: haversine_km(user_lat, user_lon, row["current_lat"], row["current_lon"]),
        axis=1,
    )
    stations["score"] = (
        stations["distance_km"] * 1.8
        + stations["avg_wait"] * 0.7
        + stations["avg_load"] * 0.04
        - stations["free_slots_est"] * 1.2
        - stations["avg_rate"] * 0.06
    )
    stations["availability_label"] = stations["free_slots_est"].apply(
        lambda slots: "Available" if slots > 0 else "Busy"
    )
    return stations.sort_values(["score", "distance_km"]).reset_index(drop=True)


def best_station_summary(stations: pd.DataFrame) -> dict:
    best = stations.iloc[0]
    return {
        "name": f"Station EV-{int(best['station_id']) if pd.notna(best['station_id']) else 'NA'}",
        "distance_km": round(float(best["distance_km"]), 1),
        "wait_minutes": round(float(best["avg_wait"]), 1),
        "free_slots": int(best["free_slots_est"]),
        "rate_kw": round(float(best["avg_rate"]), 1),
        "load_kw": round(float(best["avg_load"]), 1),
    }
