import calendar
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from ..database import get_db
from ..models import Transaction
from ..services.whatsapp_service import get_month_spend, get_category_spend, get_budget

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(
    month: int = Query(default=None),
    year: int = Query(default=None),
    db: Session = Depends(get_db),
):
    today = date.today()
    month = month or today.month
    year = year or today.year

    total_spent = get_month_spend(db, month, year)
    cat_spend = get_category_spend(db, month, year)
    budget = get_budget(db, month, year)
    total_limit = budget.total_limit if budget else 0
    category_limits = budget.category_limits if budget else {}

    days_in_month = calendar.monthrange(year, month)[1]
    is_current_month = (today.month == month and today.year == year)
    day_cursor = today.day if is_current_month else days_in_month
    days_remaining = max(days_in_month - day_cursor, 0)
    remaining_budget = max(total_limit - total_spent, 0)
    daily_allowance = remaining_budget / days_remaining if days_remaining > 0 else remaining_budget

    daily_rows = db.query(
        extract("day", Transaction.date).label("day"),
        func.sum(Transaction.amount).label("amount"),
    ).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).group_by("day").order_by("day").all()

    daily_map = {int(d): float(a or 0) for d, a in daily_rows}
    cumulative = []
    running = 0.0
    for d in range(1, days_in_month + 1):
        running += daily_map.get(d, 0.0)
        cumulative.append({"day": d, "amount": daily_map.get(d, 0.0), "cumulative": running})

    top_merchants = db.query(
        Transaction.merchant, func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).group_by(Transaction.merchant).order_by(func.sum(Transaction.amount).desc()).limit(5).all()

    txn_count = db.query(func.count(Transaction.id)).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).scalar()

    recent = db.query(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(10).all()

    category_table = []
    for cat, data in cat_spend.items():
        limit = category_limits.get(cat, 0)
        pct = (data["amount"] / limit * 100) if limit else None
        status = "ok"
        if limit:
            status = "over" if data["amount"] >= limit else ("warning" if data["amount"] >= 0.8 * limit else "ok")
        category_table.append({
            "category": cat, "spent": data["amount"], "count": data["count"],
            "limit": limit, "pct_used": pct, "status": status,
        })

    return {
        "month": month, "year": year,
        "total_spent": total_spent, "total_limit": total_limit,
        "progress_pct": (total_spent / total_limit * 100) if total_limit else 0,
        "days_remaining": days_remaining, "daily_allowance": daily_allowance,
        "transaction_count": txn_count or 0,
        "category_breakdown": category_table,
        "daily_series": cumulative,
        "top_merchants": [{"merchant": m, "amount": float(t)} for m, t in top_merchants],
        "recent_transactions": [
            {
                "id": t.id, "date": t.date.isoformat(), "merchant": t.merchant,
                "amount": t.amount, "type": t.type, "category": t.category,
            } for t in recent
        ],
    }
