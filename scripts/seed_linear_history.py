"""
One-off: fill history from season start (Sep 1) up to the first real snapshot,
assuming each player's PLW_YTD grew linearly from 0. Filled days are tagged
"estimated": true so the UI can label them; real snapshots are left untouched.

Usage (repo root): python scripts/seed_linear_history.py
"""

import json
from datetime import date, timedelta

HISTORY_FILE = "public/history.json"
SEASON_START = date(2026, 9, 1)


def main():
    history = [s for s in json.load(open(HISTORY_FILE)) if not s.get("estimated")]
    first = history[0]
    end = date.fromisoformat(first["date"])
    span = (end - SEASON_START).days

    filled = []
    for i in range(span):
        d = SEASON_START + timedelta(days=i)
        frac = i / span
        filled.append({"date": d.isoformat(), "estimated": True, "players": [
            {"player_id": p["player_id"], "mtd_plw": 0, "cumulative_plw": round(p["cumulative_plw"] * frac)}
            for p in first["players"]
        ]})

    with open(HISTORY_FILE, "w") as f:
        json.dump(filled + history, f, separators=(",", ":"))
    print(f"Filled {len(filled)} estimated days {SEASON_START} → {end - timedelta(1)}; {len(history)} real day(s)")


if __name__ == "__main__":
    main()
