# Mehfooze — AI-Powered City Safety & Advisory Platform

> **Live App:** https://web-brown-kappa-643kj0w95b.vercel.app/
> **Demo Video:** https://youtu.be/  *(add your YouTube link here)*
> **Built with Kiro · Build With Kiro 2026 Hackathon Submission*

---

## The Problem

Lahore consistently ranks among the most polluted cities on Earth, yet most residents have no practical way to act on that information. Air quality indices are published as raw numbers — a value of 187 means nothing to a parent deciding whether their child should play outside, a respiratory patient planning a commute, or a school administrator choosing between outdoor and indoor activities. The data exists; accessible, role-specific guidance does not.

## The Solution

Mehfooze (Urdu: "protected") is an AI-powered city safety platform that turns raw AQI data into clear, actionable advice — tailored to who you are and what you need to do.

**What it does:**

- **Live AQI Map** — A colour-coded Leaflet map shows real-time air quality across Lahore's zones, auto-refreshing every 10 minutes from Open-Meteo's CAMS atmospheric model. No API key required for core functionality.
- **24–72h Forecast** — A Prophet ML model trained on 90 days of hourly atmospheric readings predicts AQI for the next one to three days, with a physics-based baseline fallback so the endpoint never fails.
- **Role-Specific Advisory** — Four user profiles (Citizen, Parent/Child, Respiratory Patient, Outdoor Worker) each receive a distinct plain-language message and action checklist based on the current AQI band — not a raw number.
- **Schools Go / No-Go** — A single unambiguous green ✅ or red 🚫 signal tells school administrators whether outdoor activities are safe, removing the need to interpret any index value.
- **Travel Mode** — Enter a start and destination within Lahore; the system returns per-segment AQI colour estimates, flags flood-prone road segments, and generates a safety checklist for the journey.

## How AI Is Used

AI is not decorative here — it is the core of the forecast pipeline. The forecasting service fits a Facebook Prophet model on historical hourly AQI and meteorological readings (temperature, humidity, wind speed) for each zone. Prophet handles the daily and weekly seasonality patterns common in urban pollution cycles. When fewer than 48 data points exist for a zone, the system automatically falls back to a physical inversion baseline model, ensuring 100% forecast availability. The advisory layer maps ML-derived AQI bands to profile-specific guidance, replacing raw numbers with human-readable decisions.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · SQLAlchemy · PostgreSQL · Prophet ML |
| Data Sources | Open-Meteo CAMS (primary) · AQICN (optional) · OSRM routing |
| Frontend | React · Vite · TypeScript · Tailwind · Leaflet · Recharts |
| Mobile | Flutter · Firebase Auth · FCM |
| Deployment | Vercel (frontend) · Render (backend + PostgreSQL) |

## How Kiro's Spec-Driven Workflow Was Used

This project was built entirely through Kiro's spec-driven development process:

1. **Requirements first** — User stories and acceptance criteria were written in `.kiro/specs/mehfooze/requirements.md` before a single line of application code was written. Each story defines a real user need (citizen, parent, school administrator, commuter) and concrete, testable acceptance criteria.
2. **Architecture before code** — `.kiro/specs/mehfooze/design.md` documents the component breakdown, data flow diagram, and key technical decisions (why Prophet over LSTM, why OSRM over Google Maps, why Vercel + Render) before implementation began.
3. **Task-driven sprint** — `.kiro/specs/mehfooze/tasks.md` broke the four-day hackathon sprint into daily checklists, ensuring every feature mapped back to a requirement.

The `.kiro/specs/` folder in this repository is the original artifact produced by this workflow — unedited.

## Running Locally

```bash
# Backend
cp app/.env.example app/.env   # set DATABASE_URL and optionally AQICN_TOKEN
pip install -r app/requirements.txt
uvicorn app.main:app --reload

# Frontend
cd web
npm install
npm run dev
```

## Project Structure

```
mehfooze/
├── .kiro/specs/mehfooze/   # Kiro spec-driven artifacts (requirements, design, tasks)
├── app/                    # FastAPI backend (models, routers, services)
├── web/                    # React + Vite frontend
├── mobile/                 # Flutter mobile app
├── render.yaml             # Render free-tier deployment config
└── docker-compose.yml      # Local dev environment
```

---

*Build With Kiro 2026 · Individual Submission · Deployed on Vercel + Render*
