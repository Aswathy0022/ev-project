from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.db import get_db
from models.schemas import BookingIn, BookingOut
from routers.auth import get_current_user
from services.booking_service import cancel_booking, create_booking, list_bookings

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _booking_out(booking) -> BookingOut:
    return BookingOut(
        id=booking.id,
        station_id=booking.station_id,
        station_name=booking.station.station_name,
        slot_start=booking.slot_start,
        slot_end=booking.slot_end,
        status=booking.status,
        created_at=booking.created_at,
    )


@router.get("", response_model=list[BookingOut])
def get_bookings(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return [_booking_out(b) for b in list_bookings(db, current_user.id)]


@router.post("", response_model=BookingOut)
def post_booking(body: BookingIn, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ok, msg, booking = create_booking(db, current_user.id, body.station_id, body.slot_start, body.slot_end)
    if not ok:
        raise HTTPException(status_code=409, detail=msg)
    return _booking_out(booking)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def post_cancel_booking(booking_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ok, msg, booking = cancel_booking(db, current_user.id, booking_id)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return _booking_out(booking)
