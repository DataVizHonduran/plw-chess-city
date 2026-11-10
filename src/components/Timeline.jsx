import { fmtDate as fmt } from '../engine/format.js';

export default function Timeline({ snapshots, currentIndex, isPlaying, onScrub, onReplay }) {
  if (!snapshots.length) return null;

  const first = snapshots[0]?.date;
  const last  = snapshots[snapshots.length - 1]?.date;
  const current = snapshots[currentIndex]?.date;



  const barStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 20px',
    background: 'rgba(10,10,30,0.85)',
    borderTop: '1px solid #333',
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#aaa',
    userSelect: 'none',
  };

  const trackStyle = {
    flex: 1,
    position: 'relative',
    height: 24,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  };

  const railStyle = {
    position: 'absolute',
    left: 0, right: 0,
    height: 3,
    background: '#333',
    borderRadius: 2,
  };

  const fillPct = snapshots.length > 1
    ? (currentIndex / (snapshots.length - 1)) * 100
    : 100;

  const fillStyle = {
    position: 'absolute',
    left: 0,
    width: `${fillPct}%`,
    height: 3,
    background: '#FFD700',
    borderRadius: 2,
  };

  function handleTrackClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(pct * (snapshots.length - 1));
    onScrub(idx);
  }

  return (
    <div style={barStyle}>
      {/* Replay button */}
      <button
        onClick={onReplay}
        title="Watch the city grow from day 1"
        style={{
          background: 'none', border: '1px solid #555', color: '#aaa',
          padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 12,
        }}
      >
        ▶ Watch it grow
      </button>

      {/* Date range labels */}
      <span style={{ minWidth: 40, color: '#666' }}>{fmt(first)}</span>

      {/* Scrub track */}
      <div style={trackStyle} onClick={handleTrackClick}>
        <div style={railStyle} />
        <div style={fillStyle} />

      </div>

      <span style={{ minWidth: 40, color: '#666', textAlign: 'right' }}>{fmt(last)}</span>

      {/* Day counter */}
      <div style={{
        minWidth: 90,
        textAlign: 'right',
        color: isPlaying ? '#FFD700' : '#fff',
        fontWeight: 'bold',
        fontSize: 13,
      }}>
        {isPlaying && <span style={{ marginRight: 4 }}>▶</span>}
        {fmt(current)}{snapshots[currentIndex]?.estimated && <span style={{ color: '#888', fontWeight: 'normal' }}> est.</span>}
        <div style={{ fontWeight: 'normal', fontSize: 10, color: '#666', marginTop: 1 }}>
          Day {currentIndex + 1} / {snapshots.length}
        </div>
      </div>
    </div>
  );
}
