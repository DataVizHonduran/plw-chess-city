import { TILE_W, TILE_H, CANVAS_OFFSET_X, CANVAS_OFFSET_Y } from '../constants.js';

export function toIso(x, y) {
  return {
    sx: CANVAS_OFFSET_X + (x - y) * (TILE_W / 2),
    sy: CANVAS_OFFSET_Y + (x + y) * (TILE_H / 2),
  };
}

export function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}
