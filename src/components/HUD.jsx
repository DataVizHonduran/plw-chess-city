import { fmtName, fmtDate } from '../engine/format.js';
import { MEDALS } from '../engine/tierConfig.js';

const ALWAYS_SHOW = new Set(['rafael boquin']);
const TOP_N = 10;

export default function HUD({ city, prevSnap, error, date, selected, onSelect }) {
  const panel = {
    position: 'absolute', top: 12, left: 12, width: 250,
    background: 'rgba(12,14,30,0.82)', border: '1px solid #2c3550', borderRadius: 8,
    padding: '10px 12px', color: '#e8e8e8', fontFamily: 'monospace', fontSize: 12,
    userSelect: 'none',
  };

  if (error) return <div style={panel}><span style={{ color: '#f66' }}>Error: {error}</span></div>;
  if (!city) return <div style={panel}><span style={{ color: '#888' }}>Loading city…</span></div>;

  const prev = Object.fromEntries((prevSnap?.players ?? []).map(p => [p.player_id, p.cumulative_plw]));
  const gain = p => prevSnap ? p.cumulative_plw - (prev[p.player_id] ?? 0) : 0;
  const ranked = [...city.players].sort((a, b) => b.cumulative_plw - a.cumulative_plw);
  const rows = ranked
    .map((p, i) => ({ ...p, rank: i + 1 }))
    .filter(p => p.rank <= TOP_N || ALWAYS_SHOW.has(p.player_id.toLowerCase()) || p.player_id === selected);
  const best = ranked.reduce((m, p) => (gain(p) > gain(m) ? p : m), ranked[0]);

  return (
    <div style={panel}>
      <div style={{ fontSize: 15, fontWeight: 'bold', color: '#FFD700', letterSpacing: 1 }}>
        PLW CHESS CITY <span style={{ fontSize: 11, color: '#88aaff', fontWeight: 'normal' }}>{fmtDate(date)}</span>
      </div>
      <div style={{ color: '#9aa3b8', fontSize: 11, margin: '4px 0 8px' }}>
        {city.players.length} players · {Math.round(city.teamTotal).toLocaleString()} pts ·{' '}
        {Object.keys(city.lots).length} buildings
      </div>

      {best && gain(best) > 0 && (
        <div style={{ marginBottom: 8, padding: '4px 6px', background: 'rgba(255,215,0,0.08)', borderRadius: 4 }}>
          <span style={{ color: '#9aa3b8' }}>Hot streak 🔥 </span>
          <b>{fmtName(best.player_id)}</b>
          <span style={{ color: '#7CFC9A' }}> +{Math.round(gain(best))}</span>
        </div>
      )}

      {rows.map(p => {
        const medal = MEDALS[p.rank - 1];
        const isSel = p.player_id === selected;
        const g = Math.round(gain(p));
        return (
          <div
            key={p.player_id}
            onClick={() => onSelect(p.player_id)}
            style={{
              display: 'flex', gap: 6, padding: '2px 4px', cursor: 'pointer', borderRadius: 3,
              background: isSel ? 'rgba(255,215,0,0.18)' : 'transparent',
              borderTop: p.rank > TOP_N ? '1px dashed #333' : 'none',
            }}
          >
            <span style={{ width: 24, color: medal?.accent ?? '#667' }}>{p.rank}.</span>
            <span style={{ flex: 1, color: medal ? medal.accent : '#e8e8e8' }}>{fmtName(p.player_id)}</span>
            <span>{Math.round(p.cumulative_plw).toLocaleString()}</span>
            <span style={{ width: 34, textAlign: 'right', color: g > 0 ? '#7CFC9A' : '#444', fontSize: 10 }}>
              {g > 0 ? `+${g}` : ''}
            </span>
          </div>
        );
      })}
      <div style={{ color: '#667', fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
        Every 250 pts = a new building. Top 3 own the skyscrapers, 4–6 the mid-rises. Click a name or building to find it.
      </div>
    </div>
  );
}
