VEHICLE_MODELS = {
    "Ather 450X": {"base_range_km": 125, "fast_charge_bias": 0.9, "full_charge_bias": 0.95, "nominal_voltage_v": 51.2},
    "Ola S1 Pro": {"base_range_km": 165, "fast_charge_bias": 0.85, "full_charge_bias": 0.9, "nominal_voltage_v": 51.2},
    "TVS iQube": {"base_range_km": 105, "fast_charge_bias": 1.1, "full_charge_bias": 1.12, "nominal_voltage_v": 48.0},
    "Bajaj Chetak": {"base_range_km": 110, "fast_charge_bias": 1.05, "full_charge_bias": 1.08, "nominal_voltage_v": 48.0},
    "Vida V1 Pro": {"base_range_km": 115, "fast_charge_bias": 0.95, "full_charge_bias": 1.0, "nominal_voltage_v": 51.2},
}


def get_vehicle_models() -> list[str]:
    return list(VEHICLE_MODELS.keys())


def get_vehicle_profile(model_name: str) -> dict:
    return VEHICLE_MODELS.get(model_name, VEHICLE_MODELS["Ather 450X"])
