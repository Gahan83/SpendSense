import io
import pandas as pd

# Fuzzy column-name aliases (lowercased, substring match) per PRD section 8
COLUMN_ALIASES = {
    "date": ["transaction date", "txn date", "value date", "date"],
    "description": ["description", "remarks", "remark", "narration", "particulars", "details"],
    "type": ["credit/debit", "debit/credit", "transaction type", "dr/cr", "type"],
    "amount": ["amount (inr)", "amount(inr)", "amount"],
    "debit": ["withdrawal amt", "debit amt", "debit"],
    "credit": ["deposit amt", "credit amt", "credit"],
    "upi_ref": ["upi transaction id", "upi ref", "reference no", "ref no", "utr", "transaction id"],
    "status": ["transaction status", "status"],
}


def _normalize(s: str) -> str:
    return "".join(s.lower().split())


def _find_column(columns: list[str], aliases: list[str]) -> str | None:
    norm_cols = {c: _normalize(c) for c in columns}
    norm_aliases = [_normalize(a) for a in aliases]
    for alias in norm_aliases:
        for orig, norm in norm_cols.items():
            if alias == norm:
                return orig
    for alias in norm_aliases:
        for orig, norm in norm_cols.items():
            if alias in norm:
                return orig
    return None


def _read_any(filename: str, content: bytes) -> pd.DataFrame:
    if filename.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    return pd.read_csv(io.BytesIO(content))


def parse_transaction_file(filename: str, content: bytes) -> dict:
    """Returns {"rows": [...], "unknown_columns": [...]}"""
    df = _read_any(filename, content)
    df.columns = [str(c).strip() for c in df.columns]
    columns = list(df.columns)

    col_date = _find_column(columns, COLUMN_ALIASES["date"])
    col_desc = _find_column(columns, COLUMN_ALIASES["description"])
    col_type = _find_column(columns, COLUMN_ALIASES["type"])
    col_amount = _find_column(columns, COLUMN_ALIASES["amount"])
    col_debit = _find_column(columns, COLUMN_ALIASES["debit"])
    col_credit = _find_column(columns, COLUMN_ALIASES["credit"])
    col_ref = _find_column(columns, COLUMN_ALIASES["upi_ref"])
    col_status = _find_column(columns, COLUMN_ALIASES["status"])

    matched = {c for c in [col_date, col_desc, col_type, col_amount, col_debit, col_credit, col_ref, col_status] if c}
    unknown_columns = [c for c in columns if c not in matched]

    rows = []
    for _, r in df.iterrows():
        raw_date = r.get(col_date) if col_date else None
        parsed_date = pd.to_datetime(raw_date, dayfirst=True, errors="coerce")
        if pd.isna(parsed_date):
            continue

        desc = str(r.get(col_desc, "")).strip() if col_desc else ""

        amount = None
        txn_type = None
        if col_amount:
            amount = pd.to_numeric(r.get(col_amount), errors="coerce")
        if (amount is None or pd.isna(amount)) and (col_debit or col_credit):
            debit_val = pd.to_numeric(r.get(col_debit), errors="coerce") if col_debit else None
            credit_val = pd.to_numeric(r.get(col_credit), errors="coerce") if col_credit else None
            debit_val = 0 if debit_val is None or pd.isna(debit_val) else debit_val
            credit_val = 0 if credit_val is None or pd.isna(credit_val) else credit_val
            if debit_val > 0:
                amount, txn_type = debit_val, "DEBIT"
            elif credit_val > 0:
                amount, txn_type = credit_val, "CREDIT"

        if txn_type is None and col_type:
            raw_type = str(r.get(col_type, "")).strip().upper()
            txn_type = "CREDIT" if "CREDIT" in raw_type or raw_type == "CR" else "DEBIT"
        if txn_type is None:
            txn_type = "DEBIT"

        if amount is None or pd.isna(amount):
            continue

        status = str(r.get(col_status, "SUCCESS")).strip() if col_status else "SUCCESS"
        if status and status.upper() not in ("SUCCESS", "SUCCESSFUL", ""):
            continue

        upi_ref = str(r.get(col_ref)).strip() if col_ref and pd.notna(r.get(col_ref)) else None

        rows.append({
            "date": parsed_date.date().isoformat(),
            "merchant": desc or "Unknown",
            "remark": desc,
            "amount": float(abs(amount)),
            "type": txn_type,
            "upi_ref": upi_ref,
            "status": status or "SUCCESS",
        })

    return {"rows": rows, "unknown_columns": unknown_columns}
