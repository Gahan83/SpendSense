from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import SettingsIn
from ..services import settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    values = settings_service.get_all(db)
    values["twilio_auth_token"] = "•" * 8 if values.get("twilio_auth_token") else ""
    return values


@router.put("")
def put_settings(payload: SettingsIn, db: Session = Depends(get_db)):
    values = payload.model_dump(exclude_none=True)
    if "alerts_enabled" in values:
        values["alerts_enabled"] = "true" if values["alerts_enabled"] else "false"
    settings_service.set_values(db, values)
    return settings_service.get_all(db)
