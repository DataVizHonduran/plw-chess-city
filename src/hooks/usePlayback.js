import { useState, useEffect, useRef, useCallback } from 'react';

const STEP_MS = 3000; // ms per day frame during auto-play

// Deterministic seeded random [0,1) from a string key
function seededRand(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  const x = Math.sin(Math.abs(h) + 1) * 10000;
  return x - Math.floor(x);
}

// Expand raw snapshots to cover every calendar day between first and last date.
// Missing days get values from the prior day + a small seeded random increment.
function fillDays(raw) {
  if (!raw.length) return raw;

  const filled = [raw[0]];

  for (let i = 1; i < raw.length; i++) {
    const prevSnap = raw[i - 1];
    const nextSnap = raw[i];

    const prevDate = new Date(prevSnap.date + 'T00:00:00Z');
    const nextDate = new Date(nextSnap.date + 'T00:00:00Z');
    const gap = Math.round((nextDate - prevDate) / 86400000); // calendar days between

    for (let d = 1; d < gap; d++) {
      const fillDate = new Date(prevDate);
      fillDate.setUTCDate(fillDate.getUTCDate() + d);
      const dateStr = fillDate.toISOString().slice(0, 10);

      // Build from the last filled day (so increments are cumulative)
      const base = filled[filled.length - 1];

      const players = base.players.map(p => {
        // Expected total gain for this player across the gap
        const nextP = nextSnap.players.find(np => np.player_id === p.player_id);
        const prevP = prevSnap.players.find(pp => pp.player_id === p.player_id);
        const totalGain = nextP && prevP
          ? Math.max(0, nextP.mtd_plw - prevP.mtd_plw)
          : 0;

        const avgDaily = totalGain / gap;
        // Noise: 20%–180% of average daily gain, seeded so replay is identical
        const r = seededRand(dateStr + p.player_id);
        const gain = Math.round(avgDaily * (0.2 + r * 1.6));

        return {
          player_id:      p.player_id,
          mtd_plw:        p.mtd_plw + gain,
          cumulative_plw: p.cumulative_plw + gain,
          interpolated:   true,
        };
      });

      filled.push({ date: dateStr, players, interpolated: true });
    }

    filled.push(nextSnap);
  }

  return filled;
}

export function usePlayback() {
  const [snapshots, setSnapshots] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}history.json?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSnapshots(fillDays(data));
          setCurrentIndex(0);
          setIsPlaying(true);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || !snapshots.length) return;
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= snapshots.length) { setIsPlaying(false); return prev; }
        return next;
      });
    }, STEP_MS);
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, snapshots.length]);

  const scrubTo = useCallback((index) => {
    clearTimeout(timerRef.current);
    setIsPlaying(false);
    setCurrentIndex(Math.max(0, Math.min(index, snapshots.length - 1)));
  }, [snapshots.length]);

  const replay = useCallback(() => {
    clearTimeout(timerRef.current);
    setCurrentIndex(0);
    setIsPlaying(true);
  }, []);

  const currentPlayers = snapshots[currentIndex]?.players ?? [];
  const currentDate    = snapshots[currentIndex]?.date ?? null;
  const isAtLatest     = currentIndex === snapshots.length - 1;

  return { snapshots, currentIndex, currentPlayers, currentDate, isPlaying, isAtLatest, loaded, scrubTo, replay };
}
