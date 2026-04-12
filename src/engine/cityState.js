import { assignZones, buildZoneTiles } from './gridLayout.js';

const STORAGE_KEY = 'plwcity_state';

export function buildCityState(players) {
  const zones = assignZones(players);
  const plw = {};
  const tiers = {};
  const skyscrapers = {};
  const allTiles = {};

  players.forEach(p => {
    plw[p.player_id] = p.cumulative_plw ?? p.mtd_plw ?? 0;
    const cum = plw[p.player_id];
    skyscrapers[p.player_id] = cum >= 1000;
    allTiles[p.player_id] = buildZoneTiles(p.player_id, cum, zones[p.player_id]);
  });

  return {
    players,
    zones,
    plw,
    skyscrapers,
    allTiles,
    lastUpdated: new Date().toISOString(),
  };
}

export function diffPlayers(prevPlw, newPlayers) {
  const changed = [];
  newPlayers.forEach(p => {
    const prev = prevPlw[p.player_id] ?? null;
    const curr = p.cumulative_plw ?? p.mtd_plw ?? 0;
    if (prev !== null && prev !== curr) {
      changed.push({ player_id: p.player_id, prev, curr });
    }
  });
  return changed;
}

export function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage full — skip silently
  }
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function archiveMonth(month) {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      localStorage.setItem(`plwcity_archive_${month}`, current);
    }
  } catch {
    // ignore
  }
}

export function detectMonthReset(prevPlayers, newPlayers) {
  if (!prevPlayers?.length) return false;
  const prevAbove = prevPlayers.some(p => (p.cumulative_plw ?? p.mtd_plw ?? 0) > 0);
  const newAllZero = newPlayers.every(p => (p.mtd_plw ?? 0) <= 0);
  return prevAbove && newAllZero;
}
