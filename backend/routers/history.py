from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.db import get_db
from models.schemas import HistoryEntryIn, HistoryEntryOut, HistorySummary
from routers.auth import get_current_user
from services.history_service import get_user_history, get_user_history_summary, save_history_entry

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryEntryOut])
def list_history(limit: int = 20, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = get_user_history(db, current_user.id, limit)
    return [
        HistoryEntryOut(
            id=r.id,
            session_time=r.session_time,
            station_name=r.station_name,
            battery_percent=r.battery_percent,
            battery_health=r.battery_health,
            charge_minutes=r.charge_minutes,
            wait_minutes=r.wait_minutes,
            energy_drawn_kwh=r.energy_drawn_kwh,
            weather=r.weather,
        )
        for r in rows
    ]


@router.get("/summary", response_model=HistorySummary)
def history_summary(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_history_summary(db, current_user.id)


@router.post("", response_model=HistoryEntryOut)
def add_history(body: HistoryEntryIn, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    entry = save_history_entry(
        db,
        user_id=current_user.id,
        station_name=body.station_name,
        battery_percent=body.battery_percent,
        battery_health=body.battery_health,
        charge_minutes=body.charge_minutes,
        wait_minutes=body.wait_minutes,
        energy_drawn_kwh=body.energy_drawn_kwh,
        weather=body.weather,
        session_time=body.session_time,
    )
    return HistoryEntryOut(
        id=entry.id,
        session_time=entry.session_time,
        station_name=entry.station_name,
        battery_percent=entry.battery_percent,
        battery_health=entry.battery_health,
        charge_minutes=entry.charge_minutes,
        wait_minutes=entry.wait_minutes,
        energy_drawn_kwh=entry.energy_drawn_kwh,
        weather=entry.weather,
    )
