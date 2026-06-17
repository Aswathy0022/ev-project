from pathlib import Path

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "voltiq.db"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="0")
    history: Mapped[list["ChargingSession"]] = relationship("ChargingSession", back_populates="user")
    predictions: Mapped[list["PredictionEntry"]] = relationship("PredictionEntry", back_populates="user")


class ChargingSession(Base):
    __tablename__ = "charging_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    session_time: Mapped[str] = mapped_column(String, nullable=False)
    station_name: Mapped[str] = mapped_column(String, nullable=False)
    battery_percent: Mapped[float] = mapped_column(Float)
    battery_health: Mapped[float] = mapped_column(Float)
    charge_minutes: Mapped[float] = mapped_column(Float)
    wait_minutes: Mapped[float] = mapped_column(Float)
    energy_drawn_kwh: Mapped[float] = mapped_column(Float)
    weather: Mapped[str] = mapped_column(String)
    user: Mapped["User"] = relationship("User", back_populates="history")


class Station(Base):
    __tablename__ = "stations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    station_name: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    free_slots: Mapped[int] = mapped_column(Integer, default=2)
    total_slots: Mapped[int] = mapped_column(Integer, default=4)
    wait_minutes: Mapped[float] = mapped_column(Float, default=10.0)
    rate_kw: Mapped[float] = mapped_column(Float, default=30.0)
    load_kw: Mapped[float] = mapped_column(Float, default=15.0)
    status: Mapped[str] = mapped_column(String, default="Available")


class PredictionEntry(Base):
    __tablename__ = "prediction_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    predicted_at: Mapped[str] = mapped_column(String, nullable=False)
    vehicle_name: Mapped[str] = mapped_column(String, nullable=False)
    battery_level: Mapped[float] = mapped_column(Float)
    battery_health: Mapped[float] = mapped_column(Float)
    weather: Mapped[str] = mapped_column(String)
    terrain: Mapped[str] = mapped_column(String)
    traffic: Mapped[str] = mapped_column(String)
    ride_mode: Mapped[str] = mapped_column(String)
    predicted_range_km: Mapped[float] = mapped_column(Float)
    performance_score: Mapped[float] = mapped_column(Float)
    user: Mapped["User"] = relationship("User", back_populates="predictions")


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)  # lowercase lookup key
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    # Migrate: add is_admin column if users table pre-dates this change
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(__import__("sqlalchemy").text("PRAGMA table_info(users)")).fetchall()]
        if "is_admin" not in cols:
            conn.execute(__import__("sqlalchemy").text("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"))
            conn.commit()


def get_db():
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()
