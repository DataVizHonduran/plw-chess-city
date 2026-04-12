import { CANVAS_W, CANVAS_H, TILE_W, TILE_H, GRID_SIZE } from '../constants.js';
import { toIso, lerp } from './isoMath.js';
import { drawParticles } from './particles.js';
import { SKYSCRAPER_STEM, getTeamLandmark } from './tierConfig.js';

export function renderCity(ctx, cityState, images, animState) {
  if (!cityState) return;

  // Clear
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Collect all tiles from all player zones
  const allTiles = [];
  Object.values(cityState.allTiles || {}).forEach(tiles => {
    allTiles.push(...tiles);
  });

  // Sort painter's order: low x+y first (back to front in iso)
  allTiles.sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x);

  for (const tile of allTiles) {
    const { sx, sy } = toIso(tile.x, tile.y);

    // Ground / road layer
    _drawStem(ctx, images, tile.groundStem, sx, sy, TILE_W, TILE_H);

    // Prop
    if (tile.propStem) {
      const img = images.get(tile.propStem);
      if (img) {
        const { dw, dh } = _scale(img, TILE_W * 1.2);
        ctx.drawImage(img, sx + (TILE_W - dw) / 2, sy + TILE_H - dh, dw, dh);
      }
    }

    // Building
    if (tile.buildingStem) {
      const img = images.get(tile.buildingStem);
      if (img) {
        const { dw, dh } = _scale(img, TILE_W * 1.8);
        let yOff = 0;
        if (tile.isSkyscraper) {
          const prog = animState.skyscraperProgress[tile.playerId] ?? 1;
          yOff = lerp(-60, 0, prog);
        }
        ctx.drawImage(img, sx + (TILE_W - dw) / 2, sy + TILE_H - dh + yOff, dw, dh);
      }
    }

    // Vehicle
    if (tile.vehicleStem) {
      const img = images.get(tile.vehicleStem);
      if (img) {
        const { dw, dh } = _scale(img, TILE_W * 1.0);
        ctx.drawImage(img, sx + (TILE_W - dw) / 2, sy + TILE_H - dh, dw, dh);
      }
    }
  }

  // Team landmark at grid center
  const totalTeamPlw = (cityState.players || []).reduce((s, p) => s + (p.cumulative_plw ?? 0), 0);
  const landmark = getTeamLandmark(totalTeamPlw);
  if (landmark) {
    const cx = Math.floor(GRID_SIZE / 2);
    const cy = Math.floor(GRID_SIZE / 2);
    const { sx, sy } = toIso(cx, cy);
    const img = images.get(landmark.stem);
    if (img) {
      const { dw, dh } = _scale(img, TILE_W * 1.8);
      ctx.drawImage(img, sx + (TILE_W - dw) / 2, sy + TILE_H - dh, dw, dh);
    }
    // Label
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(landmark.label, sx + TILE_W / 2, sy - 4);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Particles on top of everything
  drawParticles(ctx, animState.particles);

  // 1K Club floating labels
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  for (const tile of allTiles) {
    if (!tile.isSkyscraper) continue;
    const img = images.get(SKYSCRAPER_STEM);
    const bldH = img ? _scale(img, TILE_W * 1.8).dh : 40;
    const { sx, sy } = toIso(tile.x, tile.y);
    const prog = animState.skyscraperProgress[tile.playerId] ?? 1;
    const yOff = lerp(-120, 0, prog);

    // Gold glow
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(tile.playerId, sx + TILE_W / 2, sy + TILE_H - bldH + yOff - 10);
    ctx.shadowBlur = 0;
  }
  ctx.textAlign = 'left';
}

// Scale image to fit within maxW, preserving aspect ratio
function _scale(img, maxW) {
  const scale = Math.min(1, maxW / img.naturalWidth);
  return { dw: img.naturalWidth * scale, dh: img.naturalHeight * scale };
}

function _drawStem(ctx, images, stem, sx, sy, w, h) {
  if (!stem) return;
  const img = images.get(stem);
  if (img) {
    ctx.drawImage(img, sx, sy, w, h);
  } else {
    // Fallback: colored diamond
    ctx.fillStyle = '#2a3a2a';
    ctx.beginPath();
    ctx.moveTo(sx + w / 2, sy);
    ctx.lineTo(sx + w, sy + h / 2);
    ctx.lineTo(sx + w / 2, sy + h);
    ctx.lineTo(sx, sy + h / 2);
    ctx.closePath();
    ctx.fill();
  }
}
