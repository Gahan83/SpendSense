import calendar
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, Date

from ..models import Transaction, Budget, AlertLog
from ..categories import CATEGORY_EMOJI
from . import settings_service


def _month_debits_query(db: Session, month: int, year: int):
    return db.query(Transaction).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    )


def get_month_spend(db: Session, month: int, year: int) -> float:
    total = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).scalar()
    return float(total or 0)


def get_category_spend(db: Session, month: int, year: int) -> dict:
    rows = db.query(Transaction.category, func.sum(Transaction.amount), func.count(Transaction.id)).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).group_by(Transaction.category).all()
    return {cat: {"amount": float(amt or 0), "count": int(cnt or 0)} for cat, amt, cnt in rows}


def get_budget(db: Session, month: int, year: int) -> Budget | None:
    return db.query(Budget).filter(Budget.month == month, Budget.year == year).first()


def alerted_today(db: Session, alert_type: str, month: int, year: int) -> bool:
    today = date.today()
    row = db.query(AlertLog).filter(
        AlertLog.alert_type == alert_type,
        AlertLog.month == month,
        AlertLog.year == year,
        func.cast(AlertLog.sent_at, Date) == today,
    ).first()
    return row is not None


def log_alert(db: Session, alert_type: str, month: int, year: int, message: str):
    db.add(AlertLog(alert_type=alert_type, month=month, year=year, message=message))
    db.commit()


def send_whatsapp_message(db: Session, body: str) -> dict:
    settings = settings_service.get_all(db)
    if settings.get("alerts_enabled", "true").lower() != "true":
        return {"sent": False, "reason": "alerts disabled"}

    sid = settings.get("twilio_account_sid")
    token = settings.get("twilio_auth_token")
    from_number = settings.get("twilio_whatsapp_from")
    to_number = settings.get("phone_number")

    if not all([sid, token, from_number, to_number]):
        return {"sent": False, "reason": "missing Twilio configuration"}

    from twilio.rest import Client

    client = Client(sid, token)
    to = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"
    frm = from_number if from_number.startswith("whatsapp:") else f"whatsapp:{from_number}"
    msg = client.messages.create(from_=frm, to=to, body=body)
    return {"sent": True, "sid": msg.sid}


def check_and_alert(db: Session, month: int, year: int) -> list[dict]:
    """Implements PRD section 9 alert trigger logic. Called after every import/manual entry."""
    results = []
    budget = get_budget(db, month, year)
    if not budget or not budget.total_limit:
        return results

    total_spent = get_month_spend(db, month, year)
    cat_spend = get_category_spend(db, month, year)
    top_category = max(cat_spend.items(), key=lambda kv: kv[1]["amount"])[0] if cat_spend else "N/A"
    latest_txn = db.query(Transaction).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).order_by(Transaction.id.desc()).first()

    if total_spent >= budget.total_limit:
        if not alerted_today(db, "LIMIT_BREACH", month, year):
            overage = total_spent - budget.total_limit
            reason = (
                f"Latest transaction of ₹{latest_txn.amount:,.0f} at *{latest_txn.merchant}* "
                f"({latest_txn.category}) pushed you over." if latest_txn else "Total spend exceeded the budget."
            )
            body = (
                f"\U0001F6A8 *Budget Alert — Limit Exceeded!*\n\n"
                f"Hi, your monthly budget of ₹{budget.total_limit:,.0f} has been breached.\n\n"
                f"\U0001F4CA Total Spent: ₹{total_spent:,.0f}\n"
                f"\U0001F4B0 Budget Limit: ₹{budget.total_limit:,.0f}\n"
                f"\U0001F534 Overage: ₹{overage:,.0f}\n\n"
                f"\U0001F3F7 Reason: {reason}\n\n"
                f"Top spending category this month: {top_category} "
                f"(₹{cat_spend.get(top_category, {}).get('amount', 0):,.0f})"
            )
            res = send_whatsapp_message(db, body)
            log_alert(db, "LIMIT_BREACH", month, year, body)
            results.append({"type": "LIMIT_BREACH", **res})

    elif total_spent >= 0.80 * budget.total_limit:
        if not alerted_today(db, "WARN_80", month, year):
            days_in_month = calendar.monthrange(year, month)[1]
            today_day = date.today().day if (date.today().month == month and date.today().year == year) else days_in_month
            days_left = max(days_in_month - today_day, 0)
            remaining = budget.total_limit - total_spent
            daily_allowance = remaining / days_left if days_left > 0 else remaining
            body = (
                f"\U0001F4E2 *Spending Warning — 80% Used*\n\n"
                f"You've used ₹{total_spent:,.0f} of your ₹{budget.total_limit:,.0f} budget (80%+).\n\n"
                f"Remaining: ₹{remaining:,.0f} with {days_left} days left "
                f"(~₹{daily_allowance:,.0f}/day allowed)."
            )
            res = send_whatsapp_message(db, body)
            log_alert(db, "WARN_80", month, year, body)
            results.append({"type": "WARN_80", **res})

    for category, limit in (budget.category_limits or {}).items():
        spent = cat_spend.get(category, {}).get("amount", 0)
        if limit and spent >= limit:
            alert_key = f"CAT_BREACH_{category}"
            if not alerted_today(db, alert_key, month, year):
                excess = spent - limit
                cat_txns = db.query(Transaction).filter(
                    Transaction.category == category,
                    Transaction.type == "DEBIT",
                    extract("month", Transaction.date) == month,
                    extract("year", Transaction.date) == year,
                ).order_by(Transaction.id.desc()).first()
                latest_line = f"Latest transaction: ₹{cat_txns.amount:,.0f} at {cat_txns.merchant}" if cat_txns else ""
                body = (
                    f"⚠️ *Category Alert — {category}*\n\n"
                    f"You've exceeded your {category} budget.\n\n"
                    f"Spent: ₹{spent:,.0f} / Limit: ₹{limit:,.0f}\n"
                    f"Excess: ₹{excess:,.0f}\n\n"
                    f"{latest_line}"
                )
                res = send_whatsapp_message(db, body)
                log_alert(db, alert_key, month, year, body)
                results.append({"type": alert_key, **res})

    return results


