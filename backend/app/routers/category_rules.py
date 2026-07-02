from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CategoryRule
from ..schemas import CategoryRuleIn, CategoryRuleOut
from ..services.categoriser import invalidate_cache

router = APIRouter(prefix="/api/category-rules", tags=["category-rules"])


@router.get("", response_model=list[CategoryRuleOut])
def list_rules(db: Session = Depends(get_db)):
    return db.query(CategoryRule).order_by(CategoryRule.is_custom.desc(), CategoryRule.category).all()


@router.post("", response_model=CategoryRuleOut)
def create_rule(payload: CategoryRuleIn, db: Session = Depends(get_db)):
    rule = CategoryRule(keyword=payload.keyword.lower(), category=payload.category, is_custom=1)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    invalidate_cache()
    return rule


@router.delete("/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(CategoryRule).filter(CategoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    invalidate_cache()
    return {"deleted": True}
