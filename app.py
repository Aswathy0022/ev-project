from pathlib import Path

import streamlit as st

from modules import charging, dashboard, history, trip_planner
from services.auth_service import continue_as_guest, init_auth_state, login_user, logout, set_auth_mode, signup_user
from services.db_service import init_database
from services.seed_service import seed_history_for_user
from ui.styles import load_css
from utils.data_loader import load_data


HERO_IMAGE = Path(__file__).resolve().parent / "assets" / "evimage.png"

st.set_page_config(
    page_title="VoltIQ EV Assistant",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

load_css()
init_database()
init_auth_state()


def render_auth_header(eyebrow: str, title: str, subtitle: str) -> None:
    st.markdown(
        f"""
        <div class="hero-card">
            <div class="hero-eyebrow">{eyebrow}</div>
            <div class="hero-title">{title}</div>
            <div class="hero-subtitle">{subtitle}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_welcome_screen() -> None:
    st.markdown('<div class="landing-shell">', unsafe_allow_html=True)
    nav_left, nav_right = st.columns((1.2, 1))
    with nav_left:
        st.markdown(
            """
            <div class="landing-nav">
                <div class="landing-brand">VoltIQ</div>
                <div class="landing-links">
                    <span>Features</span>
                    <span>About</span>
                    <span>Support</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with nav_right:
        nav_buttons = st.columns(3)
        with nav_buttons[0]:
            if st.button("Login", use_container_width=True, key="nav_login"):
                set_auth_mode("login")
                st.rerun()
        with nav_buttons[1]:
            if st.button("Sign Up", use_container_width=True, key="nav_signup"):
                set_auth_mode("signup")
                st.rerun()
        with nav_buttons[2]:
            if st.button("Guest", use_container_width=True, type="primary", key="nav_guest"):
                continue_as_guest()
                st.rerun()

    hero_left, hero_right = st.columns((1.15, 0.85))
    with hero_left:
        st.markdown(
            """
            <div class="landing-hero">
                <div class="auth-kicker">Smart EV Bike Assistant</div>
                <div class="landing-title">Plan every ride with more confidence.</div>
                <div class="landing-copy">Check whether your battery is enough, estimate realistic EV bike range, and make better charging decisions in a cleaner desktop app experience.</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        action_cols = st.columns(2)
        with action_cols[0]:
            if st.button("Get started", use_container_width=True, type="primary", key="hero_get_started"):
                continue_as_guest()
                st.rerun()
        with action_cols[1]:
            if st.button("Create account", use_container_width=True, key="hero_create_account"):
                set_auth_mode("signup")
                st.rerun()
    with hero_right:
        if HERO_IMAGE.exists():
            st.image(str(HERO_IMAGE), use_container_width=True)

    st.markdown(
        """
        <div class="landing-feature-grid">
            <div class="landing-feature"><strong>Battery check</strong><span>See quickly whether you can ride now or should charge first.</span></div>
            <div class="landing-feature"><strong>Trip planner</strong><span>Estimate whether the current battery is enough for your destination.</span></div>
            <div class="landing-feature"><strong>Charger finder</strong><span>Explore local charger suggestions in a cleaner desktop flow.</span></div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.markdown('</div>', unsafe_allow_html=True)


def render_login_screen() -> None:
    st.markdown('<div class="desktop-auth-shell">', unsafe_allow_html=True)
    left, right = st.columns((1.0, 1.0))
    with left:
        st.markdown(
            """
            <div class="desktop-auth-card">
                <div class="auth-kicker">Login</div>
                <div class="desktop-auth-title">Welcome back to VoltIQ.</div>
                <div class="desktop-auth-copy">Sign in to continue to your EV bike assistant. Guest mode is still available from the welcome page.</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if HERO_IMAGE.exists():
            st.image(str(HERO_IMAGE), width=500)
    with right:
        st.markdown('<div class="auth-form-wrap" style="max-width:520px;"><div class="auth-card">', unsafe_allow_html=True)
        st.markdown(
            """
            <div class="auth-kicker">Account access</div>
            <div class="auth-card-title">Sign in</div>
            <div class="auth-card-copy">Enter your email and password.</div>
            """,
            unsafe_allow_html=True,
        )
        with st.form("login_form", clear_on_submit=False):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Login", use_container_width=True, type="primary")
        action_cols = st.columns(2)
        with action_cols[0]:
            back_clicked = st.button("Back", use_container_width=True)
        with action_cols[1]:
            create_clicked = st.button("Create Account", use_container_width=True)
        st.markdown('<div class="auth-note">Use the account you created during sign up.</div></div></div>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    if back_clicked:
        set_auth_mode("welcome")
        st.rerun()
    if create_clicked:
        set_auth_mode("signup")
        st.rerun()
    if submitted:
        ok, message = login_user(email, password)
        if ok:
            user = st.session_state.get("current_user")
            if user and user.get("id"):
                seed_history_for_user(user["id"], load_data())
            st.success(message)
            st.rerun()
        st.error(message)


def render_signup_screen() -> None:
    st.markdown('<div class="desktop-auth-shell">', unsafe_allow_html=True)
    left, right = st.columns((1.0, 1.0))
    with left:
        st.markdown(
            """
            <div class="desktop-auth-card">
                <div class="auth-kicker">Sign Up</div>
                <div class="desktop-auth-title">Create your VoltIQ account.</div>
                <div class="desktop-auth-copy">Create a lightweight account for a more realistic product experience on desktop.</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if HERO_IMAGE.exists():
            st.image(str(HERO_IMAGE), width=500)
    with right:
        st.markdown('<div class="auth-form-wrap" style="max-width:520px;"><div class="auth-card">', unsafe_allow_html=True)
        st.markdown(
            """
            <div class="auth-kicker">Create account</div>
            <div class="auth-card-title">Sign up</div>
            <div class="auth-card-copy">Enter a few details to get started.</div>
            """,
            unsafe_allow_html=True,
        )
        with st.form("signup_form", clear_on_submit=False):
            name = st.text_input("Name")
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            confirm_password = st.text_input("Confirm Password", type="password")
            submitted = st.form_submit_button("Create Account", use_container_width=True, type="primary")
        action_cols = st.columns(2)
        with action_cols[0]:
            back_clicked = st.button("Back", use_container_width=True)
        with action_cols[1]:
            login_clicked = st.button("Already have an account?", use_container_width=True)
        st.markdown('<div class="auth-note">Your account is stored locally for this project demo.</div></div></div>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    if back_clicked:
        set_auth_mode("welcome")
        st.rerun()
    if login_clicked:
        set_auth_mode("login")
        st.rerun()
    if submitted:
        if password != confirm_password:
            st.error("Passwords do not match.")
        else:
            ok, message = signup_user(name, email, password)
            if ok:
                user = st.session_state.get("current_user")
                if user and user.get("id"):
                    seed_history_for_user(user["id"], load_data())
                st.success(message)
                st.rerun()
            st.error(message)


def render_main_app() -> None:
    user = st.session_state.get("current_user") or {"name": "Guest", "mode": "guest"}
    st.sidebar.markdown("<div class='sidebar-brand'>VoltIQ</div>", unsafe_allow_html=True)
    st.sidebar.markdown(
        "<div class='sidebar-caption'>Smart EV charging and trip assistant</div>",
        unsafe_allow_html=True,
    )
    st.sidebar.markdown(
        f"<div class='panel-card' style='padding:0.9rem 1rem; margin-bottom:1rem;'><div class='panel-title' style='margin-bottom:0.2rem;'>Hello, {user['name']}</div><div class='panel-copy'>Mode: {'Guest' if user['mode'] == 'guest' else 'Signed in'}</div></div>",
        unsafe_allow_html=True,
    )
    menu_options = [
        "Home",
        "Plan My Trip",
        "Find Charger",
    ]
    if user["mode"] != "guest":
        menu_options.append("History")

    menu = st.sidebar.radio(
        "Navigate",
        menu_options,
    )
    if st.sidebar.button("Logout", use_container_width=True):
        logout()
        st.rerun()

    if menu == "Home":
        dashboard.run()
    elif menu == "Plan My Trip":
        trip_planner.run()
    elif menu == "Find Charger":
        charging.run()
    elif menu == "History":
        history.run()


if st.session_state["auth_status"] in {"authenticated", "guest"}:
    render_main_app()
else:
    mode = st.session_state["auth_mode"]
    if mode == "login":
        render_login_screen()
    elif mode == "signup":
        render_signup_screen()
    else:
        render_welcome_screen()
