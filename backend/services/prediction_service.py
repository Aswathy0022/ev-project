EV_BIKE_BASE_RANGE_KM = 120.0
FAST_CHARGE_FLOOR_MIN = 45.0
FAST_CHARGE_CEILING_MIN = 90.0
FULL_CHARGE_FLOOR_MIN = 90.0
FULL_CHARGE_CEILING_MIN = 120.0
HIGH_BATTERY_TOP_UP_FLOOR_MIN = 20.0
HIGH_BATTERY_TOP_UP_CEILING_MIN = 40.0


def _weather_factor(weather: str) -> float:
    weather = (weather or "").lower()
    mapping = {"clear": 1.0, "cloudy": 0.97, "rain": 0.9, "storm": 0.82, "snow": 0.78}
    for key, value in mapping.items():
        if key in weather:
            return value
    return 0.95


def _temperature_factor(temp_c: float) -> float:
    return max(0.72, 1 - abs(temp_c - 24) * 0.012)


def _speed_factor(speed_kmph: float | None) -> float:
    if speed_kmph is None:
        return 1.0
    if speed_kmph <= 35:
        return 1.0
    if speed_kmph <= 50:
        return 0.94
    if speed_kmph <= 65:
        return 0.87
    return 0.8


def _ride_mode_factor(ride_mode: str | None) -> float:
    ride_mode = (ride_mode or "").lower()
    if "eco" in ride_mode:
        return 1.08
    if "sport" in ride_mode or "power" in ride_mode:
        return 0.88
    return 1.0


def _terrain_factor(terrain: str | None) -> float:
    terrain = (terrain or "").lower()
    if "hill" in terrain or "steep" in terrain:
        return 0.84
    if "rough" in terrain or "bad" in terrain:
        return 0.9
    if "highway" in terrain:
        return 0.94
    return 1.0


def _traffic_factor(traffic: str | None) -> float:
    traffic = (traffic or "").lower()
    if "heavy" in traffic:
        return 0.88
    if "moderate" in traffic:
        return 0.94
    if "light" in traffic:
        return 1.02
    return 1.0


def _load_factor(rider_weight_kg: float | None, passenger_count: int = 0, luggage_kg: float = 0.0) -> float:
    rider_weight = rider_weight_kg if rider_weight_kg is not None else 70.0
    passenger_weight = max(passenger_count, 0) * 55.0
    total_extra_load = max(rider_weight - 70.0, 0.0) + passenger_weight + max(luggage_kg, 0.0)
    return max(0.78, 1.0 - total_extra_load * 0.0018)


def predict_range(
    battery_level: float,
    temperature: float,
    weather: str,
    battery_health: float,
    speed_kmph: float | None = None,
    vehicle_base_range_km: float | None = None,
    ride_mode: str | None = None,
    terrain: str | None = None,
    traffic: str | None = None,
    rider_weight_kg: float | None = None,
    passenger_count: int = 0,
    luggage_kg: float = 0.0,
) -> dict:
    weather_factor = _weather_factor(weather)
    temp_factor = _temperature_factor(temperature)
    health_factor = max(0.7, min(battery_health / 100.0, 1.0))
    speed_factor = _speed_factor(speed_kmph)
    ride_factor = _ride_mode_factor(ride_mode)
    terrain_factor = _terrain_factor(terrain)
    traffic_factor = _traffic_factor(traffic)
    load_factor = _load_factor(rider_weight_kg, passenger_count, luggage_kg)
    full_range = vehicle_base_range_km or EV_BIKE_BASE_RANGE_KM
    base_range = full_range * (battery_level / 100.0)
    efficiency_factor = (
        weather_factor * temp_factor * health_factor * speed_factor
        * ride_factor * terrain_factor * traffic_factor * load_factor
    )
    predicted_range = base_range * efficiency_factor
    performance_score = min(100, max(35, round(efficiency_factor * 100, 1)))
    return {
        "predicted_range_km": round(predicted_range, 1),
        "full_charge_range_km": round(full_range * efficiency_factor, 1),
        "performance_score": performance_score,
        "efficiency_factor": round(efficiency_factor, 3),
    }


