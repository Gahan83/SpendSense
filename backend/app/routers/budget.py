from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Budget
from ..schemas import BudgetIn, BudgetOut

router = APIRouter(prefix="/api/budget", tags=["budget"])


@router.get("/{year}/{month}", response_model=BudgetOut)
def get_budget(year: int, month: int, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.month == month, Budget.year == year).first()
    if not budget:
        # FR-12: budgets persist month-over-month — carry forward the most recent prior budget
        prior = db.query(Budget).filter(
            (Budget.year < year) | ((Budget.year == year) & (Budget.month < month))
        ).order_by(Budget.year.desc(), Budget.month.desc()).first()
        budget = Budget(
            month=month, year=year,
            total_limit=prior.total_limit if prior else 0,
            category_limits=prior.category_limits if prior else {},
            reset_day=prior.reset_day if prior else 1,
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget


@router.put("/{year}/{month}", response_model=BudgetOut)
def set_budget(year: int, month: int, payload: BudgetIn, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.month == month, Budget.year == year).first()
    if not budget:
        budget = Budget(month=month, year=year)
        db.add(budget)
    budget.total_limit = payload.total_limit
    budget.category_limits = payload.category_limits
    budget.reset_day = payload.reset_day
    db.commit()
    db.refresh(budget)
    return budget
