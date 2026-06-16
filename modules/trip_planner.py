import streamlit as st

from services.geocoding_service import geocode_place, get_offline_place_options
from services.prediction_service import predict_charge_time, predict_range
from services.trip_service import evaluate_trip
from services.vehicle_service import get_vehicle_models, get_vehicle_profile
from ui.components import render_decision, render_hero, render_input_summary, render_metric_card, render_panel, render_progress_card
from utils.data_loader import load_data


def run():
    df = load_data()
    render_hero(
        "Plan my trip",
        "Start with your battery and destination. The app should quickly tell you whether the trip is safe or whether you should charge first.",
        "Plan My Trip",
    )

    controls, summary = st.columns((0.95, 1.25))
    with controls:
        st.subheader("Trip inputs")
        route_tab, vehicle_tab, condition_tab = st.tabs(["Route", "Vehicle", "Conditions"])
        with route_tab:
            place_options = ["Type manually"] + get_offline_place_options()
            current_place_choice = st.selectbox("Current place", place_options, index=place_options.index("Kochi"))
            if current_place_choice == "Type manually":
                current_place = st.text_input("Type current place", value="Kochi", key="trip_current_manual")
            else:
                current_place = current_place_choice

            destination_place_choice = st.selectbox("Destination", place_options, index=place_options.index("Thrissur"))
            if destination_place_choice == "Type manually":
                destination_place = st.text_input("Type destination", value="Thrissur", key="trip_destination_manual")
            else:
                destination_place = destination_place_choice
            route_preference = st.radio("Route preference", ["Shortest", "Balanced", "Safer with reserve"], horizontal=True, index=1)
            required_arrival_range_km = st.slider("Minimum range after arrival (km)", 5, 40, 12)
        with vehicle_tab:
            vehicle_model = st.selectbox("Vehicle model", get_vehicle_models(), index=0, key="trip_vehicle")
            vehicle = get_vehicle_profile(vehicle_model)
            battery_level = st.slider("Battery level (%)", 0, 100, int(df["soc"].median()), key="trip_battery")
            battery_health = st.slider("Battery health (%)", 50, 100, int(df["battery_health"].median()), key="trip_health")
            ride_mode = st.radio("Ride mode", ["Eco", "Normal", "Sport"], horizontal=True, index=1, key="trip_ride_mode")
            rider_weight_kg = st.slider("Rider weight (kg)", 35, 130, 70, key="trip_rider_weight")
            passenger_count = st.selectbox("Passengers", [0, 1, 2], index=0, key="trip_passengers")
            luggage_kg = st.slider("Bag/luggage weight (kg)", 0, 40, 3, key="trip_luggage")
        with condition_tab:
            temperature = st.slider("Temperature (C)", -5, 50, int(df["temp_c"].median()), key="trip_temp")
            weather = st.selectbox("Weather", sorted(df["weather"].dropna().unique()), index=0, key="trip_weather")
            speed_kmph = st.slider("Average riding speed (km/h)", 20, 80, 40, key="trip_speed")
            traffic = st.selectbox("Traffic level", ["Light traffic", "Moderate traffic", "Heavy traffic"], index=1, key="trip_traffic")
            terrain = st.selectbox("Road type", ["City roads", "Highway", "Rough roads", "Hill roads"], index=0, key="trip_terrain")
            st.caption("If place search does not work, enter coordinates manually below.")
            current_lat = st.number_input("Current latitude", value=float(df["current_lat"].median()), format="%.6f")
            current_lon = st.number_input("Current longitude", value=float(df["current_lon"].median()), format="%.6f")
            destination_lat = st.number_input("Destination latitude", value=float(df["dest_lat"].median()), format="%.6f")
            destination_lon = st.number_input("Destination longitude", value=float(df["dest_lon"].median()), format="%.6f")

    if "battery_health" not in locals():
        battery_health = int(df["battery_health"].median())
        temperature = int(df["temp_c"].median())
        weather = df["weather"].mode().iloc[0]
        speed_kmph = 40
        traffic = "Moderate traffic"
        terrain = "City roads"
        ride_mode = "Normal"
        rider_weight_kg = 70
        passenger_count = 0
        luggage_kg = 3
        route_preference = "Balanced"
        required_arrival_range_km = 12
        current_lat = float(df["current_lat"].median())
        current_lon = float(df["current_lon"].median())
        destination_lat = float(df["dest_lat"].median())
        destination_lon = float(df["dest_lon"].median())

    current_result = geocode_place(current_place)
    destination_result = geocode_place(destination_place)

    if current_result.status == "success":
        current_lat = current_result.lat
        current_lon = current_result.lon
        st.success(f"Current place: {current_result.message}")
    elif current_result.status != "empty":
        st.warning(f"Current place: {current_result.message}")

    if destination_result.status == "success":
        destination_lat = destination_result.lat
        destination_lon = destination_result.lon
        st.success(f"Destination: {destination_result.message}")
    elif destination_result.status != "empty":
        st.warning(f"Destination: {destination_result.message}")

    if current_result.status != "success" or destination_result.status != "success":
        st.info("Trip distance will appear after both places are resolved. You can also open Advanced trip settings and enter coordinates manually.")
        return

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
    safety_buffer_percent = {"Shortest": 10.0, "Balanced": 15.0, "Safer with reserve": 25.0}[route_preference]
    trip = evaluate_trip(
        df,
        current_lat,
        current_lon,
        destination_lat,
        destination_lon,
        prediction["predicted_range_km"],
        required_arrival_range_km=required_arrival_range_km,
        safety_buffer_percent=safety_buffer_percent,
    )
    backup = trip["backup_station"]
    quick_charge_minutes = predict_charge_time(
        df,
        battery_level,
        backup["rate_kw"],
        backup["rate_kw"] * 0.75,
        battery_health,
        target_level=80,
        charge_bias=vehicle["fast_charge_bias"],
    )

    with summary:
        render_input_summary(
            "Route profile",
            [
                ("From", current_result.label or current_place),
                ("To", destination_result.label or destination_place),
                ("Vehicle", vehicle_model),
                ("Preference", route_preference),
                ("Arrival reserve", f"{required_arrival_range_km} km"),
                ("Mode", ride_mode),
            ],
            "success",
        )
        cards = st.columns(4)
        with cards[0]:
            render_metric_card("Trip Distance", f"{trip['trip_distance_km']} km", "Straight-line estimate between current and destination coordinates.", "info")
        with cards[1]:
            render_metric_card("Range Needed", f"{trip['needed_range_km']} km", "Includes a safety buffer for practical driving.", "warning")
        with cards[2]:
            render_metric_card("Predicted Range", f"{prediction['predicted_range_km']} km", f"Estimated range for {vehicle_model}.", "success")
        with cards[3]:
            render_metric_card("Range Left", f"{trip['remaining_range_km']} km", "Estimated remaining range after arrival.", "info")

        if trip["decision"] == "Trip is safe":
            body = f"You have enough battery for this trip with a safety buffer. You should still arrive with about {trip['remaining_range_km']} km of range left."
        elif trip["decision"] == "Trip is possible":
            body = f"You can make the trip, but the safety margin is small. Charging briefly first would make the trip more comfortable."
        else:
            body = f"This trip is risky with the current battery. Charging before you leave is the safer choice."

        render_decision(trip["decision"], body)
        insight_cols = st.columns(2)
        with insight_cols[0]:
            render_progress_card("Efficiency Score", prediction["performance_score"], "Weather, speed, load, road, and mode combined.", "info")
        with insight_cols[1]:
            reserve_score = min(100, max(0, prediction["predicted_range_km"] / max(trip["needed_range_km"], 1) * 100))
            render_progress_card("Safety Coverage", reserve_score, "How well current range covers trip plus reserve.", "warning")
        render_panel(
            "If you want to charge first",
            f"{backup['name']} is the best nearby fallback. It is about {backup['distance_km']} km away with an estimated "
            f"{backup['wait_minutes']} minute wait, {backup['free_slots']} free slots, and {backup['rate_kw']} kW charging speed. "
            f"A quick charge to 80% is estimated at about {quick_charge_minutes} minutes.",
        )
