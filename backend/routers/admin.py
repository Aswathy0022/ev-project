from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.db import City, Station, get_db
from models.schemas import CityIn, CityOut, StationAdminOut, StationIn
from routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_user(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stations", response_model=list[StationAdminOut])
def list_stations(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    return db.query(Station).order_by(Station.id).all()


@router.post("/stations", response_model=StationAdminOut, status_code=201)
def create_station(body: StationIn, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    station = Station(**body.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station


@router.put("/stations/{station_id}", response_model=StationAdminOut)
def update_station(station_id: int, body: StationIn, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    for field, value in body.model_dump().items():
        setattr(station, field, value)
    db.commit()
    db.refresh(station)
    return station


@router.delete("/stations/{station_id}", status_code=204)
def delete_station(station_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    db.delete(station)
    db.commit()


@router.get("/cities", response_model=list[CityOut])
def list_cities(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    return db.query(City).order_by(City.name).all()


@router.put("/cities/{city_id}", response_model=CityOut)
def update_city(city_id: int, body: CityIn, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    city.name = body.name.strip().lower()
    city.display_name = body.display_name
    city.lat = body.lat
    city.lon = body.lon
    db.commit()
    db.refresh(city)
    return city


@router.delete("/cities/{city_id}", status_code=204)
def delete_city(city_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    db.delete(city)
    db.commit()
