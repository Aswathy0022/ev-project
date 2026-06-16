from __future__ import annotations

from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    mode: str = "user"
    is_admin: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Prediction ────────────────────────────────────────────────────────────────

class RangeRequest(BaseModel):
    battery_level: float
    temperature: float
    weather: str
    battery_health: float
    speed_kmph: float | None = None
    vehicle_base_range_km: float | None = None
    ride_mode: str | None = "Normal"
    terrain: str | None = "City roads"
    traffic: str | None = "Moderate traffic"
    rider_weight_kg: float | None = None
    passenger_count: int = 0
    luggage_kg: float = 0.0


class RangeResponse(BaseModel):
    predicted_range_km: float
    full_charge_range_km: float
    performance_score: float
    efficiency_factor: float


class ChargeTimeRequest(BaseModel):
    battery_level: float
    charging_rate_kw: float
    charging_load_kw: float
    battery_health: float
    target_level: float = 90.0
    charge_bias: float = 1.0


class WaitTimeRequest(BaseModel):
    crowd: int
    slots: int
    hour: int


class TravelReadinessRequest(BaseModel):
    predicted_range_km: float
    trip_distance_km: float | None = None


# ── Stations ──────────────────────────────────────────────────────────────────

class StationRankRequest(BaseModel):
    user_lat: float
    user_lon: float
    max_distance_km: float | None = None
    min_rate_kw: float | None = None
    sort_by: str = "score"


class StationOut(BaseModel):
    id: int | None = None
    station_name: str
    city: str
    latitude: float
    longitude: float
    distance_km: float = 0.0
    free_slots: int
    total_slots: int
    wait_minutes: float
    rate_kw: float
    load_kw: float
    status: str
    score: float = 0.0


class StationIn(BaseModel):
    station_name: str
    city: str
    latitude: float
    longitude: float
    free_slots: int = 2
    total_slots: int = 4
    wait_minutes: float = 10.0
    rate_kw: float = 30.0
    load_kw: float = 15.0
    status: str = "Available"


class StationAdminOut(BaseModel):
    id: int
    station_name: str
    city: str
    latitude: float
    longitude: float
    free_slots: int
    total_slots: int
    wait_minutes: float
    rate_kw: float
    load_kw: float
    status: str


# ── Trips ─────────────────────────────────────────────────────────────────────

class TripEvaluateRequest(BaseModel):
    current_lat: float
    current_lon: float
    destination_lat: float
    destination_lon: float
    predicted_range_km: float
    required_arrival_range_km: float = 8.0
    safety_buffer_percent: float = 15.0


class BackupStation(BaseModel):
    name: str
    distance_km: float
    wait_minutes: float
    rate_kw: float
    free_slots: int


class TripResult(BaseModel):
    trip_distance_km: float
    needed_range_km: float
    remaining_range_km: float
    decision: str
    detail: str
    backup_station: BackupStation | None = None


# ── History ───────────────────────────────────────────────────────────────────

class HistoryEntryIn(BaseModel):
    station_name: str
    battery_percent: float
    battery_health: float
    charge_minutes: float
    wait_minutes: float
    energy_drawn_kwh: float
    weather: str
    session_time: str


class HistoryEntryOut(BaseModel):
    id: int
    session_time: str
    station_name: str
    battery_percent: float
    battery_health: float
    charge_minutes: float
    wait_minutes: float
    energy_drawn_kwh: float
    weather: str


class HistorySummary(BaseModel):
    sessions: int
    energy_kwh: float
    avg_wait: float
    favorite_station: str


# ── Vehicles ──────────────────────────────────────────────────────────────────

class VehicleProfile(BaseModel):
    name: str
    base_range_km: float
    fast_charge_bias: float
    full_charge_bias: float


# ── Geocode ───────────────────────────────────────────────────────────────────

class GeocodeResponse(BaseModel):
    lat: float | None
    lon: float | None
    label: str | None
    status: str
    message: str


# ── Cities ────────────────────────────────────────────────────────────────────

class CityIn(BaseModel):
    name: str
    display_name: str
    lat: float
    lon: float


class CityOut(BaseModel):
    id: int
    name: str
    display_name: str
    lat: float
    lon: float
