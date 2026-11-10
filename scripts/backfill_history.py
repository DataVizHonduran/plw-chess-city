"""
One-off: rebuild public/history.json + public/carry.json from every committed
version of public/team_stats.json (real daily scrapes, Apr 13 2026 onward),
using the same never-shrinking accumulation as scrape_plw.update_carry.
Snapshots before Apr 13 were simulated in v1 and are dropped.

Usage (repo root): PYTHONPATH=scripts python scripts/backfill_history.py
"""

import json
import subprocess
from datetime import date, timedelta

from scrape_plw import update_carry, HISTORY_FILE, CARRY_FILE


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def main():
    # Every committed team_stats.json, oldest first; last commit per day wins
    by_date = {}
    for line in git("log", "--reverse", "--format=%H %ad", "--date=short", "--", "public/team_stats.json").splitlines():
        sha, d = line.split()
        if d < "2026-04-13":
            continue
        data = json.loads(git("show", f"{sha}:public/team_stats.json"))
        by_date[d] = [{"name": p["player_id"], "plw": p.get("mtd_plw", 0)} for p in data["players"]]

    carry, history = {}, []
    dates = sorted(by_date)
    for i, d in enumerate(dates):
        roster = by_date[d]
        # Days with no scrape: repeat the last roster so those days still count
        day = date.fromisoformat(d)
        nxt = date.fromisoformat(dates[i + 1]) if i + 1 < len(dates) else day + timedelta(1)
        while day < nxt:
            carry = update_carry(carry, roster, "plw", day.isoformat())
            day += timedelta(1)
        plw = {p["name"]: p["plw"] for p in roster}
        history.append({"date": d, "players": [
            {"player_id": k, "mtd_plw": plw.get(k, 0), "cumulative_plw": round(v)}
            for k, v in carry["total"].items() if v > 0
        ]})

    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, separators=(",", ":"))
    with open(CARRY_FILE, "w") as f:
        json.dump(carry, f, indent=1)
    top = sorted(history[-1]["players"], key=lambda p: -p["cumulative_plw"])
    print(f"{len(history)} days, {history[0]['date']} → {history[-1]['date']}")
    print("Top 5:", [(p["player_id"], p["cumulative_plw"]) for p in top[:5]])


if __name__ == "__main__":
    main()