def predict_wait_time(crowd: int, slots: int, hour: int) -> float:
    hist_wait = 12.0
    crowd_pressure = crowd / max(slots, 1)
    time_boost = 1.15 if 17 <= hour <= 21 else 1.0
    wait = hist_wait * (0.55 + crowd_pressure * 0.6) * time_boost
    return round(max(wait, 2.0), 1)


def predict_charge_time(
    battery_level: float,
    charging_rate_kw: float,
    charging_load_kw: float,
    battery_health: float,
    target_level: float = 90,
    charge_bias: float = 1.0,
) -> float:
    if target_level <= battery_level:
        return 0.0
    battery_level = max(0.0, min(battery_level, 100.0))
    target_level = max(0.0, min(target_level, 100.0))
    missing_percent = target_level - battery_level

    load_multiplier = 1.0 + min(max(charging_load_kw / max(charging_rate_kw, 1.0), 0.0), 1.5) * 0.08
    health_multiplier = 1.0 + max(0.0, (95.0 - battery_health) / 100.0) * 0.12
    speed_multiplier = 0.94 if charging_rate_kw >= 50 else 1.0
    adjustment = load_multiplier * health_multiplier * speed_multiplier * charge_bias

    if target_level <= 80:
        charge_fraction = max(missing_percent, 0.0) / 80.0
        base_minutes = FAST_CHARGE_FLOOR_MIN + charge_fraction * (FAST_CHARGE_CEILING_MIN - FAST_CHARGE_FLOOR_MIN)
        adjusted = base_minutes * adjustment
        return round(min(max(adjusted, 12.0), FAST_CHARGE_CEILING_MIN), 1)

    if target_level == 100 and battery_level >= 80:
        remaining_fraction = max(missing_percent, 0.0) / 20.0
        base_minutes = HIGH_BATTERY_TOP_UP_FLOOR_MIN + remaining_fraction * (HIGH_BATTERY_TOP_UP_CEILING_MIN - HIGH_BATTERY_TOP_UP_FLOOR_MIN)
        adjusted = base_minutes * adjustment
        return round(min(max(adjusted, 8.0), HIGH_BATTERY_TOP_UP_CEILING_MIN), 1)

    if battery_level <= 20:
        base_minutes = 120.0 - (battery_level / 20.0) * 10.0
    elif battery_level <= 30:
        base_minutes = 110.0 - ((battery_level - 20.0) / 10.0) * 20.0
    elif battery_level <= 50:
        base_minutes = 90.0 - ((battery_level - 30.0) / 20.0) * 30.0
    elif battery_level <= 80:
        base_minutes = 60.0 - ((battery_level - 50.0) / 30.0) * 20.0
    elif battery_level <= 90:
        base_minutes = 40.0 - ((battery_level - 80.0) / 10.0) * 20.0
    else:
        base_minutes = 20.0 - ((battery_level - 90.0) / 10.0) * 10.0

    adjusted = base_minutes * adjustment
    return round(min(max(adjusted, 8.0), FULL_CHARGE_CEILING_MIN), 1)


def station_load_status(charging_load_kw: float, rate_kw: float) -> tuple[str, str]:
    if charging_load_kw <= rate_kw * 0.75:
        return "Comfortable load", "success"
    if charging_load_kw <= rate_kw * 1.05:
        return "Manageable load", "warning"
    return "High load", "danger"


def travel_readiness(predicted_range_km: float, trip_distance_km: float | None = None) -> tuple[str, str]:
    if trip_distance_km is None:
        if predicted_range_km >= 90:
            return "Safe to Travel", "Current battery supports most daily trips."
        if predicted_range_km >= 45:
            return "Charge Soon", "You still have usable range, but topping up would reduce risk."
        return "Charge Now", "Current battery is better suited for short distances only."
    if predicted_range_km >= trip_distance_km * 1.2:
        return "Trip is safe", "You have enough predicted range with a healthy safety buffer."
    if predicted_range_km >= trip_distance_km:
        return "Trip is possible", "You can make the trip, but charging first would give a safer buffer."
    return "Charge before leaving", "Predicted range is below the required trip distance."
