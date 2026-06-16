import streamlit as st

from services.geocoding_service import geocode_place, get_offline_place_options
from services.station_service import catalog_region_summary, haversine_km, load_station_catalog, rank_catalog_stations
from ui.components import render_hero, render_input_summary, render_metric_card, render_station_card


CITY_ALIASES = {
    "kovai": "coimbatore",
    "coimbatore": "coimbatore",
    "trichy": "tiruchirappalli",
    "tiruchirappalli": "tiruchirappalli",
    "thoothukudi": "thoothukudi",
    "tuticorin": "thoothukudi",
    "udhagamandalam": "ooty",
    "ooty": "ooty",
    "madras": "chennai",
    "chennai": "chennai",
}


def _canonical_city_name(place_name: str) -> str:
    base = (place_name or "").split(",")[0].strip().lower()
    return CITY_ALIASES.get(base, base)


def run():
    catalog = load_station_catalog()
    render_hero(
        "Find a charger",
        "See the best charging options nearby without digging through too much technical information. Tamil Nadu station support is built in.",
        "Find Charger",
    )

    controls, results = st.columns((0.9, 1.4))
    with controls:
        st.subheader("Charger inputs")
        location_tab, filter_tab, comfort_tab = st.tabs(["Location", "Filters", "Comfort"])
        with location_tab:
            place_options = ["Type manually"] + get_offline_place_options()
            default_choice = st.session_state.get("charger_place_choice", "Coimbatore")
            if default_choice not in place_options:
                default_choice = "Coimbatore"
            current_place_choice = st.selectbox(
                "Where are you now?",
                place_options,
                index=place_options.index(default_choice),
                key="charger_place_choice",
            )
            if current_place_choice == "Type manually":
                current_place = st.text_input("Type your place", value=st.session_state.get("charger_current_manual", ""), key="charger_current_manual")
            else:
                current_place = current_place_choice
            priority = st.selectbox("Show me the", ["Best overall option", "Nearest charger", "Fastest charger", "Least waiting"], key="charger_priority")
        with filter_tab:
            max_distance_km = st.slider("Maximum distance (km)", 1, 80, 25)
            minimum_rate_kw = st.slider("Minimum charger speed (kW)", 20, 70, 35, step=5)
            available_only = st.checkbox("Show available chargers only", value=True)
            connector_type = st.selectbox("Connector type", ["Any", "Fast DC", "Type 2", "Bharat AC"], index=0)
        with comfort_tab:
            payment_method = st.selectbox("Payment method", ["Any", "UPI", "Card", "App wallet"], index=0)
            need_amenities = st.multiselect("Nearby facilities", ["Restroom", "Tea/Cafe", "Parking", "24x7 access"], default=["Parking"])
            max_wait_minutes = st.slider("Maximum waiting time (min)", 0, 45, 20)
            st.caption("Use coordinates only if place search is unavailable.")
            user_lat = st.number_input("Current latitude", value=11.0168, format="%.6f", key="charger_lat")
            user_lon = st.number_input("Current longitude", value=76.9558, format="%.6f", key="charger_lon")

    if "user_lat" not in locals():
        user_lat = 11.0168
        user_lon = 76.9558

    current_result = geocode_place(current_place)
    if current_result.status == "success":
        user_lat = current_result.lat
        user_lon = current_result.lon
        st.success(f"Current place: {current_result.message}")
    elif current_result.status != "empty":
        st.warning(f"Current place: {current_result.message}")

    if current_result.status != "success":
        st.info("Nearby charger results will appear after your place is resolved. You can also use Advanced location input.")
        return

    region = catalog_region_summary(catalog)
    region_distance = haversine_km(user_lat, user_lon, region["center_lat"], region["center_lon"])
    if region_distance > max(250, region["coverage_radius_km"] + 100):
        st.warning(
            "The current Tamil Nadu charging-station dataset does not cover this place yet."
        )
        st.info(
            "Right now this page supports Tamil Nadu station locations. Add more station coordinates if you want Kerala or other states too."
        )
        return

    stations = rank_catalog_stations(catalog, user_lat, user_lon)
    selected_city = _canonical_city_name(current_result.label or current_place)
    same_city_stations = stations[stations["city"].str.lower().map(_canonical_city_name) == selected_city]
    if not same_city_stations.empty:
        stations = same_city_stations.reset_index(drop=True)

    if available_only:
        stations = stations[(stations["free_slots"] > 0) | (stations["status"].str.lower() == "available")]
    stations = stations[
        (stations["distance_km"] <= max_distance_km)
        & (stations["rate_kw"] >= minimum_rate_kw)
        & (stations["wait_minutes"] <= max_wait_minutes)
    ].reset_index(drop=True)

    if connector_type == "Fast DC":
        stations = stations[stations["rate_kw"] >= 45].reset_index(drop=True)
    elif connector_type == "Type 2":
        stations = stations[(stations["rate_kw"] >= 35) & (stations["rate_kw"] <= 55)].reset_index(drop=True)
    elif connector_type == "Bharat AC":
        stations = stations[stations["rate_kw"] <= 45].reset_index(drop=True)

    if stations.empty:
        st.warning("No charger matched those filters. Try increasing distance, wait time, or lowering minimum speed.")
        return

    if priority == "Nearest charger":
        stations = stations.sort_values("distance_km")
    elif priority == "Fastest charger":
        stations = stations.sort_values(["rate_kw", "distance_km"], ascending=[False, True])
    elif priority == "Least waiting":
        stations = stations.sort_values(["wait_minutes", "distance_km"])

    top_three = stations.head(3).reset_index(drop=True)

    with results:
        render_input_summary(
            "Search preferences",
            [
                ("Place", current_result.label or current_place),
                ("Priority", priority),
                ("Connector", connector_type),
                ("Payment", payment_method),
                ("Max distance", f"{max_distance_km} km"),
                ("Facilities", ", ".join(need_amenities) if need_amenities else "No preference"),
            ],
            "info",
        )
        st.caption(f"Showing chargers near {current_result.label or current_place}")
        metrics = st.columns(3)
        with metrics[0]:
            render_metric_card("Nearest Option", f"{top_three.iloc[0]['distance_km']:.1f} km", "Closest good charger nearby.", "info")
        with metrics[1]:
            render_metric_card("Shortest Wait", f"{top_three['wait_minutes'].min():.1f} min", "Estimated shortest queue nearby.", "success")
        with metrics[2]:
            render_metric_card("Fastest Speed", f"{top_three['rate_kw'].max():.1f} kW", "Highest charging speed among top options.", "warning")

        tones = ["info", "success", "warning"]
        labels = ["Best choice", "Good alternative", "Another option"]
        for idx, row in top_three.iterrows():
            render_station_card(
                row["station_name"],
                labels[idx],
                [
                    f"City: {row['city']}",
                    f"Distance: {row['distance_km']:.1f} km",
                    f"Estimated wait: {row['wait_minutes']:.1f} min",
                    f"Free slots: {int(row['free_slots'])}/{int(row['total_slots'])}",
                    f"Charging speed: {row['rate_kw']:.1f} kW",
                    f"Station load: {row['load_kw']:.1f} kW",
                ],
                tones[idx],
            )

        with st.expander("Detailed charger comparison"):
            table = top_three[
                ["station_name", "city", "distance_km", "wait_minutes", "free_slots", "total_slots", "rate_kw", "load_kw", "status"]
            ].rename(
                columns={
                    "station_name": "Station",
                    "city": "City",
                    "distance_km": "Distance (km)",
                    "wait_minutes": "Wait (min)",
                    "free_slots": "Free Slots",
                    "total_slots": "Total Slots",
                    "rate_kw": "Rate (kW)",
                    "load_kw": "Load (kW)",
                    "status": "Status",
                }
            )
            st.dataframe(table, use_container_width=True, hide_index=True)
