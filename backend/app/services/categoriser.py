from sqlalchemy.orm import Session
from sqlalchemy import case
from ..models import CategoryRule

_CACHE: list[tuple[str, str]] | None = None


def invalidate_cache():
    global _CACHE
    _CACHE = None


def _load_rules(db: Session) -> list[tuple[str, str]]:
    global _CACHE
    if _CACHE is not None:
        return _CACHE
    # Custom rules first (is_custom desc) so they win over defaults, per FR-09
    rows = (
        db.query(CategoryRule)
        .order_by(case((CategoryRule.is_custom == 1, 0), else_=1))
        .all()
    )
    _CACHE = [(r.keyword.lower(), r.category) for r in rows]
    return _CACHE


def categorise(db: Session, merchant: str, remark: str | None = None) -> str:
    text = f"{merchant or ''} {remark or ''}".lower()
    for keyword, category in _load_rules(db):
        if keyword in text:
            return category
    return "Other"
