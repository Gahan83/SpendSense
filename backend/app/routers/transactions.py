import csv
import io
from datetime import date as date_cls
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract, or_

from ..database import get_db
from ..models import Transaction
from ..schemas import TransactionOut, TransactionCreate, TransactionUpdate
from ..services.parser import parse_transaction_file
from ..services.pdf_parser import parse_phonepe_pdf, PdfPasswordRequired, PdfWrongPassword
from ..services.categoriser import categorise
from ..services.whatsapp_service import check_and_alert

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("/import")
async def import_transactions(
    file: UploadFile = File(...),
    password: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    content = await file.read()
    try:
        if file.filename.lower().endswith(".pdf"):
            parsed = parse_phonepe_pdf(content, password)
        else:
            parsed = parse_transaction_file(file.filename, content)
    except PdfPasswordRequired as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except PdfWrongPassword as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}")

    added, duplicates = 0, 0
    touched_months = set()
    added_rows = []

    for row in parsed["rows"]:
        if row["upi_ref"]:
            existing = db.query(Transaction).filter(Transaction.upi_ref == row["upi_ref"]).first()
            if existing:
                duplicates += 1
                continue

        category = categorise(db, row["merchant"], row["remark"])
        txn = Transaction(
            date=date_cls.fromisoformat(row["date"]),
            merchant=row["merchant"],
            remark=row["remark"],
            amount=row["amount"],
            type=row["type"],
            category=category,
            upi_ref=row["upi_ref"],
            status=row["status"],
        )
        db.add(txn)
        added += 1
        touched_months.add((txn.date.month, txn.date.year))
        added_rows.append({
            "date": row["date"], "merchant": row["merchant"], "amount": row["amount"],
            "type": row["type"], "category": category,
        })

    db.commit()

    alerts_fired = []
    for month, year in touched_months:
        alerts_fired.extend(check_and_alert(db, month, year))

    return {
        "added": added,
        "duplicates": duplicates,
        "unknown_columns": parsed["unknown_columns"],
        "alerts_fired": alerts_fired,
        "added_rows": added_rows,
    }


@router.post("", response_model=TransactionOut)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    if payload.upi_ref:
        existing = db.query(Transaction).filter(Transaction.upi_ref == payload.upi_ref).first()
        if existing:
            raise HTTPException(status_code=409, detail="Transaction with this upi_ref already exists")

    category = payload.category or categorise(db, payload.merchant, payload.remark)
    txn = Transaction(
        date=payload.date,
        merchant=payload.merchant,
        remark=payload.remark,
        amount=payload.amount,
        type=payload.type,
        category=category,
        upi_ref=payload.upi_ref,
        status=payload.status,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    check_and_alert(db, txn.date.month, txn.date.year)
    return txn


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    month: Optional[int] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if month:
        query = query.filter(extract("month", Transaction.date) == month)
    if year:
        query = query.filter(extract("year", Transaction.date) == year)
    if category:
        query = query.filter(Transaction.category == category)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Transaction.merchant.ilike(like), Transaction.remark.ilike(like)))
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)

    query = query.order_by(Transaction.date.desc(), Transaction.id.desc())
    return query.offset((page - 1) * page_size).limit(page_size).all()


@router.patch("/{txn_id}", response_model=TransactionOut)
def update_transaction(txn_id: int, payload: TransactionUpdate, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    txn.category = payload.category
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/export")
def export_transactions(db: Session = Depends(get_db)):
    rows = db.query(Transaction).order_by(Transaction.date.desc()).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["date", "merchant", "remark", "amount", "type", "category", "upi_ref", "status"])
    for t in rows:
        writer.writerow([t.date, t.merchant, t.remark, t.amount, t.type, t.category, t.upi_ref, t.status])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions_export.csv"},
    )
