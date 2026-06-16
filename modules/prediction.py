import streamlit as st

from services.prediction_service import (
    predict_charge_time,
    predict_range,
    predict_wait_time,
    station_load_status,
)
from ui.components import render_badge, render_decision, render_hero, render_metric_card, render_panel
from utils.data_loader import load_data


def run():
    df = load_data()
    render_hero(
        "Smart range and charging prediction",
        "Let the user set battery, weather, crowd, and station conditions, then return the EV decision in one screen.",
        "Smart Range",
    )

    left, right = st.columns((0.95, 1.25))

    with left:
        st.markdown("### Input panel")
        battery_level = st.slider("Battery level (%)", 0, 100, int(df["soc"].median()))
        temperature = st.slider("Temperature (C)", -5, 50, int(df["temp_c"].median()))
        weather = st.selectbox("Weather", sorted(df["weather"].dropna().unique()), index=0)
        crowd = st.slider("Crowd at station (vehicles)", 0, 40, int(df["vehicles"].median()))
        slots = st.slider("Station slots", 1, 30, max(1, int(df["slots"].median())))
        charging_rate = st.slider("Charging rate (kW)", 10, 150, int(df["charging_rate_kw"].median()))
        charging_load = st.slider("Charging load (kW)", 5, 180, int(df["charging_load_kw"].median()))
        battery_health = st.slider("Battery health (%)", 50, 100, int(df["battery_health"].median()))

    prediction = predict_range(df, battery_level, temperature, weather, battery_health)
    wait_minutes = predict_wait_time(df, crowd, slots, hour=18)
    charge_minutes = predict_charge_time(df, battery_level, charging_rate, charging_load, battery_health)
    load_status, load_tone = station_load_status(charging_load, charging_rate)

    with right:
        cards = st.columns(3)
        with cards[0]:
            render_metric_card("Predicted Range", f"{prediction['predicted_range_km']} km", "Expected usable driving range.", "success")
        with cards[1]:
            render_metric_card("Charging Time", f"{charge_minutes} min", "Estimated time to reach 90%.", "info")
        with cards[2]:
            render_metric_card("Waiting Time", f"{wait_minutes} min", "Queue estimate based on station crowd.", "warning")

        badges = [
            render_badge(f"Battery performance {prediction['performance_score']}%", "success"),
            render_badge(load_status, load_tone),
        ]
        render_panel(
            "Prediction summary",
            f"At {battery_level}% battery in {temperature} C weather, the vehicle is expected to travel about "
            f"{prediction['predicted_range_km']} km. Charging conditions look {load_status.lower()}, and the station queue "
            f"should take around {wait_minutes} minutes before charging starts.",
            badges,
        )

        if prediction["predicted_range_km"] >= 220 and wait_minutes <= 12:
            title = "This looks like a convenient charging stop."
            body = "Battery performance is stable, queue pressure is not high, and the station load is within a healthy range."
        elif prediction["predicted_range_km"] >= 120:
            title = "You can keep driving, but charging soon is smart."
            body = "The vehicle still has useful range, but topping up now would reduce risk for longer trips or heavy traffic."
        else:
            title = "Charging is recommended before a longer drive."
            body = "Current range is limited enough that a short charge now would significantly improve flexibility."

        render_decision(title, body)
