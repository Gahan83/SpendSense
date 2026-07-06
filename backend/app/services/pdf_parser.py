import io
import re

import pdfplumber
from pypdf import PdfReader

MONTHS = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}

MAIN_RE = re.compile(
    r"^(?P<date>\w{3} \d{2}, \d{4})\s+(?P<merchant>.+?)\s+(?P<type>Debit|Credit)\s+INR\s+(?P<amount>[\d,]+\.\d{2})$"
)
MAIN_NOAMT_RE = re.compile(
    r"^(?P<date>\w{3} \d{2}, \d{4})\s+(?P<merchant>.+?)\s+(?P<type>Debit|Credit)\s+INR$"
)
TIME_RE = re.compile(
    r"^(?P<time>\d{1,2}:\d{2} [AP]M)\s+Transaction ID\s*:\s*(?P<txnid>\S+)(?:\s+(?P<trail_amt>[\d,]+\.\d{2}))?$"
)
UTR_RE = re.compile(r"^UTR No\s*:\s*(?P<utr>\S+)$")
DATE_RANGE_RE = re.compile(r"^\w{3} \d{2}, \d{4} - \w{3} \d{2}, \d{4}$")
PAGE_FOOTER_RE = re.compile(r"^Page \d+ of \d+$")


class PdfPasswordRequired(Exception):
    pass


class PdfWrongPassword(Exception):
    pass


def _parse_date(d: str) -> str:
    m = re.match(r"(\w{3}) (\d{2}), (\d{4})", d)
    mon, day, year = m.groups()
    return f"{year}-{MONTHS[mon]:02d}-{day}"


def _decrypt_if_needed(content: bytes, password: str | None) -> bytes:
    reader = PdfReader(io.BytesIO(content))
    if not reader.is_encrypted:
        return content
    if not password:
        raise PdfPasswordRequired("This PDF is password-protected")
    result = reader.decrypt(password)
    if result == 0:
        raise PdfWrongPassword("Incorrect PDF password")

    from pypdf import PdfWriter
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def parse_phonepe_pdf(content: bytes, password: str | None = None) -> dict:
    """Parses a PhonePe 'Transaction Statement' PDF export.
    Returns {"rows": [...], "unknown_columns": []} matching parser.py's contract."""
    content = _decrypt_if_needed(content, password)

    all_lines: list[str] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for ln in text.split("\n"):
                s = ln.strip()
                if not s:
                    continue
                if s.startswith("Transaction Statement for"):
                    continue
                if DATE_RANGE_RE.match(s):
                    continue
                if s == "Date Transaction Details Type Amount":
                    continue
                if PAGE_FOOTER_RE.match(s):
                    break
                all_lines.append(s)

    rows = []
    cur = None
    for line in all_lines:
        m = MAIN_RE.match(line)
        if m:
            if cur and cur["amount"] is not None:
                rows.append(cur)
            cur = {
                "date": _parse_date(m.group("date")),
                "merchant": m.group("merchant").strip(),
                "type": m.group("type").upper(),
                "amount": float(m.group("amount").replace(",", "")),
                "upi_ref": None,
            }
            continue
        m2 = MAIN_NOAMT_RE.match(line)
        if m2:
            if cur and cur["amount"] is not None:
                rows.append(cur)
            cur = {
                "date": _parse_date(m2.group("date")),
                "merchant": m2.group("merchant").strip(),
                "type": m2.group("type").upper(),
                "amount": None,
                "upi_ref": None,
            }
            continue
        t = TIME_RE.match(line)
        if t and cur:
            cur["upi_ref"] = t.group("txnid")
            if cur["amount"] is None and t.group("trail_amt"):
                cur["amount"] = float(t.group("trail_amt").replace(",", ""))
            continue
        if UTR_RE.match(line):
            continue
        if line.startswith("Debited from") or line.startswith("Credited to"):
            continue

    if cur and cur["amount"] is not None:
        rows.append(cur)

    result_rows = [
        {
            "date": r["date"],
            "merchant": r["merchant"],
            "remark": r["merchant"],
            "amount": abs(r["amount"]),
            "type": r["type"],
            "upi_ref": r["upi_ref"],
            "status": "SUCCESS",
        }
        for r in rows
    ]
    return {"rows": result_rows, "unknown_columns": []}
