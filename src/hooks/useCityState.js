import { useState, useEffect, useRef } from 'react';
import {
  buildCityState,
  diffPlayers,
  saveToStorage,
  loadFromStorage,
} from '../engine/cityState.js';
import { spawnDust } from '../engine/particles.js';

export function useCityState(players, animRef) {
  const [cityState, setCityState] = useState(() => loadFromStorage());

  useEffect(() => {
    if (!players.length) return;

    setCityState(prev => {
      const prevPlw = prev?.plw ?? {};
      const next = buildCityState(players);

      // Detect PLW changes → trigger particles + skyscraper rises
      const changes = diffPlayers(prevPlw, players);
      changes.forEach(({ player_id, prev: prevVal, curr }) => {
        if (!animRef.current) return;

        // Spawn dust at zone anchor (first tile of zone)
        const tiles = next.allTiles[player_id];
        if (tiles?.length) {
          const anchor = tiles[0];
          spawnDust(animRef.current.particles, anchor.x, anchor.y);
        }

        // Skyscraper rise: crossing 1000 threshold
        if (curr >= 1000 && prevVal < 1000) {
          animRef.current.pendingRises.add(player_id);
          animRef.current.skyscraperProgress[player_id] = 0;
        }
      });

      // Initialise skyscraper progress for players already ≥ 1000 on first load
      if (!prev) {
        players.forEach(p => {
          const cum = p.cumulative_plw ?? p.mtd_plw ?? 0;
          if (cum >= 1000 && animRef.current) {
            animRef.current.skyscraperProgress[p.player_id] = 1;
          }
        });
      }

      saveToStorage(next);
      return next;
    });
  }, [players]);

  return cityState;
}