def build_month_end_summary(db: Session, month: int, year: int) -> dict:
    cat_spend = get_category_spend(db, month, year)
    total_spent = sum(v["amount"] for v in cat_spend.values())
    budget = get_budget(db, month, year)
    limit = budget.total_limit if budget else 0

    biggest = db.query(Transaction).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).order_by(Transaction.amount.desc()).first()

    merchant_counts = db.query(Transaction.merchant, func.count(Transaction.id)).filter(
        Transaction.type == "DEBIT",
        extract("month", Transaction.date) == month,
        extract("year", Transaction.date) == year,
    ).group_by(Transaction.merchant).order_by(func.count(Transaction.id).desc()).first()

    prev_month, prev_year = (month - 1, year) if month > 1 else (12, year - 1)
    prev_cat_spend = get_category_spend(db, prev_month, prev_year)

    insight = ""
    if cat_spend:
        top_cat, top_data = max(cat_spend.items(), key=lambda kv: kv[1]["amount"])
        pct = (top_data["amount"] / total_spent * 100) if total_spent else 0
        insight = f"{top_cat} is your top spend — {pct:.0f}% of total."
        prev_top = prev_cat_spend.get(top_cat, {}).get("amount", 0)
        if prev_top:
            change_pct = (top_data["amount"] - prev_top) / prev_top * 100
            if abs(change_pct) >= 5:
                direction = "higher" if change_pct > 0 else "lower"
                insight = f"{top_cat} spend was {abs(change_pct):.0f}% {direction} than last month."

    return {
        "month": month,
        "year": year,
        "categories": cat_spend,
        "total_spent": total_spent,
        "budget": limit,
        "variance": limit - total_spent,
        "biggest_expense": {
            "amount": biggest.amount, "merchant": biggest.merchant, "category": biggest.category,
        } if biggest else None,
        "most_frequent_merchant": {
            "merchant": merchant_counts[0], "count": merchant_counts[1],
        } if merchant_counts else None,
        "insight": insight,
    }


def format_summary_whatsapp(summary: dict) -> str:
    month_name = calendar.month_name[summary["month"]]
    lines = [f"\U0001F4C5 *{month_name} {summary['year']} — Monthly Summary*", "", "Here's where your money went this month:", ""]
    for cat, data in sorted(summary["categories"].items(), key=lambda kv: -kv[1]["amount"]):
        emoji = CATEGORY_EMOJI.get(cat, "")
        lines.append(f"{emoji} {cat}    ₹{data['amount']:,.0f}  ({data['count']} txns)")
    lines.append("─" * 25)
    total = summary["total_spent"]
    budget = summary["budget"]
    status = "✅ Under budget" if total <= budget else "\U0001F534 Over budget"
    variance = abs(summary["variance"])
    lines.append(f"\U0001F4B0 *Total Spent: ₹{total:,.0f}*")
    lines.append(f"\U0001F3AF Budget: ₹{budget:,.0f}  {status} by ₹{variance:,.0f}")
    lines.append("")
    if summary["biggest_expense"]:
        be = summary["biggest_expense"]
        lines.append(f"\U0001F4CC Biggest expense: ₹{be['amount']:,.0f} at {be['merchant']} ({be['category']})")
    if summary["most_frequent_merchant"]:
        mf = summary["most_frequent_merchant"]
        lines.append(f"\U0001F3EA Most frequent: {mf['merchant']} ({mf['count']} times)")
    if summary["insight"]:
        lines.append(f"\U0001F4C8 Insight: {summary['insight']}")
    return "\n".join(lines)


def send_month_end_summary(db: Session, month: int, year: int) -> dict:
    summary = build_month_end_summary(db, month, year)
    body = format_summary_whatsapp(summary)
    res = send_whatsapp_message(db, body)
    log_alert(db, "MONTH_END_SUMMARY", month, year, body)
    return res
