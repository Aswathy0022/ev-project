import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.db import City, Station, User, init_db, engine
from sqlalchemy.orm import Session
from routers import auth, geocode, history, predict, stations, trips, vehicles, weather
from routers import admin, bookings, location

app = FastAPI(title="VoltIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(stations.router)
app.include_router(trips.router)
app.include_router(history.router)
app.include_router(vehicles.router)
app.include_router(geocode.router)
app.include_router(weather.router)
app.include_router(admin.router)
app.include_router(bookings.router)
app.include_router(location.router)


def _seed_stations(db: Session) -> None:
    if db.query(Station).first():
        return
    from services.station_service import load_station_catalog
    catalog = load_station_catalog()
    if catalog.empty:
        return
    for _, row in catalog.iterrows():
        db.add(Station(
            station_name=str(row["station_name"]),
            city=str(row["city"]),
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            free_slots=int(row["free_slots"]),
            total_slots=int(row["total_slots"]),
            wait_minutes=float(row["wait_minutes"]),
            rate_kw=float(row["rate_kw"]),
            load_kw=float(row["load_kw"]),
            status=str(row["status"]),
            country="IN",
        ))
    db.commit()


def _seed_cities(db: Session) -> None:
    if db.query(City).first():
        return
    from services.geocoding_service import SEED_CITY_MAP
    for name, (lat, lon, display_name) in SEED_CITY_MAP.items():
        if not db.query(City).filter(City.name == name).first():
            db.add(City(name=name, display_name=display_name, lat=lat, lon=lon, country="IN"))
    db.commit()


def _seed_admin(db: Session) -> None:
    admin_email = os.getenv("ADMIN_EMAIL", "admin@voltiq.dev")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        if not existing.is_admin:
            existing.is_admin = True
            db.commit()
        return
    from services.auth_service import hash_password
    admin_user = User(
        name="Admin",
        email=admin_email,
        password_hash=hash_password(admin_password),
        is_admin=True,
    )
    db.add(admin_user)
    db.commit()


@app.on_event("startup")
def startup():
    init_db()
    db = Session(engine)
    try:
        _seed_stations(db)
        _seed_cities(db)
        _seed_admin(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok", "app": "VoltIQ"}
