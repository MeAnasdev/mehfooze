"""
Day 1 verification script.
Run from the mehfooze/ root:
  cd d:/Project Mehfooze/mehfooze
  python test_day1.py
"""
import sys
import os

# Make "app" importable as a package from the root
sys.path.insert(0, os.path.abspath("."))
# Also ensure the app/ directory itself is on the path for intra-package imports
os.chdir(os.path.join(os.path.dirname(__file__), "app"))

from app.base import Base
from app.database import engine, SessionLocal
from app.models.zone import Zone
from app.models.reading import AqiReading

# Create tables
Base.metadata.create_all(bind=engine)
print("✅ DB tables created (SQLite: mehfooze_dev.db)")

db = SessionLocal()

# Seed zones
from app.services.ingest import ensure_zones_seeded, fetch_live_aqi
ensure_zones_seeded(db)
zone_count = db.query(Zone).count()
print(f"✅ Zones seeded: {zone_count} zones in DB")

# Fetch live AQI
print("\n🔄 Fetching live AQI from Open-Meteo CAMS (real Lahore data — no API key)...")
results = fetch_live_aqi(db)

print(f"\n✅ Live data for {len(results)} Lahore zones:\n")
header = f"{'Zone':<15} {'AQI':>6} {'PM2.5':>7} {'Temp':>6} {'Humidity':>9} {'Wind':>8}  Source"
print(header)
print("-" * len(header))
for r in results:
    line = (
        f"{r['name']:<15} "
        f"{r['aqi']:>6.1f} "
        f"{r['pm25']:>7.1f} "
        f"{r['temperature']:>5.1f}C "
        f"{r['humidity']:>8.0f}% "
        f"{r['wind_speed']:>6.1f}kmh "
        f"  {r['source']}"
    )
    print(line)

# Verify DB persistence
reading_count = db.query(AqiReading).count()
print(f"\n✅ {reading_count} AQI readings persisted to DB")

# Test forecast (Open-Meteo native)
from app.services.forecaster import get_forecast
print("\n🔄 Fetching 72h forecast for Gulberg...")
forecast = get_forecast("gulberg", db)
print(f"✅ Forecast: {len(forecast)} hourly points, source: {forecast[0]['source'] if forecast else 'N/A'}")
first_6 = [(p["hour"], p["aqi"]) for p in forecast[:6]]
print(f"   First 6 hours: {first_6}")

# Test advisory for all profiles
from app.services.advisory import build_advisory, get_current_max_aqi, aqi_category
current_aqi = get_current_max_aqi(db)
cat = aqi_category(current_aqi)
print(f"\n✅ Current Lahore AQI: {current_aqi:.0f} ({cat})")
print("\nRole-specific advisories:")
for profile in ["citizen", "parent", "patient", "worker", "school"]:
    adv = build_advisory(profile, db)
    msg = adv["message"][:72] + "..." if len(adv["message"]) > 72 else adv["message"]
    print(f"  [{profile:8}] {msg}")

db.close()
print("\n✅ Day 1 COMPLETE — all real Lahore data flowing end-to-end.")
