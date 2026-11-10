"""
Scrape PS11 roster from ICN (password-gated Squarespace page) and update
public/team_stats.json + public/history.json + public/carry.json.

Score = the page's PLW_YTD column, unchanged. On a season reset the old
YTD is banked in carry.json so the city never shrinks.

Usage:
  pip install playwright requests
  playwright install chromium
  ICN_PASSWORD=... python scripts/scrape_plw.py
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

import requests

PAGE_URL     = "https://impactcoachingnetwork.org/ps11chessclubandteamstats"
OUT_FILE     = "public/team_stats.json"
HISTORY_FILE = "public/history.json"
CARRY_FILE   = "public/carry.json"

# Header text (lowercased, tags stripped) -> key. Mirrors
# claude_projects/chess_club_stats/chess_club_stats.py — column order varies.
HEADER_KEY_MAP = {
    "name": "name",
    "grade": "grade",
    "uscf rating": "uscf_rating",
    "chess kid rating": "ck_rating",
    "plw": "plw",
    "plw_ytd": "plw_ytd",
}
NUMERIC = {"uscf_rating", "ck_rating", "plw", "plw_ytd"}


def fetch_roster_html():
    """Pass the Squarespace page gate, resolve the tokenized iframe URL, return table HTML."""
    password = os.environ.get("ICN_PASSWORD")
    if not password:
        raise RuntimeError("ICN_PASSWORD not set")
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(PAGE_URL, wait_until="domcontentloaded")
        if page.locator("input[name=password]").count():
            page.fill("input[name=password]", password)
            page.keyboard.press("Enter")
        page.wait_for_selector("iframe[src*='ck_data_']", state="attached", timeout=30000)
        data_url = page.locator("iframe[src*='ck_data_']").first.get_attribute("src")
        print(f"[scrape] Data URL: {data_url}")

        r = requests.get(data_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
        if r.ok and "<table" in r.text:
            html = r.text
        else:  # data URL itself gated — read through the authenticated browser
            print(f"[scrape] Direct fetch {r.status_code}; reading iframe via browser")
            frame = page.frame_locator("iframe[src*='ck_data_']").first
            html = frame.locator("table").first.evaluate("t => t.outerHTML")
        browser.close()
    return html


def parse_roster(html):
    headers = [re.sub(r"<[^>]+>", "", h).strip().lower()
               for h in re.findall(r"<th[^>]*>(.*?)</th>", html, re.S)]
    cols = [HEADER_KEY_MAP.get(h) for h in headers]
    print(f"[scrape] Columns: {headers}")
    out = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S):
        cells = [re.sub(r"<[^>]+>", "", c).strip()
                 for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        if len(cells) != len(cols):
            continue
        rec = {}
        for col, v in zip(cols, cells):
            if col is None:
                continue
            if col in NUMERIC:
                try:
                    v = int(v.replace(",", "") or 0)
                except ValueError:
                    v = 0
            rec[col] = v
        if rec.get("name"):
            out.append(rec)
    return out


def load_json(path, default):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default


def update_carry(carry, roster):
    """Score = PLW_YTD exactly as shown on the ICN page, plus anything banked
    from earlier seasons. If a player's YTD drops (new season), bank the old value
    so the city never shrinks."""
    banked = carry.setdefault("banked", {})
    last = carry.setdefault("last", {})
    for p in roster:
        name, cur = p["name"], p.get("plw_ytd", 0)
        if cur < last.get(name, 0):
            banked[name] = banked.get(name, 0) + last[name]
            print(f"[carry] {name}: YTD {last[name]} → {cur}, banked {last[name]}")
        last[name] = cur
    carry["total"] = {k: banked.get(k, 0) + v for k, v in last.items()}
    return carry


def build_output(roster, carry):
    total = carry["total"]
    players = []
    for p in roster:
        players.append({
            "player_id":      p["name"],
            "mtd_plw":        p.get("plw", 0),
            "cumulative_plw": round(total.get(p["name"], 0)),
            "uscf_rating":    p.get("uscf_rating", 0),
            "ck_rating":      p.get("ck_rating", 0),
            "grade":          p.get("grade", ""),
        })
    # Kids no longer on the roster keep their buildings — city never shrinks
    on_roster = {p["name"] for p in roster}
    players += [{"player_id": k, "mtd_plw": 0, "cumulative_plw": round(v)}
                for k, v in total.items() if k not in on_roster]
    players = [p for p in players if p["cumulative_plw"] > 0]
    players.sort(key=lambda x: x["cumulative_plw"], reverse=True)
    return {
        "generated_at":   datetime.now(timezone.utc).isoformat(),
        "total_team_plw": sum(p["cumulative_plw"] for p in players),
        "players":        players,
    }


def append_history(output):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    history = load_json(HISTORY_FILE, [])
    snap = {"date": today, "players": [
        {"player_id": p["player_id"], "mtd_plw": p["mtd_plw"], "cumulative_plw": p["cumulative_plw"]}
        for p in output["players"]
    ]}
    history = [s for s in history if s["date"] != today] + [snap]
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, separators=(",", ":"))
    print(f"[history] {len(history)} day(s)")


def main():
    try:
        roster = parse_roster(fetch_roster_html())
        if not roster:
            raise RuntimeError("Parsed 0 players — table layout changed?")
        if not any("plw_ytd" in p for p in roster):
            raise RuntimeError("No PLW_YTD column on the page")
    except Exception as e:
        print(f"::warning::Scrape failed, keeping last data: {e}")
        sys.exit(0)
    print(f"[scrape] {len(roster)} players")

    carry = update_carry(load_json(CARRY_FILE, {}), roster)
    output = build_output(roster, carry)

    with open(CARRY_FILE, "w") as f:
        json.dump(carry, f, indent=1)
    with open(OUT_FILE, "w") as f:
        json.dump(output, f, indent=2)
    print(f"[scrape] Wrote {len(output['players'])} players, team total {output['total_team_plw']}")
    append_history(output)


if __name__ == "__main__":
    main()
