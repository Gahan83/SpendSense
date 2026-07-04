# SpendSense — Personal Money Tracker

Personal finance web app: parses PhonePe/UPI transaction exports, auto-categorises spending, tracks it against a monthly budget, and sends WhatsApp alerts when you're about to overspend.

Stack: React + Vite + Tailwind (frontend) · Python FastAPI (backend) · SQLite/PostgreSQL · Twilio WhatsApp API.

## Quick start (Docker)

```bash
cp .env.example .env   # fill in Twilio creds if you have them (optional at this stage)
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

## Quick start (local, no Docker)

Backend:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Vite dev server proxies `/api` to `http://localhost:8000` (see `frontend/vite.config.js`).

## Configuring WhatsApp alerts

Open **Settings** in the app and fill in:
- Your WhatsApp phone number (with country code, e.g. `+919XXXXXXXXX`)
- Twilio Account SID and Auth Token
- Twilio WhatsApp sender number (`whatsapp:+14155238886` for the Twilio Sandbox)

Click **Send Test Message** to verify. Toggle alerts on/off without losing the saved credentials.

Sign up for a free [Twilio account](https://www.twilio.com/) and join the WhatsApp Sandbox to get started at zero cost.

## Importing transactions

Export your PhonePe transaction history as CSV/Excel (Profile → Transaction History → download), or use a generic UPI bank statement CSV (HDFC/ICICI/SBI). Go to **Import**, drop the file, and it will:
- Fuzzy-match columns (date, description, amount, debit/credit, UPI ref, status)
- Filter to `SUCCESS` transactions only
- Auto-categorise via keyword rules (editable in Settings)
- Deduplicate on UPI reference ID on re-import

## Budget & alerts

Set a total monthly limit (and optional per-category sub-limits) on the **Budget** page. After every import or manual entry, the backend checks spend against budget and fires WhatsApp alerts:
- 80% threshold warning
- Total limit breach (with overage + triggering transaction)
- Per-category limit breach

Each alert type fires at most once per day per threshold (see `alert_log` table). A month-end summary is sent automatically on the last day of the month (APScheduler cron job) or on demand via **Generate Summary → Send to WhatsApp**.

## Deployment (Render + Supabase + Vercel)

Backend on Render (free web service), database on Supabase (free Postgres project), frontend on Vercel. All three auto-deploy / persist independently of each other.

Render's free plan allows only **one** free Postgres database per account — if you already have one on another project, provision this app's database on Supabase instead so nothing shares or collides.

**Database — Supabase**
1. supabase.com → New project (pick a region close to your Render region).
2. Project Settings → Database → Connection string → copy the **URI** (starts `postgresql://postgres:...`). Fill in the password you set when creating the project.
3. Keep this URI handy for the Render step below.

**Backend — Render**
1. Render dashboard → New → Blueprint → connect `Gahan83/SpendSense` → it reads [render.yaml](render.yaml) and provisions the `spendsense-api` web service (no database — that lives on Supabase now).
2. Once created, open `spendsense-api` → Environment → set `DATABASE_URL` to the Supabase connection string from above.
3. Deploy, then copy the service URL (e.g. `https://spendsense-api-xxxx.onrender.com`).
4. Free tier: Render web service cold-starts ~50s after 15min idle. Supabase free project pauses after 1 week of inactivity (any request wakes it, first one just takes a few extra seconds).

**Frontend — Vercel**
1. Vercel dashboard → New Project → import `Gahan83/SpendSense`.
2. Root Directory → `frontend`. Framework preset auto-detects Vite.
3. Add env var `VITE_API_URL` = the Render backend URL from above (no trailing slash, no `/api` suffix — the app appends it).
4. Deploy. [vercel.json](frontend/vercel.json) handles SPA routing so refreshing `/transactions` etc. doesn't 404.
5. Vite bakes env vars in at build time — redeploy after changing `VITE_API_URL`.

WhatsApp/Twilio credentials are entered live via the Settings page (stored in the database), not as env vars — no extra Render config needed for those.

## Project structure

```
money-tracker/
├── frontend/           React + Vite + Tailwind SPA
│   └── src/{components,pages,hooks,api}/
├── backend/
│   └── app/
│       ├── main.py         FastAPI entry point
│       ├── routers/        transactions, budget, dashboard, settings, alerts, summary, category_rules
│       ├── services/       parser, categoriser, whatsapp_service, settings_service
│       ├── models.py        SQLAlchemy models
│       └── schemas.py       Pydantic schemas
├── docker-compose.yml
└── .env.example
```

## Phase roadmap

- **Phase 1 (this build)** — CSV import, auto-categorisation, dashboard, budget setup, WhatsApp alerts (80% warning, limit breach, category breach), month-end summary.
- **Phase 2** — richer filtering/search (already included), multi-format bank CSV support (already included).
- **Phase 3** — custom keyword rules UI (already included), CSV export (already included).
- **Phase 4 (stretch)** — GPay/HDFC broader parsing, recurring expense detection, spend forecasting.

See the full PRD for detailed requirements (FR-01 through FR-34, acceptance criteria).
