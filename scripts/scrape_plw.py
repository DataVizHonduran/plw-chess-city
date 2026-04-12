"""
Scrape PLW data from ICN Chess roster page and write team_stats.json.
Monthly game: city grows on MTD PLW only. Resets each month.

Usage:
  pip install requests beautifulsoup4
  python scripts/scrape_plw.py
"""

import requests
import json
import os
import sys
from bs4 import BeautifulSoup
from datetime import datetime

URL = "https://icnadmin2.com/icnroster/ck_data_PS11.html"
OUT_FILE     = "public/team_stats.json"
HISTORY_FILE = "public/history.json"


def scrape():
    print(f"[scrape] Fetching {URL}")
    r = requests.get(URL, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    table = soup.find("table")
    if not table:
        raise ValueError("No <table> found in page — check URL or HTML structure")

    headers = [th.get_text(strip=True) for th in table.find_all("th")]
    print(f"[scrape] Columns found: {headers}")

    rows = []
    tbody = table.find("tbody") or table
    for tr in tbody.find_all("tr"):
        cells = [td.get_text(strip=True) for td in tr.find_all("td")]
        if len(cells) == len(headers):
            rows.append(dict(zip(headers, cells)))

    # Filter: USCF Rating > 0
    def uscf(row):
        return int(row.get("USCF Rating", "0").replace(",", "") or 0)

    players = [r for r in rows if uscf(r) > 0]
    print(f"[scrape] {len(players)} players with USCF Rating > 0 (of {len(rows)} total rows)")
    return players


def safe_int(val):
    """Parse integer from string, return 0 on failure."""
    try:
        return int(str(val).replace(",", "").strip() or "0")
    except (ValueError, TypeError):
        return 0


def detect_reset(players):
    """True if ≥60% of players have PLW <= 0 — indicates month rolled."""
    if not players:
        return False
    zeros = sum(1 for p in players if safe_int(p.get("PLW", 0)) <= 0)
    return zeros > len(players) * 0.6


def build_output(players):
    out = []
    for p in players:
        # NOTE: always use key access (not attribute) — row.name would return index
        name = p["Name"]
        mtd  = safe_int(p.get("PLW", 0))
        out.append({
            "player_id":      name,
            "mtd_plw":        mtd,
            "base_plw":       0,
            "cumulative_plw": mtd,   # monthly game: city grows on MTD only
            "uscf_rating":    safe_int(p.get("USCF Rating", 0)),
            "ck_rating":      safe_int(p.get("Chess Kid Rating", 0)),
            "grade":          p.get("Grade", "").strip(),
        })
    out.sort(key=lambda x: x["cumulative_plw"], reverse=True)
    total = sum(x["cumulative_plw"] for x in out)
    return {
        "generated_at":   datetime.utcnow().isoformat() + "Z",
        "total_team_plw": total,
        "players":        out,
    }


def main():
    os.makedirs("public", exist_ok=True)
    players = scrape()

    if detect_reset(players):
        print("[scrape] Month reset detected — clearing history for new month")
        with open(HISTORY_FILE, "w") as f:
            json.dump([], f)

    output = build_output(players)
    with open(OUT_FILE, "w") as f:
        json.dump(output, f, indent=2)
    print(f"[scrape] Wrote {len(output['players'])} players → {OUT_FILE}")
    print(f"[scrape] Team total cumulative PLW: {output['total_team_plw']}")

    append_history(output)


def append_history(output):
    """Upsert today's snapshot into history.json (keyed by date)."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    history = []
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE) as f:
            history = json.load(f)

    # Upsert by date (replace if same day, otherwise append)
    snapshot = {
        "date": today,
        "players": [
            {
                "player_id":      p["player_id"],
                "mtd_plw":        p["mtd_plw"],
                "cumulative_plw": p["mtd_plw"],   # same value — monthly game
            }
            for p in output["players"]
        ],
    }
    existing = next((i for i, s in enumerate(history) if s["date"] == today), None)
    if existing is not None:
        history[existing] = snapshot
    else:
        history.append(snapshot)

    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)
    print(f"[history] {len(history)} day(s) recorded in {HISTORY_FILE}")


if __name__ == "__main__":
    main()
