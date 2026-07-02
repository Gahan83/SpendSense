from sqlalchemy.orm import Session
from ..models import Setting

DEFAULTS = {
    "phone_number": "",
    "twilio_account_sid": "",
    "twilio_auth_token": "",
    "twilio_whatsapp_from": "",
    "alerts_enabled": "true",
}


def get_all(db: Session) -> dict:
    rows = db.query(Setting).all()
    values = {**DEFAULTS, **{r.key: r.value for r in rows}}
    return values


def get(db: Session, key: str, default: str = "") -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    if row is not None and row.value is not None:
        return row.value
    return DEFAULTS.get(key, default)


def set_values(db: Session, values: dict) -> None:
    for key, value in values.items():
        if value is None:
            continue
        val_str = str(value)
        row = db.query(Setting).filter(Setting.key == key).first()
        if row:
            row.value = val_str
        else:
            db.add(Setting(key=key, value=val_str))
    db.commit()
