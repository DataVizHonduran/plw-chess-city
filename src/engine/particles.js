import { PARTICLE_LIFETIME } from '../constants.js';
import { toIso } from './isoMath.js';
import { TILE_W, TILE_H } from '../constants.js';

export function spawnDust(particles, x, y) {
  const { sx, sy } = toIso(x, y);
  const cx = sx + TILE_W / 2;
  const cy = sy + TILE_H / 2;

  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
    const speed = 1.5 + Math.random() * 2;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
      color: `hsl(${30 + Math.random() * 20}, 80%, 60%)`,
    });
  }
}

export function stepParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // gravity
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function drawParticles(ctx, particles) {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
