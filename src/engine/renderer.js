import { CANVAS_W, CANVAS_H, TILE_W, TILE_H, SPRITE_SCALE, CENTER, ROAD_EVERY } from '../constants.js';
import { toIso } from './isoMath.js';
import { drawParticles } from './particles.js';
import { seededRand, TOWER_TILES } from './gridLayout.js';
import { VEHICLES, vehicleCount, towerHeight, MEDALS } from './tierConfig.js';
import { drawTower, drawBanner } from './towers.js';

const POP_FRAMES = 24;

export function renderCity(ctx, city, images, anim, selectedId) {
  if (!city) return;

  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#141a33');
  sky.addColorStop(1, '#1f2a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 1. Ground (flat, any order)
  for (const t of city.tiles) {
    const { sx, sy } = toIso(t.x, t.y);
    const img = images.get(t.ground);
    if (img) ctx.drawImage(img, sx, sy, TILE_W, TILE_H);
  }

  // 2. Selected player's lots glow
  if (selectedId) {
    const pulse = 0.55 + 0.45 * Math.sin(anim.frame / 10);
    ctx.save();
    ctx.strokeStyle = `rgba(255,215,0,${pulse})`;
    ctx.fillStyle = `rgba(255,215,0,${0.25 * pulse})`;
    ctx.lineWidth = 2;
    for (const lot of Object.values(city.lots)) {
      if (lot.playerId !== selectedId) continue;
      const { sx, sy } = toIso(lot.x, lot.y);
      _diamond(ctx, sx, sy);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Objects in painter's order (back → front)
  const objs = [];
  for (const t of city.tiles) if (t.prop) objs.push({ d: t.x + t.y, kind: 'prop', x: t.x, y: t.y, stem: t.prop });
  for (const lot of Object.values(city.lots)) objs.push({ d: lot.x + lot.y, kind: 'bld', lot });
  city.leaders.forEach((p, rank) => {
    const { x, y } = TOWER_TILES[rank];
    objs.push({ d: x + y, kind: 'tower', x, y, rank, player: p });
  });
  objs.push(..._vehicles(city, anim.frame));
  objs.sort((a, b) => a.d - b.d);

  const roofs = [];
  for (const o of objs) {
    if (o.kind === 'tower') {
      const target = towerHeight(o.player.cumulative_plw, o.rank);
      const h = anim.towerH[o.rank] = (anim.towerH[o.rank] ?? 0) + (target - (anim.towerH[o.rank] ?? 0)) * 0.06;
      const { sx, sy } = toIso(o.x, o.y);
      const top = drawTower(ctx, sx, sy, h, MEDALS[o.rank], 7000 + o.rank * 1000, anim.frame, o.rank === 0);
      roofs.push({ cx: sx + TILE_W / 2, top, player: o.player, medal: MEDALS[o.rank] });
      continue;
    }
    const stem = o.kind === 'bld' ? o.lot.stem : o.stem;
    const img = images.get(stem);
    if (!img) continue;
    const { sx, sy } = o.kind === 'veh' ? toIso(o.fx, o.fy) : toIso(o.x ?? o.lot.x, o.y ?? o.lot.y);
    let s = SPRITE_SCALE;
    if (o.kind === 'bld') {
      const born = anim.pop.get(`${o.lot.x},${o.lot.y}`);
      if (born !== undefined) {
        const t = Math.min(1, (anim.frame - born) / POP_FRAMES);
        s *= t < 1 ? 0.3 + 0.7 * t + Math.sin(t * Math.PI) * 0.25 : 1;
      }
    }
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, sx + (TILE_W - dw) / 2, sy + TILE_H - dh + (o.kind === 'veh' ? -4 : 0), dw, dh);
  }

  drawParticles(ctx, anim.particles);

  // Bouncing pins over the selected player's buildings (ground glow is mostly hidden)
  if (selectedId) {
    const bob = Math.sin(anim.frame / 8) * 4;
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    for (const lot of Object.values(city.lots)) {
      if (lot.playerId !== selectedId) continue;
      const { sx, sy } = toIso(lot.x, lot.y);
      const cx = sx + TILE_W / 2, y = sy - 70 + bob;
      ctx.beginPath();
      ctx.moveTo(cx - 13, y);
      ctx.lineTo(cx + 13, y);
      ctx.lineTo(cx, y + 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Name banners always on top
  for (const r of roofs) drawBanner(ctx, r.cx, r.top, r.player, r.medal);
}

// Cars loop along roads inside the current footprint. Pure function of frame — no state.
function _vehicles(city, frame) {
  const n = vehicleCount(city.teamTotal);
  const lo = CENTER - city.radius, hi = CENTER + city.radius;
  const lines = [];
  for (let v = Math.ceil(lo / ROAD_EVERY) * ROAD_EVERY; v <= hi; v += ROAD_EVERY) lines.push(v);
  if (!lines.length) return [];
  const span = hi - lo;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = seededRand(i * 977 + 13);
    const alongX = i % 2 === 0;
    const line = lines[Math.floor(r * lines.length)];
    const speed = 0.012 + seededRand(i * 31) * 0.018;
    const pos = lo + ((r * span + frame * speed) % span);
    const stem = VEHICLES[i % VEHICLES.length] + (alongX ? '_SE_normal' : '_SW_normal');
    const fx = alongX ? pos : line;
    const fy = alongX ? line : pos;
    out.push({ d: fx + fy + 0.01, kind: 'veh', fx, fy, stem });
  }
  return out;
}

function _diamond(ctx, sx, sy) {
  ctx.beginPath();
  ctx.moveTo(sx + TILE_W / 2, sy);
  ctx.lineTo(sx + TILE_W, sy + TILE_H / 2);
  ctx.lineTo(sx + TILE_W / 2, sy + TILE_H);
  ctx.lineTo(sx, sy + TILE_H / 2);
  ctx.closePath();
}
