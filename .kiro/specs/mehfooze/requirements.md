# Requirements — Mehfooze

**User Stories & Acceptance Criteria**
*Built with Kiro spec-driven workflow · Hackathon submission artifact*

---

## 1. Live AQI Map

**As a citizen**, I want to see a colour-coded map of Lahore's current air quality by zone, so that I can immediately understand which neighbourhoods are polluted right now.

**Acceptance Criteria**
- The map shows at least 3 Lahore monitoring stations with colour-coded markers (green / yellow / orange / red / purple / maroon) following the EPA AQI scale.
- Each marker displays the numeric AQI and a label stating "Estimated from nearest station."
- The map auto-refreshes every 10 minutes without a full page reload.
- If a live API call fails, the last cached reading is shown with a "cached data" label.

---

## 2. 24–72h AQI Forecast

**As a citizen**, I want to see a 24–72 hour AQI forecast for my zone so that I can plan outdoor activities in advance.

**Acceptance Criteria**
- A line chart shows hourly AQI predictions for the next 24 hours minimum (72 hours as stretch goal).
- Reference lines mark EPA threshold levels (Good / Moderate / Unhealthy).
- The chart clearly labels the forecast as an estimate.
- If the ML model (Prophet/SARIMA) is unavailable, a physical baseline forecast is shown automatically.

---

## 3. Role-Specific Advisory

**As a parent / patient / outdoor worker / citizen**, I want plain-language advice tailored to my role, so that I know exactly what to do rather than interpreting a raw AQI number.

**Acceptance Criteria**
- Profile toggle offers: Citizen, Parent/Child, Respiratory Patient, Outdoor Worker.
- Each profile receives a distinct message and a bullet-point action list based on the current AQI band.
- The advisory updates instantly when the profile is switched.
- The advisory is generated from a rule table; an AI layer may augment it in a future phase.

---

## 4. Mehfooze Schools — Go / No-Go Signal

**As a school administrator**, I want a single clear go / no-go indicator for outdoor activities, so that I do not need to interpret AQI numbers myself.

**Acceptance Criteria**
- The Schools page shows a large, unambiguous GO (green ✅) or NO-GO (red 🚫) signal.
- Signal is derived from the current maximum city-wide AQI:
  - ≤ 100 → GO
  - 101–150 → Caution (outdoor activity for sensitive students only)
  - > 150 → NO-GO
- A one-sentence plain-language reason accompanies the signal.

---

## 5. Travel Mode — Route AQI Overlay

**As a commuter**, I want to see air quality along my planned route so that I can decide whether to wear a mask or take an alternate path.

**Acceptance Criteria**
- User can input a start and destination (plain text addresses within Lahore).
- The system returns per-segment AQI colour estimates (green / yellow / red).
- Known flood-prone segments are flagged with a ⚠ icon.
- A rule-based safety checklist is generated from the route conditions (e.g. "AQI unhealthy — N95 mask recommended").
- All estimates are labelled "Estimated from nearest station — not block-level precision."

---

## 6. Deployment & Accessibility

**As a hackathon judge**, I want the project to be publicly accessible via a live URL, so that I can evaluate it without a local setup.

**Acceptance Criteria**
- The application is deployed on a free-tier hosting platform (Vercel / Netlify / Render / Railway or equivalent).
- The live URL returns a working dashboard with real or cached data.
- The frontend is accessible: ARIA labels on interactive elements, keyboard-navigable profile toggles, sufficient colour contrast alongside numeric AQI values (colour alone does not convey meaning).
- Git commits fall only within the allowed window (26 Jul – 10 Sep 2026).
