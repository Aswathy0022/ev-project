from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.db import Booking, Station


def create_booking(
    db: Session, user_id: int, station_id: int, slot_start: str, slot_end: str
) -> tuple[bool, str, Booking | None]:
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        return False, "Station not found.", None
    if station.free_slots <= 0:
        return False, "No free slots at this station.", None

    overlap = (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id,
            Booking.station_id == station_id,
            Booking.status == "confirmed",
            Booking.slot_start < slot_end,
            Booking.slot_end > slot_start,
        )
        .first()
    )
    if overlap:
        return False, "You already have a booking at this station for that time.", None

    booking = Booking(
        user_id=user_id,
        station_id=station_id,
        slot_start=slot_start,
        slot_end=slot_end,
        status="confirmed",
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    station.free_slots -= 1
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return True, "Booking confirmed.", booking


def cancel_booking(db: Session, user_id: int, booking_id: int) -> tuple[bool, str, Booking | None]:
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user_id).first()
    if not booking:
        return False, "Booking not found.", None
    if booking.status != "confirmed":
        return False, "Booking is already cancelled.", None

    booking.status = "cancelled"
    station = db.query(Station).filter(Station.id == booking.station_id).first()
    if station:
        station.free_slots = min(station.total_slots, station.free_slots + 1)
    db.commit()
    db.refresh(booking)
    return True, "Booking cancelled.", booking


def list_bookings(db: Session, user_id: int) -> list[Booking]:
    return (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.id.desc())
        .all()
    )
