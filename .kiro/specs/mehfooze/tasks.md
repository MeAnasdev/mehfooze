# Tasks — Mehfooze

**Implementation Task Checklist**
*Built with Kiro spec-driven workflow · Hackathon submission artifact*

---

## Phase 0 — Hackathon Sprint (Aug 25–28) ✅ Completed

### Day 1 · Aug 25 — Data Foundation

- [x] Register AQICN token; verify live AQI pull for 3 Lahore stations
- [x] Register OpenAQ API key as backup data source
- [x] Pull historical weather from Open-Meteo (wind, humidity, temp, 90-day window)
- [x] Set up PostgreSQL; run Alembic initial migration (zones + aqi_readings tables)
- [x] Implement `services/ingest.py` — AQICN fetch + DB write + cached fallback
- [x] Scaffold FastAPI app (`main.py`, `config.py`, `database.py`)
- [x] Scaffold React + Vite frontend with basic routing (Home / Travel / Schools)

### Day 2 · Aug 26 — Forecast Engine + API

- [x] Train Prophet baseline on 90-day historical data for Gulberg station
- [x] Implement `services/forecaster.py` — Prophet + physical-baseline fallback
- [x] Implement `GET /api/current` — live AQI endpoint
- [x] Implement `GET /api/forecast/{zone}` — 24h forecast (72h stretch)
- [x] Implement `GET /api/advisory/{profile}` — rule-based advisory matrix
- [x] Add population-weighted zone prioritisation pass (WorldPop data if available)

### Day 3 · Aug 27 — Dashboard + Travel Mode, End-to-End

- [x] Build `AqiMap.tsx` — Leaflet map with colour-coded zone markers
- [x] Build `ForecastChart.tsx` — Recharts 24–72h line chart with EPA threshold lines
- [x] Build `AdvisoryPanel.tsx` — profile tabs + advisory message display
- [x] Build `HomePage.tsx` — wire map + chart + advisory together
- [x] Implement `services/routing.py` — Google Directions/OSRM + segment enrichment
- [x] Implement `POST /api/route` — route overlay endpoint
- [x] Build `TravelPage.tsx` — route form + segment colour strip + flood flags + checklist
- [x] Build `SchoolsPage.tsx` — Go / No-Go signal derived from advisory endpoint
- [x] Wire full end-to-end loop with live data (ingest → forecast → advisory → UI)
- [x] Add ARIA labels and keyboard navigation to profile toggle and map markers

### Day 4 · Aug 28 — Demo Day

- [x] Deploy frontend to Vercel; deploy backend to Render
- [x] Verify live URL is publicly accessible
- [x] Test cached-data fallback by disabling AQICN token temporarily
- [x] Polish pitch: problem → solution → live demo flow
- [x] Record 2–4 minute demo video (deployed app + walkthrough of requirements.md + tasks.md in Kiro)
- [x] Write 300–500 word project description
- [x] Submit via official submission portal before deadline

---

## Phase 1 — Validation (September 2026)

- [ ] Log daily forecast-vs-actual error per zone; publish accuracy report
- [ ] Expand station coverage beyond the initial 3–5 stations
- [ ] Run 2–3 school pilot program with go/no-go view
- [ ] Onboard respiratory-patient volunteer feedback cohort
- [ ] Harden ingestion: add retry logic, alerting on stale feeds, fallback chain

---

## Phase 2 — Public Market Launch (October 2026)

- [ ] PWA manifest + service worker for installable app
- [ ] Push notification support for advisory alerts
- [ ] Urdu localisation of all advisory messages and UI labels
- [ ] SMS advisory channel (Twilio or local gateway) for lower-connectivity users
- [ ] School partnership onboarding flow
- [ ] Public launch campaign (local media, university networks, EPA Punjab briefing)

---

## Phase 3 — Scale (Q1 2027+)

- [ ] Extend forecasting engine to Multan, Faisalabad, Gujranwala
- [ ] Build B2B advisory API (schools, logistics, insurers)
- [ ] Policy-facing EPA Punjab dashboard (pollution hotspots over time)
- [ ] Automatic least-polluted route suggestion (active re-routing)
- [ ] Live-traffic-aware routing (pending Lahore open-data maturity)
