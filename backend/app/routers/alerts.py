from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AlertLog
from ..services.whatsapp_service import send_whatsapp_message

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("/test")
def send_test_alert(db: Session = Depends(get_db)):
    body = "✅ *SpendSense Test Message*\n\nYour WhatsApp alerts are configured correctly."
    return send_whatsapp_message(db, body)


@router.get("/recent")
def recent_alerts(limit: int = 10, db: Session = Depends(get_db)):
    rows = db.query(AlertLog).order_by(AlertLog.sent_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "alert_type": r.alert_type,
            "message": r.message,
            "sent_at": r.sent_at.isoformat() if r.sent_at else None,
        }
        for r in rows
    ]
