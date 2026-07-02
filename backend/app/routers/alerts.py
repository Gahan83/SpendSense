from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.whatsapp_service import send_whatsapp_message

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("/test")
def send_test_alert(db: Session = Depends(get_db)):
    body = "✅ *SpendSense Test Message*\n\nYour WhatsApp alerts are configured correctly."
    return send_whatsapp_message(db, body)
