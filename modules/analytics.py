import streamlit as st

from ui.components import render_hero, render_metric_card
from utils.data_loader import load_data


def run():
    df = load_data()
    render_hero(
        "Insights and behavior trends",
        "Use analytics to explain how weather, crowd, and station load influence EV charging decisions.",
        "Insights",
    )

    top = st.columns(4)
    with top[0]:
        render_metric_card("Avg Trip Distance", f"{df['destination_distance_km'].median():.1f} km", "Typical destination distance in the dataset.", "info")
    with top[1]:
        render_metric_card("Avg Wait", f"{df['queue_minutes'].mean():.1f} min", "Typical queue delay before charging.", "warning")
    with top[2]:
        render_metric_card("Avg Charge Time", f"{df['charge_minutes'].mean():.1f} min", "Typical charging duration per session.", "success")
    with top[3]:
        render_metric_card("Avg Battery Health", f"{df['battery_health'].mean():.1f}%", "Typical overall battery condition.", "success")

    left, right = st.columns(2)
    with left:
        st.subheader("Temperature vs battery health")
        st.line_chart(df.groupby("temp_c")["battery_health"].mean().sort_index())
        st.subheader("Crowd vs waiting time")
        st.line_chart(df.groupby("vehicles")["queue_minutes"].mean().sort_index())

    with right:
        st.subheader("Charging load vs charge time")
        st.line_chart(df.groupby("charging_load_kw")["charge_minutes"].mean().sort_index())
        st.subheader("Sessions by hour")
        st.bar_chart(df.groupby("session_hour").size())
