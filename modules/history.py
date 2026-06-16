import streamlit as st

from services.history_service import load_user_history, user_history_summary
from ui.components import render_hero, render_metric_card


def run():
    user = st.session_state.get("current_user")
    if not user or not user.get("id"):
        st.warning("Sign in to view your saved charging history.")
        return

    summary = user_history_summary(user["id"])
    history = load_user_history(user["id"], limit=20)

    render_hero(
        "Charging history",
        "A simple record of your previous charging sessions, energy used, and typical waiting time.",
        "History",
    )

    cols = st.columns(4)
    with cols[0]:
        render_metric_card("Sessions", str(summary["sessions"]), "Total charging records available in the dataset.", "info")
    with cols[1]:
        render_metric_card("Energy Charged", f"{summary['energy_kwh']} kWh", "Total energy drawn across sessions.", "success")
    with cols[2]:
        render_metric_card("Average Wait", f"{summary['avg_wait']} min", "Typical queue time before charging begins.", "warning")
    with cols[3]:
        render_metric_card("Favorite Station", summary["favorite_station"], "Most frequently used charging station.", "info")

    st.subheader("Recent sessions")
    if history.empty:
        st.info("No charging history is saved for this account yet.")
    else:
        st.dataframe(history, use_container_width=True, hide_index=True)
