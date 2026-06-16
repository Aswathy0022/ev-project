from math import asin, cos, radians, sin, sqrt
from pathlib import Path

import pandas as pd

STATION_CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "stations_tamil_nadu.csv"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def load_station_catalog() -> pd.DataFrame:
    if not STATION_CATALOG_PATH.exists():
        return pd.DataFrame(
            columns=["station_name", "city", "latitude", "longitude", "free_slots", "total_slots", "wait_minutes", "rate_kw", "load_kw", "status"]
        )
    return pd.read_csv(STATION_CATALOG_PATH)


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
