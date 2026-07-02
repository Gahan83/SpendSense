from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    date: date
    merchant: str
    remark: Optional[str] = None
    amount: float
    type: str
    category: str
    upi_ref: Optional[str] = None
    status: Optional[str] = None


class TransactionCreate(BaseModel):
    date: date
    merchant: str
    remark: Optional[str] = None
    amount: float
    type: str = "DEBIT"
    category: Optional[str] = None
    upi_ref: Optional[str] = None
    status: Optional[str] = "SUCCESS"


class TransactionUpdate(BaseModel):
    category: str


class BudgetIn(BaseModel):
    total_limit: float
    category_limits: dict[str, float] = {}
    reset_day: int = 1


class BudgetOut(BudgetIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    month: int
    year: int


class SettingsIn(BaseModel):
    phone_number: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_from: Optional[str] = None
    alerts_enabled: Optional[bool] = None


class CategoryRuleIn(BaseModel):
    keyword: str
    category: str


class CategoryRuleOut(CategoryRuleIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_custom: int
