import { useEffect, useRef, useState, useMemo } from 'react';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { MANIFEST } from '../assets/assetManifest.js';
import { useTeamStats } from '../hooks/useTeamStats.js';
import { useCityState } from '../hooks/useCityState.js';
import { useAnimationLoop } from '../hooks/useAnimationLoop.js';
import { usePlayback } from '../hooks/usePlayback.js';
import { buildCityState } from '../engine/cityState.js';
import HUD from './HUD.jsx';
import Timeline from './Timeline.jsx';

export default function CityCanvas() {
  const canvasRef = useRef(null);
  const imagesRef = useRef(new Map());
  const cityStateRef = useRef(null);
  const animRef = useRef({
    skyscraperProgress: {},
    pendingRises: new Set(),
    particles: [],
    frame: 0,
  });

  const [assetsReady, setAssetsReady] = useState(false);

  // Preload all assets
  useEffect(() => {
    const entries = Object.entries(MANIFEST);
    let loaded = 0;
    const total = entries.length;
    entries.forEach(([stem, path]) => {
      const img = new Image();
      img.onload = () => {
        imagesRef.current.set(stem, img);
        loaded++;
        if (loaded === total) setAssetsReady(true);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === total) setAssetsReady(true);
      };
      img.src = path;
    });
  }, []);

  // Live data — all players for stable grid, filter only for HUD display
  const { players: livePlayers, loading, error } = useTeamStats();
  const liveCityState = useCityState(livePlayers, animRef);

  // Stable zone order: computed once from final (live) state.
  // PLW=0 players at top of grid, active players at bottom — FIXED for entire session.
  const stableOrder = useMemo(() => {
    if (!livePlayers.length) return [];
    return [...livePlayers]
      .sort((a, b) => {
        const aActive = (a.cumulative_plw ?? 0) > 0 ? 1 : 0;
        const bActive = (b.cumulative_plw ?? 0) > 0 ? 1 : 0;
        if (aActive !== bActive) return aActive - bActive;
        return a.player_id.localeCompare(b.player_id);
      })
      .map(p => p.player_id);
  }, [livePlayers.length]); // only recompute if roster size changes

  // Playback
  const { snapshots, currentIndex, currentPlayers, currentDate, isPlaying, isAtLatest, scrubTo, replay } = usePlayback();

  // City state uses ALL players for stable grid layout.
  // buildZoneTiles skips tiles for PLW=0 players (dark canvas = empty zone).
  const prevPlaybackPlwRef = useRef({});
  useEffect(() => {
    if (!currentPlayers.length) return;
    const prevPlw = prevPlaybackPlwRef.current;
    currentPlayers.forEach(p => {
      const prev = prevPlw[p.player_id] ?? 0;
      const curr = p.cumulative_plw ?? 0;
      if (curr > prev && animRef.current) {
        if (curr >= 500 && prev < 500) {
          animRef.current.pendingRises.add(p.player_id);
          animRef.current.skyscraperProgress[p.player_id] = 0;
        }
      }
    });
    prevPlaybackPlwRef.current = Object.fromEntries(
      currentPlayers.map(p => [p.player_id, p.cumulative_plw ?? 0])
    );
  }, [currentPlayers]);

  useEffect(() => {
    if (!currentPlayers.length) return;
    // Apply stable order so zones never jump during playback
    const ordered = stableOrder.length
      ? stableOrder.map(id => currentPlayers.find(p => p.player_id === id)).filter(Boolean)
      : currentPlayers;
    const state = buildCityState(ordered);
    ordered.forEach(p => {
      const cum = p.cumulative_plw ?? 0;
      if (cum >= 500 && animRef.current.skyscraperProgress[p.player_id] === undefined) {
        animRef.current.skyscraperProgress[p.player_id] = 1;
      }
    });
    cityStateRef.current = state;
  }, [currentPlayers, stableOrder]);

  const activePlayers = currentPlayers.filter(p => (p.cumulative_plw ?? 0) > 0);

  // After playback ends, switch to live state
  useEffect(() => {
    if (isAtLatest && !isPlaying && liveCityState) {
      cityStateRef.current = liveCityState;
    }
  }, [isAtLatest, isPlaying, liveCityState]);

  useAnimationLoop(canvasRef, imagesRef, cityStateRef, animRef);

  // HUD shows PLW > 0 only; city uses full roster for stable grid
  const hudPlayers = (!isAtLatest || isPlaying) ? activePlayers : livePlayers.filter(p => (p.cumulative_plw ?? 0) > 0);

  return (
    <div style={{ background: '#1a1a2e', width: CANVAS_W, margin: '0 auto' }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block' }}
        />
        <HUD
          players={hudPlayers}
          loading={loading && !currentPlayers.length}
          error={error}
          assetsReady={assetsReady}
          currentDate={currentDate}
          isPlayback={isPlaying || !isAtLatest}
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
