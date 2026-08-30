"""
Day 2 end-to-end verification script.
Tests all endpoints including new /api/priority and Prophet forecasting.
Run from the mehfooze/ root:
  C:/Python314/python.exe test_day2.py
"""
import httpx
import time
import sys

BASE = "http://127.0.0.1:8001"
PASS = []
FAIL = []

def check(name, condition, detail=""):
    if condition:
        print(f"  ✅ {name}")
        PASS.append(name)
    else:
        print(f"  ❌ {name} — {detail}")
        FAIL.append(name)

print("=" * 60)
print("Day 2 — End-to-End API Verification")
print("=" * 60)

# ── /api/current ──────────────────────────────────────────────
print("\n[1] GET /api/current")
t0 = time.time()
r = httpx.get(f"{BASE}/api/current", timeout=30)
elapsed = time.time() - t0
check("HTTP 200", r.status_code == 200, r.status_code)
data = r.json()
check("Returns 5 zones", len(data) == 5, len(data))
check("Response time < 20s", elapsed < 20, f"{elapsed:.1f}s")
for z in data:
    check(f"{z['name']} has real AQI > 0", z["aqi"] > 0, z["aqi"])
    check(f"{z['name']} has source field", "source" in z)

# ── /api/forecast/{zone} — all 5 zones ───────────────────────
print("\n[2] GET /api/forecast/{zone} — all 5 zones")
ZONES = ["gulberg", "johar-town", "shahdara", "model-town", "defence"]
for zone in ZONES:
    t0 = time.time()
    r = httpx.get(f"{BASE}/api/forecast/{zone}", timeout=30)
    elapsed = time.time() - t0
    pts = r.json()
    check(f"{zone} HTTP 200", r.status_code == 200, r.status_code)
    check(f"{zone} returns 72 points", len(pts) == 72, len(pts))
    check(f"{zone} hour range 1–72",
          pts[0]["hour"] == 1 and pts[-1]["hour"] == 72,
          f"{pts[0]['hour']}..{pts[-1]['hour']}")
    check(f"{zone} all AQI >= 0", all(p["aqi"] >= 0 for p in pts))
    check(f"{zone} has source", all("source" in p for p in pts))
    print(f"     source={pts[0]['source']}  first 3h={[(p['hour'],p['aqi']) for p in pts[:3]]}")

# ── /api/advisory/{profile} ───────────────────────────────────
print("\n[3] GET /api/advisory/{profile} — all profiles")
PROFILES = ["citizen", "parent", "patient", "worker", "school"]
for profile in PROFILES:
    r = httpx.get(f"{BASE}/api/advisory/{profile}", timeout=10)
    adv = r.json()
    check(f"{profile} HTTP 200", r.status_code == 200)
    check(f"{profile} has message", bool(adv.get("message")))
    check(f"{profile} AQI > 0", adv.get("aqi", 0) > 0, adv.get("aqi"))
    check(f"{profile} has aqiCategory", bool(adv.get("aqiCategory")))
    check(f"{profile} has aqiColour", bool(adv.get("aqiColour")))
    msg = adv["message"][:68] + "..." if len(adv["message"]) > 68 else adv["message"]
    print(f"     AQI={adv['aqi']} [{adv['aqiCategory']}] {msg}")

# ── /api/priority ─────────────────────────────────────────────
print("\n[4] GET /api/priority — population-weighted zone ranking")
r = httpx.get(f"{BASE}/api/priority", timeout=15)
check("HTTP 200", r.status_code == 200, r.status_code)
zones = r.json()
check("Returns 5 zones", len(zones) == 5, len(zones))
check("Ranks 1–5 present", [z["rank"] for z in zones] == [1, 2, 3, 4, 5])
check("priorityScore descending",
      all(zones[i]["priorityScore"] >= zones[i+1]["priorityScore"]
          for i in range(len(zones)-1)))
check("All zones have population > 0", all(z["population"] > 0 for z in zones))
check("All zones have AQI > 0", all(z["aqi"] > 0 for z in zones))
print(f"\n  {'Rank':<5} {'Zone':<16} {'AQI':>6} {'Population':>11} {'Score':>10}")
print(f"  {'-'*52}")
for z in zones:
    print(f"  {z['rank']:<5} {z['name']:<16} {z['aqi']:>6.1f} {z['population']:>11,} {z['priorityScore']:>10.1f}")

# ── POST /api/route ───────────────────────────────────────────
print("\n[5] POST /api/route — Travel Mode with real DB AQI")
r = httpx.post(f"{BASE}/api/route",
               json={"origin": "Gulberg, Lahore", "destination": "Shahdara, Lahore"},
               timeout=15)
check("HTTP 200", r.status_code == 200, r.status_code)
segs = r.json()
check("Returns segments", len(segs) > 0, len(segs))
check("All segments have real AQI > 0", all(s["aqiEstimate"] > 0 for s in segs))
check("All segments have zoneId", all("zoneId" in s for s in segs))
check("All segments have aqiNote", all("aqiNote" in s for s in segs))
check("All segments have checklist", all(len(s["checklist"]) > 0 for s in segs))
flood_segs = [s for s in segs if s["floodRisk"]]
check("Shahdara flagged as flood risk", any(s["zoneId"] == "shahdara" for s in flood_segs))
print(f"\n  {'Segment':<10} {'Zone':<16} {'AQI':>6} {'Flood':>6}  Checklist[0]")
print(f"  {'-'*72}")
for s in segs:
    cl = s["checklist"][0][:40] if s["checklist"] else "—"
    print(f"  {s['segmentId']:<10} {s['zoneId']:<16} {s['aqiEstimate']:>6.1f} {str(s['floodRisk']):>6}  {cl}")

# ── Final summary ─────────────────────────────────────────────
print("\n" + "=" * 60)
total = len(PASS) + len(FAIL)
print(f"Results: {len(PASS)}/{total} checks passed")
if FAIL:
    print(f"\nFailed checks:")
    for f in FAIL:
        print(f"  ✗ {f}")
    print()
    sys.exit(1)
else:
    print("\n✅ Day 2 COMPLETE — all endpoints verified with real data.")
    sys.exit(0)
