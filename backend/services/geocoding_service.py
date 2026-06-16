from __future__ import annotations

from dataclasses import dataclass

# Used only at startup to seed the cities DB table. Not used at runtime.
SEED_CITY_MAP: dict[str, tuple[float, float, str]] = {
    "kochi": (9.9312, 76.2673, "Kochi, Kerala, India"),
    "cochin": (9.9312, 76.2673, "Kochi, Kerala, India"),
    "ernakulam": (9.9816, 76.2999, "Ernakulam, Kerala, India"),
    "thrissur": (10.5276, 76.2144, "Thrissur, Kerala, India"),
    "trichur": (10.5276, 76.2144, "Thrissur, Kerala, India"),
    "trivandrum": (8.5241, 76.9366, "Thiruvananthapuram, Kerala, India"),
    "thiruvananthapuram": (8.5241, 76.9366, "Thiruvananthapuram, Kerala, India"),
    "kozhikode": (11.2588, 75.7804, "Kozhikode, Kerala, India"),
    "calicut": (11.2588, 75.7804, "Kozhikode, Kerala, India"),
    "palakkad": (10.7867, 76.6548, "Palakkad, Kerala, India"),
    "kottayam": (9.5916, 76.5222, "Kottayam, Kerala, India"),
    "kollam": (8.8932, 76.6141, "Kollam, Kerala, India"),
    "alappuzha": (9.4981, 76.3388, "Alappuzha, Kerala, India"),
    "alleppey": (9.4981, 76.3388, "Alappuzha, Kerala, India"),
    "kannur": (11.8745, 75.3704, "Kannur, Kerala, India"),
    "malappuram": (11.0732, 76.0740, "Malappuram, Kerala, India"),
    "aluva": (10.1076, 76.3516, "Aluva, Kerala, India"),
    "angamaly": (10.1907, 76.3879, "Angamaly, Kerala, India"),
    "guruvayur": (10.5943, 76.0411, "Guruvayur, Kerala, India"),
    "chalakudy": (10.3002, 76.3370, "Chalakudy, Kerala, India"),
    "chennai": (13.0827, 80.2707, "Chennai, Tamil Nadu, India"),
    "madras": (13.0827, 80.2707, "Chennai, Tamil Nadu, India"),
    "coimbatore": (11.0168, 76.9558, "Coimbatore, Tamil Nadu, India"),
    "kovai": (11.0168, 76.9558, "Coimbatore, Tamil Nadu, India"),
    "madurai": (9.9252, 78.1198, "Madurai, Tamil Nadu, India"),
    "trichy": (10.7905, 78.7047, "Tiruchirappalli, Tamil Nadu, India"),
    "tiruchirappalli": (10.7905, 78.7047, "Tiruchirappalli, Tamil Nadu, India"),
    "salem": (11.6643, 78.1460, "Salem, Tamil Nadu, India"),
    "erode": (11.3410, 77.7172, "Erode, Tamil Nadu, India"),
    "tiruppur": (11.1085, 77.3411, "Tiruppur, Tamil Nadu, India"),
    "thanjavur": (10.7870, 79.1378, "Thanjavur, Tamil Nadu, India"),
    "tanjore": (10.7870, 79.1378, "Thanjavur, Tamil Nadu, India"),
    "vellore": (12.9165, 79.1325, "Vellore, Tamil Nadu, India"),
    "thoothukudi": (8.7642, 78.1348, "Thoothukudi, Tamil Nadu, India"),
    "tuticorin": (8.7642, 78.1348, "Thoothukudi, Tamil Nadu, India"),
    "tirunelveli": (8.7139, 77.7567, "Tirunelveli, Tamil Nadu, India"),
    "nellai": (8.7139, 77.7567, "Tirunelveli, Tamil Nadu, India"),
    "dindigul": (10.3624, 77.9695, "Dindigul, Tamil Nadu, India"),
    "nagercoil": (8.1833, 77.4119, "Nagercoil, Tamil Nadu, India"),
    "kanyakumari": (8.0883, 77.5385, "Kanyakumari, Tamil Nadu, India"),
    "hosur": (12.7409, 77.8253, "Hosur, Tamil Nadu, India"),
    "karur": (10.9601, 78.0766, "Karur, Tamil Nadu, India"),
    "namakkal": (11.2213, 78.1652, "Namakkal, Tamil Nadu, India"),
    "cuddalore": (11.7447, 79.7680, "Cuddalore, Tamil Nadu, India"),
    "nagapattinam": (10.7656, 79.8428, "Nagapattinam, Tamil Nadu, India"),
    "mayiladuthurai": (11.1035, 79.6550, "Mayiladuthurai, Tamil Nadu, India"),
    "kumbakonam": (10.9617, 79.3881, "Kumbakonam, Tamil Nadu, India"),
    "viluppuram": (11.9401, 79.4861, "Viluppuram, Tamil Nadu, India"),
    "villupuram": (11.9401, 79.4861, "Viluppuram, Tamil Nadu, India"),
    "tiruvannamalai": (12.2253, 79.0747, "Tiruvannamalai, Tamil Nadu, India"),
    "sivakasi": (9.4493, 77.7974, "Sivakasi, Tamil Nadu, India"),
    "virudhunagar": (9.5851, 77.9579, "Virudhunagar, Tamil Nadu, India"),
    "ramanathapuram": (9.3716, 78.8308, "Ramanathapuram, Tamil Nadu, India"),
    "pollachi": (10.6585, 77.0080, "Pollachi, Tamil Nadu, India"),
    "ooty": (11.4064, 76.6932, "Ooty, Tamil Nadu, India"),
    "udhagamandalam": (11.4064, 76.6932, "Ooty, Tamil Nadu, India"),
    "yercaud": (11.7753, 78.2090, "Yercaud, Tamil Nadu, India"),
    "palani": (10.4500, 77.5200, "Palani, Tamil Nadu, India"),
    "ranipet": (12.9417, 79.3339, "Ranipet, Tamil Nadu, India"),
    "pudukkottai": (10.3797, 78.8208, "Pudukkottai, Tamil Nadu, India"),
    "tenkasi": (8.9591, 77.3152, "Tenkasi, Tamil Nadu, India"),
    "dharmapuri": (12.1277, 78.1579, "Dharmapuri, Tamil Nadu, India"),
    "krishnagiri": (12.5186, 78.2137, "Krishnagiri, Tamil Nadu, India"),
    "tiruvallur": (13.1439, 79.9081, "Tiruvallur, Tamil Nadu, India"),
    "chengalpattu": (12.6819, 79.9888, "Chengalpattu, Tamil Nadu, India"),
    "kanchipuram": (12.8342, 79.7036, "Kanchipuram, Tamil Nadu, India"),
    "neyveli": (11.5359, 79.4837, "Neyveli, Tamil Nadu, India"),
    "ariyalur": (11.1401, 79.0786, "Ariyalur, Tamil Nadu, India"),
    "perambalur": (11.2342, 78.8806, "Perambalur, Tamil Nadu, India"),
}


