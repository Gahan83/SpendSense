from sqlalchemy import Column, Integer, String, Float, Date, DateTime, JSON, UniqueConstraint
from sqlalchemy.sql import func
from .database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    merchant = Column(String, nullable=False)
    remark = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # DEBIT / CREDIT
    category = Column(String, nullable=False, default="Other", index=True)
    upi_ref = Column(String, nullable=True, unique=True, index=True)
    status = Column(String, nullable=True, default="SUCCESS")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    total_limit = Column(Float, nullable=False, default=0)
    category_limits = Column(JSON, nullable=False, default=dict)
    reset_day = Column(Integer, nullable=False, default=1)

    __table_args__ = (UniqueConstraint("month", "year", name="uq_budget_month_year"),)


class AlertLog(Base):
    __tablename__ = "alert_log"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String, nullable=False, index=True)  # LIMIT_BREACH, WARN_80, CAT_BREACH_<cat>
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    message = Column(String, nullable=True)


class CategoryRule(Base):
    __tablename__ = "category_rules"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)
    is_custom = Column(Integer, nullable=False, default=0)  # 0 = default seed, 1 = user-added


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=True)
