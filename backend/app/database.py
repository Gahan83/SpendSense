import os
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./money_tracker.db")
# Render (and old Heroku-style) Postgres URLs use the "postgres://" scheme,
# which SQLAlchemy 1.4+ no longer accepts.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Optional dedicated schema so this app's tables don't collide with another
# app sharing the same Postgres instance (e.g. a shared free-tier database).
DB_SCHEMA = os.getenv("DB_SCHEMA")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

if DB_SCHEMA and not DATABASE_URL.startswith("sqlite"):
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))
    metadata = MetaData(schema=DB_SCHEMA)
else:
    metadata = MetaData()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base(metadata=metadata)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
