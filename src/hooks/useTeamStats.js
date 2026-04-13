import { useState, useEffect, useRef } from 'react';
import { POLL_INTERVAL } from '../constants.js';
import { detectMonthReset, archiveMonth } from '../engine/cityState.js';

export function useTeamStats() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevPlayersRef = useRef([]);

  async function fetchStats() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}team_stats.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newPlayers = data.players ?? [];

      // Month-reset detection
      if (detectMonthReset(prevPlayersRef.current, newPlayers)) {
        const month = new Date().toISOString().slice(0, 7);
        archiveMonth(month);
      }

      prevPlayersRef.current = newPlayers;
      setPlayers(newPlayers);
      setLoading(false);
      setError(null);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return { players, loading, error };
}
