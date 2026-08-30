"""
Seed all 5 Lahore zones with 9 months of historical AQI data from Open-Meteo.
Run once to bootstrap Prophet training data.
Usage:  python seed_zones.py  (from mehfooze/ root)
"""
import sys, os, time
sys.path.insert(0, os.path.abspath("."))
os.chdir(os.path.join(os.path.dirname(__file__), "app"))

from concurrent.futures import ThreadPoolExecutor, as_completed
from app.database import SessionLocal, engine
from app.base import Base
from app.services.forecaster import seed_historical_data
from app.services.ingest import LAHORE_ZONES, ensure_zones_seeded

Base.metadata.create_all(bind=engine)

def seed_zone(zone_id):
    db = SessionLocal()
    try:
        t0 = time.time()
        count = seed_historical_data(zone_id, db)
        elapsed = time.time() - t0
        return zone_id, count, elapsed, None
    except Exception as exc:
        return zone_id, 0, 0, str(exc)
    finally:
        db.close()

# Ensure zones exist first
db = SessionLocal()
ensure_zones_seeded(db)
db.close()

zone_ids = [z["id"] for z in LAHORE_ZONES]
print(f"Seeding {len(zone_ids)} zones in parallel — this takes ~30–60s per zone...\n")

results = {}
with ThreadPoolExecutor(max_workers=len(zone_ids)) as executor:
    futures = {executor.submit(seed_zone, zid): zid for zid in zone_ids}
    for future in as_completed(futures):
        zid, count, elapsed, err = future.result()
        if err:
            print(f"  ❌ {zid}: FAILED — {err}")
        else:
            print(f"  ✅ {zid}: {count} rows inserted in {elapsed:.0f}s")
        results[zid] = count

total = sum(results.values())
print(f"\n✅ Seed complete — {total} total historical rows across all zones.")
print("   Prophet forecasting is now enabled for all zones.")
