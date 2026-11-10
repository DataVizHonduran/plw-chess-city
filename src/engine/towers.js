import { TILE_W, TILE_H } from '../constants.js';
import { seededRand } from './gridLayout.js';
import { fmtName } from './format.js';

// Procedural iso skyscraper on one tile. (sx, sy) = tile bounding-box top-left.
// Returns the roof-top screen y so the caller can place the name banner.
export function drawTower(ctx, sx, sy, h, medal, seed, frame, spire) {
  const cx = sx + TILE_W / 2;
  const cy = sy + TILE_H / 2;
  const base = h * 0.62;

  // Podium + lower section (full footprint), then a set-back upper section
  _prism(ctx, cx, cy, 0.86, 0, 10, '#4a5468', null);
  _prism(ctx, cx, cy, 0.76, 10, base, medal.body, medal.accent, seed, frame);
  _prism(ctx, cx, cy, 0.56, base, h, medal.body, medal.accent, seed + 500, frame);

  let top = cy - h;
  if (spire) {
    const sh = 26 + h * 0.08;
    ctx.strokeStyle = medal.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, top - sh);
    ctx.stroke();
    // Blinking beacon
    if (Math.floor(frame / 40) % 2 === 0) {
      ctx.fillStyle = '#ff4d4d';
      ctx.beginPath();
      ctx.arc(cx, top - sh, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    top -= sh;
  }
  return top;
}

export function drawBanner(ctx, cx, topY, player, medal) {
  const name = `${medal.label} ${fmtName(player.player_id)}`;
  const pts = `${Math.round(player.cumulative_plw).toLocaleString()} pts`;
  ctx.save();
  ctx.font = 'bold 15px monospace';
  const w = Math.max(ctx.measureText(name).width, 80) + 20;
  const bh = 38;
  const x = cx - w / 2;
  const y = topY - bh - 10;

  ctx.fillStyle = 'rgba(12,14,30,0.88)';
  ctx.strokeStyle = medal.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, bh, 6);
  ctx.fill();
  ctx.stroke();
  // Pointer to the roof
  ctx.beginPath();
  ctx.moveTo(cx - 5, y + bh);
  ctx.lineTo(cx, y + bh + 8);
  ctx.lineTo(cx + 5, y + bh);
  ctx.fillStyle = medal.accent;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = medal.accent;
  ctx.fillText(name, cx, y + 17);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#cfd6e6';
  ctx.fillText(pts, cx, y + 31);
  ctx.restore();
}

// Iso box from height z0 to z1 (px) on a footprint scaled by f.
function _prism(ctx, cx, cy, f, z0, z1, body, accent, seed, frame) {
  const hw = (TILE_W / 2) * f;
  const hh = (TILE_H / 2) * f;
  const L = { x: cx - hw, y: cy }, B = { x: cx, y: cy + hh }, R = { x: cx + hw, y: cy };
  const T = { x: cx, y: cy - hh };
  const up = (p, z) => ({ x: p.x, y: p.y - z });

  _quad(ctx, [up(L, z0), up(B, z0), up(B, z1), up(L, z1)], _shade(body, 0.85));   // left face
  _quad(ctx, [up(B, z0), up(R, z0), up(R, z1), up(B, z1)], _shade(body, 0.6));    // right face
  _quad(ctx, [up(T, z1), up(R, z1), up(B, z1), up(L, z1)], accent ? _shade(accent, 0.55) : _shade(body, 1.2));

  if (seed === undefined) return;

  // Windows: rows of lit / dark panes on both faces
  const cols = 3;
  for (let z = z0 + 8; z < z1 - 8; z += 9) {
    const row = Math.floor(z / 9);
    for (const [P, Q, face] of [[L, B, 0], [B, R, 1]]) {
      for (let c = 0; c < cols; c++) {
        const r = seededRand(seed + row * 13 + c * 7 + face * 101);
        // A few windows toggle slowly so the skyline feels alive
        const twinkle = r > 0.93 && Math.floor(frame / 120 + r * 10) % 2 === 0;
        const lit = (r < 0.55) !== twinkle;
        const u0 = (c + 0.2) / cols, u1 = (c + 0.8) / cols;
        const a = _lerp(P, Q, u0), b = _lerp(P, Q, u1);
        _quad(ctx, [up(a, z), up(b, z), up(b, z + 4), up(a, z + 4)], lit ? '#ffe9a3' : 'rgba(10,16,28,0.7)');
      }
    }
  }
  // Accent band at the top of the section
  _quad(ctx, [up(L, z1 - 3), up(B, z1 - 3), up(B, z1), up(L, z1)], accent);
  _quad(ctx, [up(B, z1 - 3), up(R, z1 - 3), up(R, z1), up(B, z1)], _shade(accent, 0.75));
}

function _quad(ctx, pts, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
}

function _lerp(p, q, t) {
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}

function _shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
