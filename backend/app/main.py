import calendar
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from .database import Base, engine, SessionLocal
from .models import CategoryRule
from .categories import DEFAULT_KEYWORD_RULES
from .services.whatsapp_service import send_month_end_summary
from .routers import transactions, dashboard, budget, settings, category_rules, alerts, summary


def seed_category_rules():
    db = SessionLocal()
    try:
        if db.query(CategoryRule).count() == 0:
            for keyword, category in DEFAULT_KEYWORD_RULES:
                db.add(CategoryRule(keyword=keyword, category=category, is_custom=0))
            db.commit()
    finally:
        db.close()


def run_month_end_job():
    today = date.today()
    last_day = calendar.monthrange(today.year, today.month)[1]
    if today.day != last_day:
        return
    db = SessionLocal()
    try:
        send_month_end_summary(db, today.month, today.year)
    finally:
        db.close()


scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_category_rules()
    scheduler.add_job(run_month_end_job, "cron", hour=23, minute=55)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="SpendSense API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(budget.router)
app.include_router(settings.router)
app.include_router(category_rules.router)
app.include_router(alerts.router)
app.include_router(summary.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
