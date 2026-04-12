import { useEffect, useRef } from 'react';
import { renderCity } from '../engine/renderer.js';
import { stepParticles } from '../engine/particles.js';

export function useAnimationLoop(canvasRef, imagesRef, cityStateRef, animRef) {
  const rafRef = useRef(null);

  useEffect(() => {
    function tick() {
      rafRef.current = requestAnimationFrame(tick);

      const canvas = canvasRef.current;
      const cityState = cityStateRef.current;
      if (!canvas || !cityState) return;

      const ctx = canvas.getContext('2d');
      const anim = animRef.current;

      // Advance skyscraper rise animations
      anim.pendingRises.forEach(pid => {
        anim.skyscraperProgress[pid] = Math.min(1, (anim.skyscraperProgress[pid] ?? 0) + 1 / 60);
        if (anim.skyscraperProgress[pid] >= 1) anim.pendingRises.delete(pid);
      });

      // Step particles
      stepParticles(anim.particles);

      anim.frame++;

      renderCity(ctx, cityState, imagesRef.current, anim);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