@dataclass
class GeocodeResult:
    lat: float | None
    lon: float | None
    label: str | None
    status: str
    message: str


def _parse_coordinate_text(place_text: str) -> GeocodeResult | None:
    parts = [p.strip() for p in place_text.split(",")]
    if len(parts) != 2:
        return None
    try:
        lat, lon = float(parts[0]), float(parts[1])
    except ValueError:
        return None
    return GeocodeResult(lat=lat, lon=lon, label=f"{lat:.5f}, {lon:.5f}", status="success", message="Used coordinates directly.")


def geocode_place(
    place_text: str,
    city_map: dict[str, tuple[float, float, str]] | None = None,
) -> GeocodeResult:
    place_text = (place_text or "").strip()
    if not place_text:
        return GeocodeResult(None, None, None, "empty", "Enter a place name.")

    parsed = _parse_coordinate_text(place_text)
    if parsed:
        return parsed

    if city_map:
        key = place_text.strip().lower()
        if key in city_map:
            lat, lon, label = city_map[key]
            return GeocodeResult(lat=lat, lon=lon, label=label, status="success", message=f"Matched: {label}")

    try:
        from geopy.exc import GeocoderServiceError, GeocoderTimedOut, GeocoderUnavailable
        from geopy.geocoders import Nominatim
    except Exception:
        return GeocodeResult(None, None, None, "missing_dependency", "geopy not installed.")

    try:
        geocoder = Nominatim(user_agent="voltiq-ev-assistant")
        location = geocoder.geocode(place_text, exactly_one=True, timeout=10)
    except (GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError):
        return GeocodeResult(None, None, None, "network_error", "Geocoding service unavailable.")

    if not location:
        return GeocodeResult(None, None, None, "not_found", "Place not found. Try coordinates.")

    return GeocodeResult(
        lat=float(location.latitude), lon=float(location.longitude),
        label=location.address, status="success", message=f"Found: {location.address}",
    )
