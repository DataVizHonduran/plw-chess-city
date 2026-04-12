import { useEffect, useRef, useState } from 'react';
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

  // Live data
  const { players: livePlayers, loading, error } = useTeamStats();
  const liveCityState = useCityState(livePlayers, animRef);

  // Playback
  const { snapshots, currentIndex, currentPlayers, currentDate, isPlaying, isAtLatest, scrubTo, replay } = usePlayback();

  // Compute city state for the current playback frame
  const prevPlaybackPlwRef = useRef({});
  useEffect(() => {
    if (!currentPlayers.length) return;

    // Trigger animations for PLW increases between playback frames
    const prevPlw = prevPlaybackPlwRef.current;
    currentPlayers.forEach(p => {
      const prev = prevPlw[p.player_id] ?? 0;
      const curr = p.cumulative_plw ?? 0;
      if (curr > prev && animRef.current) {
        // Skyscraper rise on crossing 1000
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

  // Sync city state ref: use playback state while playing, live state after
  useEffect(() => {
    if (!currentPlayers.length) return;
    const state = buildCityState(currentPlayers);
    // Attach skyscraper progress from anim state
    currentPlayers.forEach(p => {
      const cum = p.cumulative_plw ?? 0;
      if (cum >= 500 && animRef.current.skyscraperProgress[p.player_id] === undefined) {
        animRef.current.skyscraperProgress[p.player_id] = 1; // already unlocked
      }
    });
    cityStateRef.current = state;
  }, [currentPlayers]);

  // After playback ends, switch to live state
  useEffect(() => {
    if (isAtLatest && !isPlaying && liveCityState) {
      cityStateRef.current = liveCityState;
    }
  }, [isAtLatest, isPlaying, liveCityState]);

  useAnimationLoop(canvasRef, imagesRef, cityStateRef, animRef);

  // Displayed players: during playback show historical, after show live
  const displayPlayers = (!isAtLatest || isPlaying) ? currentPlayers : livePlayers;

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
          players={displayPlayers}
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
