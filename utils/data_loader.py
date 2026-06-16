from pathlib import Path

import pandas as pd
import streamlit as st


BASE_DIR = Path(__file__).resolve().parents[1]
UPDATED_DATASET = BASE_DIR / "electric_vehicles_updated.csv"
FALLBACK_DATASET = BASE_DIR / "electric_vehicles.csv"


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename_map = {
        "State_of_Charge_%": "soc",
        "Battery": "battery_percent",
        "BatteryHealth": "battery_health",
        "Temperature_C": "temp_c",
        "Temperature": "temp_aux",
        "Charging_Rate_kW": "charging_rate_kw",
        "Charging_Load_kW": "charging_load_kw",
        "Queue_Time_mins": "queue_minutes",
        "WaitingTime": "wait_aux",
        "Vehicles": "vehicles",
        "Slots": "slots",
        "Station_Capacity_EV": "station_capacity",
        "Charging_Station_ID": "station_id",
        "Current_Latitude": "current_lat",
        "Current_Longitude": "current_lon",
        "Destination_Latitude": "dest_lat",
        "Destination_Longitude": "dest_lon",
        "Distance_to_Destination_km": "destination_distance_km",
        "Weather_Conditions": "weather",
        "Energy_Consumption_Rate_kWh/km": "consumption_rate",
        "Battery_Capacity_kWh": "battery_capacity_kwh",
        "Time_Spent_Charging_mins": "charge_minutes",
        "ChargingTime": "charge_aux",
        "Energy_Drawn_kWh": "energy_drawn_kwh",
        "Session_Start_Hour": "session_hour",
        "Availability": "availability_signal",
        "Load": "load_signal",
        "Speed": "speed_signal",
    }
    df = df.rename(columns=rename_map).copy()
    if "soc" not in df and "battery_percent" in df:
        df["soc"] = df["battery_percent"]
    if "battery_percent" not in df and "soc" in df:
        df["battery_percent"] = df["soc"]
    if "temp_c" not in df and "temp_aux" in df:
        df["temp_c"] = df["temp_aux"]
    if "battery_health" not in df:
        df["battery_health"] = 85
    if "queue_minutes" not in df and "wait_aux" in df:
        df["queue_minutes"] = df["wait_aux"]
    if "charge_minutes" not in df and "charge_aux" in df:
        df["charge_minutes"] = df["charge_aux"]
    return df


@st.cache_data(show_spinner=False)
def load_data() -> pd.DataFrame:
    source = UPDATED_DATASET if UPDATED_DATASET.exists() else FALLBACK_DATASET
    df = pd.read_csv(source)
    return _normalize_columns(df)
