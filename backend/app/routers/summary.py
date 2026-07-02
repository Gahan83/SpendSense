from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.whatsapp_service import build_month_end_summary, send_month_end_summary

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("/{year}/{month}")
def get_summary(year: int, month: int, db: Session = Depends(get_db)):
    return build_month_end_summary(db, month, year)


@router.post("/{year}/{month}/send")
def send_summary(year: int, month: int, db: Session = Depends(get_db)):
    return send_month_end_summary(db, month, year)
