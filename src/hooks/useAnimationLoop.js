import { useEffect, useRef } from 'react';
import { renderCity } from '../engine/renderer.js';
import { stepParticles } from '../engine/particles.js';

export function useAnimationLoop(canvasRef, imagesRef, cityRef, animRef, selectedRef) {
  const rafRef = useRef(null);

  useEffect(() => {
    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const canvas = canvasRef.current;
      if (!canvas || !cityRef.current) return;
      const anim = animRef.current;
      stepParticles(anim.particles);
      anim.frame++;
      renderCity(canvas.getContext('2d'), cityRef.current, imagesRef.current, anim, selectedRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
}
