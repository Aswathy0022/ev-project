from __future__ import annotations

import hashlib

import streamlit as st

from services.db_service import next_id, read_db, write_db


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def init_auth_state() -> None:
    st.session_state.setdefault("auth_mode", "welcome")
    st.session_state.setdefault("auth_status", "logged_out")
    st.session_state.setdefault("current_user", None)


def set_auth_mode(mode: str) -> None:
    st.session_state["auth_mode"] = mode


def continue_as_guest() -> None:
    st.session_state["auth_status"] = "guest"
    st.session_state["current_user"] = {"id": None, "name": "Guest", "email": None, "mode": "guest"}


def logout() -> None:
    st.session_state["auth_status"] = "logged_out"
    st.session_state["current_user"] = None
    st.session_state["auth_mode"] = "welcome"


def signup_user(name: str, email: str, password: str) -> tuple[bool, str]:
    name = name.strip()
    email = email.strip().lower()
    if not name or not email or not password:
        return False, "Fill in name, email, and password."
    data = read_db()
    if any(user["email"] == email for user in data["users"]):
        return False, "An account with this email already exists."
    user_id = next_id(data["users"])
    data["users"].append(
        {
            "id": user_id,
            "name": name,
            "email": email,
            "password_hash": _hash_password(password),
        }
    )
    write_db(data)
    st.session_state["auth_status"] = "authenticated"
    st.session_state["current_user"] = {"id": user_id, "name": name, "email": email, "mode": "user"}
    return True, "Account created successfully."


def login_user(email: str, password: str) -> tuple[bool, str]:
    email = email.strip().lower()
    password_hash = _hash_password(password)
    data = read_db()
    user = next((user for user in data["users"] if user["email"] == email), None)
    if user and user["password_hash"] == password_hash:
        st.session_state["auth_status"] = "authenticated"
        st.session_state["current_user"] = {"id": user["id"], "name": user["name"], "email": user["email"], "mode": "user"}
        return True, "Login successful."
    return False, "Invalid email or password."
