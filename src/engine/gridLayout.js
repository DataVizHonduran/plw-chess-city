import { GRID_SIZE } from '../constants.js';
import {
  getRoadTier, GROUND, ROADS, SKYSCRAPER_STEM,
  BUILDING_MILESTONES, PROP_MILESTONES, VEHICLE_MILESTONES,
  unlockedPool, getDensity,
} from './tierConfig.js';

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function pick(arr, seed) {
  if (!arr.length) return null;
  return arr[Math.floor(seededRand(seed) * arr.length)];
}

export function assignZones(players) {
  const sorted = [...players].sort((a, b) => a.player_id.localeCompare(b.player_id));
  const n = sorted.length;
  const gridN = Math.max(30, n);   // grid never shrinks below 30 slots
  const cols = Math.ceil(Math.sqrt(gridN));
  const rows = Math.ceil(gridN / cols);
  const zoneW = Math.floor(GRID_SIZE / cols);
  const zoneH = Math.floor(GRID_SIZE / rows);

  const zones = {};
  sorted.forEach((p, i) => {
    zones[p.player_id] = {
      ox: (i % cols) * zoneW,
      oy: Math.floor(i / cols) * zoneH,
      w: zoneW,
      h: zoneH,
    };
  });
  return zones;
}

export function buildZoneTiles(playerId, cumPlw, zone) {
  const roadTier   = getRoadTier(cumPlw);
  const density     = getDensity(cumPlw);
  const buildingPool = unlockedPool(BUILDING_MILESTONES, cumPlw);
  const propPool     = unlockedPool(PROP_MILESTONES, cumPlw);
  const vehiclePool  = unlockedPool(VEHICLE_MILESTONES, cumPlw);
  const ground = GROUND[roadTier];
  const roads  = ROADS[roadTier];
  const baseHash = hashStr(playerId);

  // Central cross roads for this zone
  const midX = Math.floor(zone.w / 2);
  const midY = Math.floor(zone.h / 2);

  // Skyscraper: place at (midX-1, midY-1) — front-center of upper-left block, visible from iso front
  const skyX = Math.max(1, midX - 1);
  const skyY = Math.max(1, midY - 1);

  const tiles = [];

  for (let dy = 0; dy < zone.h; dy++) {
    for (let dx = 0; dx < zone.w; dx++) {
      const x = zone.ox + dx;
      const y = zone.oy + dy;
      const tileIdx = dy * zone.w + dx;
      const seed = baseHash + tileIdx * 97;

      const isPerimeter = dx === 0 || dx === zone.w - 1 || dy === 0 || dy === zone.h - 1;
      // Central cross roads divide zone into 4 blocks
      const isCrossRoad = dx === midX || dy === midY;
      const isRoadTile = isPerimeter || isCrossRoad;

      const isSkyscraperSlot = dx === skyX && dy === skyY;

      let groundStem = ground;
      let buildingStem = null;
      let propStem = null;
      let vehicleStem = null;
      let isRoad = false;
      let isSkyscraper = false;

      if (isSkyscraperSlot && cumPlw >= 500) {
        buildingStem = SKYSCRAPER_STEM;
        isSkyscraper = true;
      } else if (isRoadTile) {
        isRoad = true;
        groundStem = _roadStem(dx, dy, midX, midY, zone.w, zone.h, roads);
        // Vehicles drive on roads
        if (vehiclePool.length && seededRand(seed * 7) < density.vehicle * 4) {
          vehicleStem = pick(vehiclePool, seed * 17);
        }
      } else {
        // Inner block tile — buildings and props only
        const r = seededRand(seed);
        if (r < density.building && buildingPool.length) {
          buildingStem = pick(buildingPool, seed * 13);
        } else if (r < density.building + density.prop && propPool.length) {
          propStem = pick(propPool, seed * 19);
        }
      }

      tiles.push({ x, y, groundStem, buildingStem, propStem, vehicleStem, isRoad, isSkyscraper, playerId });
    }
  }
  return tiles;
}

function _roadStem(dx, dy, midX, midY, w, h, roads) {
  const isPerimX = dx === 0 || dx === w - 1;
  const isPerimY = dy === 0 || dy === h - 1;
  const isCrossX = dx === midX;
  const isCrossY = dy === midY;

  // Intersections
  if (isCrossX && isCrossY) return roads.xing || roads.straight_h;
  if (isPerimX && isPerimY) return roads.xing || roads.straight_h;
  if (isCrossX && (isPerimY)) return roads.intersect_ne || roads.straight_v;
  if (isCrossY && (isPerimX)) return roads.intersect_nw || roads.straight_h;

  // Straight runs
  if (isCrossX || isPerimX) return roads.straight_v;
  if (isCrossY || isPerimY) return roads.straight_h;

  return roads.straight_h;
}
