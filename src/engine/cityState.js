import { GRID_SIZE } from '../constants.js';
import { hashStr, seededRand, isRoad, isDowntown, ringDist, TOWER_TILES } from './gridLayout.js';
import { buildingPool, GROUND, PARK_PROPS, PLAZA_PROPS } from './tierConfig.js';

// Everything the renderer needs for one day of history.
export function buildFrame(snapshot, frameIdx, placements) {
  const players = snapshot.players;
  const cum = Object.fromEntries(players.map(p => [p.player_id, p.cumulative_plw]));
  const teamTotal = players.reduce((s, p) => s + p.cumulative_plw, 0);
  const top3 = [...players].sort((a, b) => b.cumulative_plw - a.cumulative_plw).slice(0, 3);

  const lots = {};
  let radius = 2;
  for (const b of placements) {
    if (b.frame > frameIdx) continue;
    const pool = buildingPool(cum[b.playerId] ?? 0);
    const seed = hashStr(b.playerId) + b.k * 97;
    const stem = pool[Math.floor(seededRand(seed) * pool.length)]
      + (seededRand(seed * 3) < 0.5 ? '_SE_normal' : '_SW_normal');
    lots[`${b.x},${b.y}`] = { ...b, stem, isNew: b.frame === frameIdx };
    radius = Math.max(radius, ringDist(b.x, b.y));
  }
  radius = Math.min(Math.floor(GRID_SIZE / 2), radius + 1);

  // Ground + scenery for the visible footprint
  const tiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const ring = ringDist(x, y);
      if (ring > radius) continue;
      const seed = x * 131 + y * 7919;
      let ground = GROUND.grass;
      let prop = null;
      if (isRoad(x, y)) {
        ground = x % 4 === 0 && y % 4 === 0 ? GROUND.xing : x % 4 === 0 ? GROUND.road_y : GROUND.road_x;
      } else if (isDowntown(x, y)) {
        ground = GROUND.plaza;
        if (!TOWER_TILES.some(t => t.x === x && t.y === y)) {
          prop = PLAZA_PROPS[(x + y) % PLAZA_PROPS.length];
        }
      } else if (!lots[`${x},${y}`]) {
        // Unbuilt lot: park inside the city, sparse trees on the edge
        const p = ring >= radius ? 0.25 : 0.6;
        if (seededRand(seed) < p) prop = PARK_PROPS[Math.floor(seededRand(seed * 5) * PARK_PROPS.length)];
      }
      tiles.push({ x, y, ground, prop });
    }
  }

  return { players, cum, teamTotal, top3, lots, tiles, radius, frameIdx };
}
