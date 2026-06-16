import streamlit as st
from datetime import datetime

from services.history_service import save_user_history_entry
from services.prediction_service import estimate_charge_gain_km, predict_charge_time, predict_range, predict_wait_time, travel_readiness
from services.station_service import best_station_summary, rank_nearby_stations
from services.vehicle_service import get_vehicle_models, get_vehicle_profile
from ui.components import render_decision, render_hero, render_input_summary, render_metric_card, render_panel, render_progress_card, render_station_card
from utils.data_loader import load_data


def _format_minutes_hms(total_minutes: float) -> str:
    total_seconds = max(int(round(total_minutes * 60)), 0)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def run():
    df = load_data()
    render_hero(
        "Quick EV check",
        "See whether you can ride now, how far you can go, and the best nearby charger in one view.",
        "Home",
    )

    input_col, decision_col = st.columns((0.78, 1.22))
    with input_col:
        st.subheader("Ride inputs")
        input_tab, condition_tab, preference_tab = st.tabs(["Battery", "Conditions", "Preferences"])
        with input_tab:
            vehicle_model = st.selectbox("Vehicle model", get_vehicle_models(), index=0)
            vehicle = get_vehicle_profile(vehicle_model)
            battery_level = st.slider("Current battery (%)", 0, 100, int(df["soc"].median()))
            destination_km = st.slider("How far do you want to go? (km)", 1, 300, 45)
            battery_health = st.slider("Battery health (%)", 50, 100, int(df["battery_health"].median()))
        current_lat = float(df["current_lat"].median())
        current_lon = float(df["current_lon"].median())
        with condition_tab:
            default_temp = int(df["temp_c"].median())
            default_weather = df["weather"].mode().iloc[0]
            temperature = st.slider("Temperature (C)", -5, 50, default_temp)
            weather = st.selectbox("Weather", sorted(df["weather"].dropna().unique()), index=0)
            speed_kmph = st.slider("Average riding speed (km/h)", 20, 80, 40)
            traffic = st.selectbox("Traffic level", ["Light traffic", "Moderate traffic", "Heavy traffic"], index=1)
            terrain = st.selectbox("Road type", ["City roads", "Highway", "Rough roads", "Hill roads"], index=0)
        with preference_tab:
            ride_mode = st.radio("Ride mode", ["Eco", "Normal", "Sport"], horizontal=True, index=1)
            rider_weight_kg = st.slider("Rider weight (kg)", 35, 130, 70)
            passenger_count = st.selectbox("Passengers", [0, 1, 2], index=0)
            luggage_kg = st.slider("Bag/luggage weight (kg)", 0, 40, 3)
            destination_type = st.selectbox("Trip purpose", ["College", "Office", "Shopping", "Long ride", "Emergency"], index=0)

    if "temperature" not in locals():
        temperature = int(df["temp_c"].median())
        weather = df["weather"].mode().iloc[0]
        battery_health = int(df["battery_health"].median())
        speed_kmph = 40
        traffic = "Moderate traffic"
        terrain = "City roads"
        ride_mode = "Normal"
        rider_weight_kg = 70
        passenger_count = 0
        luggage_kg = 3
        destination_type = "College"

    prediction = predict_range(
        df,
        battery_level,
        temperature,
        weather,
        battery_health,
        speed_kmph=speed_kmph,
        vehicle_base_range_km=vehicle["base_range_km"],
        ride_mode=ride_mode,
        terrain=terrain,
        traffic=traffic,
        rider_weight_kg=rider_weight_kg,
        passenger_count=passenger_count,
        luggage_kg=luggage_kg,
    )
    readiness_title, readiness_copy = travel_readiness(prediction["predicted_range_km"])
    stations = rank_nearby_stations(df, current_lat, current_lon)
    best_station = best_station_summary(stations)
    wait_minutes = float(best_station["wait_minutes"])
    charge_minutes = predict_charge_time(
        df,
        battery_level,
        best_station["rate_kw"],
        best_station["load_kw"],
        battery_health,
        target_level=80,
        charge_bias=vehicle["fast_charge_bias"],
    )
    full_charge_minutes = predict_charge_time(
        df,
        battery_level,
        best_station["rate_kw"],
        best_station["load_kw"],
        battery_health,
        target_level=100,
        charge_bias=vehicle["full_charge_bias"],
    )
    charge_gain_range = max(
        0.0,
        estimate_charge_gain_km(
        80,
        weather,
        temperature,
        battery_health,
        speed_kmph=speed_kmph,
        vehicle_base_range_km=vehicle["base_range_km"],
        ride_mode=ride_mode,
        terrain=terrain,
        traffic=traffic,
        rider_weight_kg=rider_weight_kg,
        passenger_count=passenger_count,
        luggage_kg=luggage_kg,
    )
        - prediction["predicted_range_km"],
    )

    if prediction["predicted_range_km"] >= destination_km * 1.2:
        main_title = "You can go without charging."
        main_copy = "Your current battery looks enough for this ride."
        alert_level = None
        alert_message = None
    elif prediction["predicted_range_km"] >= destination_km:
        main_title = "You can go, but charging first is safer."
        main_copy = "Your battery is close to enough, but a short charge would be safer."
        alert_level = "warning"
        alert_message = "Battery is enough, but charging first is recommended for a safer ride."
    else:
        main_title = "Charge before you leave."
        main_copy = "Your current battery is not enough for this ride."
        alert_level = "error"
        alert_message = "Battery is not enough for this ride. Please connect to a charger before leaving."

    if battery_level <= 10:
        alert_level = "error"
        alert_message = "Critical battery level. Connect to a charger immediately."
    elif battery_level <= 20 and alert_level is None:
        alert_level = "warning"
        alert_message = "Low battery. Consider charging soon."

    with decision_col:
        render_input_summary(
            "Current ride profile",
            [
                ("Vehicle", vehicle_model),
                ("Purpose", destination_type),
                ("Mode", ride_mode),
                ("Road", terrain),
                ("Traffic", traffic),
                ("Load", f"{rider_weight_kg + passenger_count * 55 + luggage_kg:.0f} kg"),
            ],
        )
        if alert_level == "error":
            st.error(alert_message)
        elif alert_level == "warning":
            st.warning(alert_message)
        render_decision(main_title, main_copy)
        user = st.session_state.get("current_user")
        if user and user.get("id"):
            if st.button("Save charging session", use_container_width=True, key="save_history_home"):
                estimated_energy = round(max(prediction["full_charge_range_km"] - prediction["predicted_range_km"], 0.0) * 0.03, 1)
                save_user_history_entry(
                    user_id=user["id"],
                    station_name=best_station["name"],
                    battery_percent=battery_level,
                    battery_health=battery_health,
                    charge_minutes=full_charge_minutes,
                    wait_minutes=wait_minutes,
                    energy_drawn_kwh=estimated_energy,
                    weather=weather,
                    session_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                )
                st.success("Saved to charging history.")

    metrics = st.columns(4)
    with metrics[0]:
        render_metric_card("Battery", f"{battery_level}%", "Your current battery level.", "info")
    with metrics[1]:
        render_metric_card("How Far You Can Go", f"{prediction['predicted_range_km']} km", "Estimated bike range right now.", "success")
    with metrics[2]:
        render_metric_card("At Full Charge", f"{prediction['full_charge_range_km']} km", "Estimated range at 100% charge.", "success")
    with metrics[3]:
        render_metric_card("Full Charge Time", _format_minutes_hms(full_charge_minutes), "Estimated time to reach 100%.", "warning")

    health_cols = st.columns(3)
    with health_cols[0]:
        render_progress_card("Battery Health", battery_health, "Lower health reduces practical range.", "success")
    with health_cols[1]:
        render_progress_card("Efficiency Score", prediction["performance_score"], "Combined impact of weather, road, load, mode, and speed.", "info")
    with health_cols[2]:
        reserve_score = min(100, max(0, prediction["predicted_range_km"] / max(destination_km * 1.2, 1) * 100))
        render_progress_card("Trip Coverage", reserve_score, "How comfortably your predicted range covers this ride.", "warning")

    if battery_level >= 100:
        charging_summary = "Your battery is already full. No charging is needed right now."
    elif battery_level >= 80:
        charging_summary = f"Your battery is already above 80%. A full charge to 100% may take about {full_charge_minutes} minutes if you still want to top up."
    else:
        charging_summary = (
            f"If you decide to charge later, a quick charge to 80% is estimated at about {charge_minutes} minutes and may add roughly "
            f"{charge_gain_range:.0f} km of range. A full charge to 100% may take about {full_charge_minutes} minutes."
        )

    render_panel("Charging summary", charging_summary)
