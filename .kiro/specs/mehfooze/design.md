# Design — Mehfooze

**Technical Architecture & Key Decisions**
*Built with Kiro spec-driven workflow · Hackathon submission artifact*

---

## System Overview

```
[AQICN / OpenAQ]  [Open-Meteo]
       │                │
       └──── Ingestion Service (Python / httpx)
                        │
                   [PostgreSQL]
                        │
              ML Forecasting Service
              (Prophet → physical baseline fallback)
                        │
                FastAPI Backend
                  /api/current
                  /api/forecast/:zone
                  /api/advisory/:profile
                  /api/route
                        │
               React + Leaflet Frontend
            ┌───────────┬───────────┐
          Home        Travel     Schools
```

---

## Component Breakdown

### Backend (`app/`)
| File | Role |
|---|---|
| `main.py` | FastAPI app, CORS middleware, router registration |
| `config.py` | Pydantic-settings — env vars + .env file |
| `database.py` | SQLAlchemy engine, session factory, `Base` |
| `models/zone.py` | `Zone` ORM model |
| `models/reading.py` | `AqiReading` ORM model (time-series store) |
| `routers/current.py` | `GET /api/current` |
| `routers/forecast.py` | `GET /api/forecast/{zone}` |
| `routers/advisory.py` | `GET /api/advisory/{profile}` |
| `routers/route.py` | `POST /api/route` |
| `services/ingest.py` | AQICN pull + DB persist + cached fallback |
| `services/forecaster.py` | Prophet → physical baseline forecast |
| `services/advisory.py` | Rule-based advisory matrix |
| `services/routing.py` | Google Directions / OSRM + segment enrichment |

### Frontend (`web/src/`)
| File | Role |
|---|---|
| `App.tsx` | React Router shell with 3 routes |
| `components/AqiMap.tsx` | Leaflet map with colour-coded zone markers |
| `components/ForecastChart.tsx` | Recharts 24–72h line chart |
| `components/AdvisoryPanel.tsx` | Profile tab + advisory message |
| `pages/HomePage.tsx` | Default Mehfooze Home view |
| `pages/TravelPage.tsx` | Route input + segment results |
| `pages/SchoolsPage.tsx` | Go / No-Go signal |
| `services/api.ts` | Axios wrappers for all backend endpoints |
| `types/api.ts` | TypeScript interfaces |

---

## Data Flow

1. **Ingestion** — A cron job (or startup trigger) calls `ingest.py` every 10 minutes. It fetches live AQI from AQICN for each configured station and matching weather from Open-Meteo, then writes an `AqiReading` row per station.

2. **Forecast** — `GET /api/forecast/{zone}` calls `forecaster.py`, which loads the last 90 days of hourly readings and fits a Prophet model. If fewer than 48 data points exist, the physical baseline is used instead.

3. **Advisory** — `GET /api/advisory/{profile}` calls `advisory.py`, which reads the current maximum city-wide AQI from the DB/cache and looks up the matching rule row for the requested profile.

4. **Route overlay** — `POST /api/route` calls `routing.py`, which requests the route from Google Directions (or OSRM fallback), splits it into steps, maps each step to the nearest zone via Euclidean distance, retrieves the zone's latest AQI, checks the flood-prone zone list, and builds a checklist.

---

## Key Technical Decisions

| Decision | Chosen option | Reason |
|---|---|---|
| Forecasting model | Prophet (primary) + physical baseline (fallback) | Prophet handles daily/weekly seasonality well on short training windows; the physical baseline ensures the endpoint never returns an error |
| Routing | Google Directions API (with OSRM/OSM fallback) | Free tier sufficient for demo; OSRM keeps costs zero post-hackathon |
| Map library | Leaflet via react-leaflet | Lightweight, open source, no API key required |
| Database | PostgreSQL + SQLAlchemy | Matches the project blueprint; handles time-series reads efficiently |
| Frontend build | Vite + React + TypeScript | Fast HMR, small production bundle |
| Deployment | Vercel (frontend) + Render (backend) | Both have free tiers; Vercel has zero-config for Vite |

---

## Deployment Architecture

```
Vercel (frontend)
  └── React SPA (dist/)
  └── /api → proxied to Render backend

Render (backend)
  └── Uvicorn / FastAPI
  └── Connected to Render PostgreSQL (free tier)
```

All data readings are labelled "estimated from nearest station" at both API and UI layers.

---

## Deferred / Out of Scope

- Automatic least-polluted route re-routing (Phase 2)
- Live traffic-aware routing (blocked on Lahore open data maturity)
- LSTM upgrade (only if time after Prophet works end-to-end)
- Generic multi-hazard coverage (heatwaves, dust storms, etc.)
