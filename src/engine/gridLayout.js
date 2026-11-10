import { GRID_SIZE, ROAD_EVERY, CENTER } from '../constants.js';
import { buildingCount } from './tierConfig.js';

export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export const isRoad = (x, y) => x % ROAD_EVERY === 0 || y % ROAD_EVERY === 0;
export const isDowntown = (x, y) => Math.abs(x - CENTER) <= 1 && Math.abs(y - CENTER) <= 1;
export const ringDist = (x, y) => Math.max(Math.abs(x - CENTER), Math.abs(y - CENTER));

// Downtown tower tiles by rank: 1-3 tall at the back, 4-6 shorter at the front
export const TOWER_TILES = [
  { x: CENTER - 1, y: CENTER - 1 },
  { x: CENTER + 1, y: CENTER - 1 },
  { x: CENTER - 1, y: CENTER + 1 },
  { x: CENTER + 1, y: CENTER },
  { x: CENTER, y: CENTER + 1 },
  { x: CENTER + 1, y: CENTER + 1 },
];

// Buildable lots, nearest to downtown first
const SLOTS = (() => {
  const out = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (isRoad(x, y) || isDowntown(x, y)) continue;
      const dx = x - CENTER, dy = y - CENTER;
      out.push({ x, y, ring: ringDist(x, y), d2: dx * dx + dy * dy, a: Math.atan2(dy, dx) });
    }
  }
  return out.sort((p, q) => p.ring - q.ring || p.d2 - q.d2 || p.a - q.a);
})();

// Replay the whole history once: each new building takes the nearest free lot
// on the day it's earned. Scores never drop, so nothing ever moves or vanishes.
// Returns [{ playerId, k, x, y, frame }].
export function buildPlacements(snapshots, order) {
  const placed = [];
  const owned = {};
  let next = 0;
  snapshots.forEach((snap, frame) => {
    const cum = Object.fromEntries(snap.players.map(p => [p.player_id, p.cumulative_plw]));
    for (const id of order) {
      const target = buildingCount(cum[id] ?? 0);
      while ((owned[id] ?? 0) < target && next < SLOTS.length) {
        const { x, y } = SLOTS[next++];
        placed.push({ playerId: id, k: owned[id] ?? 0, x, y, frame });
        owned[id] = (owned[id] ?? 0) + 1;
      }
    }
  });
  return placed;
}

// Stable player order: first day they scored, then name
export function firstSeenOrder(snapshots) {
  const first = {};
  snapshots.forEach((snap, i) => snap.players.forEach(p => {
    if (p.cumulative_plw > 0 && first[p.player_id] === undefined) first[p.player_id] = i;
  }));
  return Object.keys(first).sort((a, b) => first[a] - first[b] || a.localeCompare(b));
}
