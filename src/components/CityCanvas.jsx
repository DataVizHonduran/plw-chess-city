import { useEffect, useRef, useState, useMemo } from 'react';
import { CANVAS_W, CANVAS_H, TILE_W, TILE_H, CANVAS_OFFSET_X, CANVAS_OFFSET_Y } from '../constants.js';
import { MANIFEST } from '../assets/assetManifest.js';
import { useAnimationLoop } from '../hooks/useAnimationLoop.js';
import { usePlayback } from '../hooks/usePlayback.js';
import { buildFrame } from '../engine/cityState.js';
import { buildPlacements, firstSeenOrder, TOWER_TILES } from '../engine/gridLayout.js';
import { spawnDust } from '../engine/particles.js';
import { fmtName } from '../engine/format.js';
import HUD from './HUD.jsx';
import Timeline from './Timeline.jsx';

export default function CityCanvas() {
  const canvasRef = useRef(null);
  const imagesRef = useRef(new Map());
  const cityRef = useRef(null);
  const selectedRef = useRef(null);
  const animRef = useRef({ particles: [], pop: new Map(), towerH: {}, frame: 0 });
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    Object.entries(MANIFEST).forEach(([stem, path]) => {
      const img = new Image();
      img.onload = () => imagesRef.current.set(stem, img);
      img.src = path;
    });
  }, []);

  const { snapshots, currentIndex, isPlaying, error, scrubTo, replay } = usePlayback();

  // Layout is computed once from the full history so lots never move
  const placements = useMemo(
    () => buildPlacements(snapshots, firstSeenOrder(snapshots)),
    [snapshots],
  );
  const city = useMemo(
    () => snapshots.length ? buildFrame(snapshots[currentIndex], currentIndex, placements) : null,
    [snapshots, currentIndex, placements],
  );

  // New buildings pop in with dust; a new face on a leader tower gets a burst
  const prevTop3Ref = useRef([]);
  useEffect(() => {
    if (!city) return;
    const anim = animRef.current;
    cityRef.current = city;
    for (const lot of Object.values(city.lots)) {
      if (!lot.isNew) continue;
      anim.pop.set(`${lot.x},${lot.y}`, anim.frame);
      spawnDust(anim.particles, lot.x, lot.y);
    }
    city.leaders.forEach((p, rank) => {
      if (prevTop3Ref.current[rank] && prevTop3Ref.current[rank] !== p.player_id) {
        const t = TOWER_TILES[rank];
        for (let i = 0; i < 3; i++) spawnDust(anim.particles, t.x, t.y);
      }
    });
    prevTop3Ref.current = city.leaders.map(p => p.player_id);
  }, [city]);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useAnimationLoop(canvasRef, imagesRef, cityRef, animRef, selectedRef);

  // Screen → tile, for the "whose building is this?" tooltip
  function handleMove(e) {
    if (!city) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const a = (mx - CANVAS_OFFSET_X - TILE_W / 2) / (TILE_W / 2);
    const b = (my - CANVAS_OFFSET_Y) / (TILE_H / 2);
    const x = Math.floor((a + b) / 2), y = Math.floor((b - a) / 2);
    const lot = city.lots[`${x},${y}`];
    setHover(lot ? { id: lot.playerId, left: e.clientX - rect.left, top: e.clientY - rect.top } : null);
  }

  const prevSnap = snapshots[currentIndex - 1];

  return (
    <div style={{ maxWidth: CANVAS_W, margin: '0 auto' }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          onClick={() => hover && setSelected(s => s === hover.id ? null : hover.id)}
          style={{ display: 'block', width: '100%', height: 'auto', cursor: hover ? 'pointer' : 'default' }}
        />
        {hover && city && (
          <div style={{
            position: 'absolute', left: hover.left + 14, top: hover.top - 10, pointerEvents: 'none',
            background: 'rgba(12,14,30,0.92)', border: '1px solid #FFD700', borderRadius: 4,
            padding: '3px 8px', color: '#fff', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap',
          }}>
            {fmtName(hover.id)} · {Math.round(city.cum[hover.id] ?? 0).toLocaleString()} pts
          </div>
        )}
        <HUD
          city={city}
          prevSnap={prevSnap}
          error={error}
          date={snapshots[currentIndex]?.date}
          selected={selected}
          onSelect={id => setSelected(s => s === id ? null : id)}
        />
      </div>
      <Timeline
        snapshots={snapshots}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        onScrub={scrubTo}
        onReplay={replay}
      />
    </div>
  );
}
