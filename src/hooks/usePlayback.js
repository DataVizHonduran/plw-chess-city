import { useState, useEffect, useRef, useCallback } from 'react';

const STEP_MS = 110; // ms per day during replay — a full season in ~20s

// Real daily snapshots only. Opens on the latest day; replay plays from day 1.
export function usePlayback() {
  const [snapshots, setSnapshots] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}history.json?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setSnapshots(data);
          setCurrentIndex(data.length - 1);
        }
      })
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => {
        if (prev + 1 >= snapshots.length) { setIsPlaying(false); return prev; }
        return prev + 1;
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

  return { snapshots, currentIndex, isPlaying, error, scrubTo, replay };
}
