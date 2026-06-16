from fastapi import APIRouter, HTTPException

from models.schemas import VehicleProfile
from services.vehicle_service import VEHICLE_MODELS, get_vehicle_models, get_vehicle_profile

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleProfile])
def list_vehicles():
    return [
        VehicleProfile(name=name, **profile)
        for name, profile in VEHICLE_MODELS.items()
    ]


@router.get("/{model_name}", response_model=VehicleProfile)
def get_vehicle(model_name: str):
    profile = get_vehicle_profile(model_name)
    return VehicleProfile(name=model_name, **profile)
