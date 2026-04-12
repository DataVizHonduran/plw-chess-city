import { getTier, getTeamLandmark } from '../engine/tierConfig.js';

const TIER_LABEL = { 1: 'Outskirts', 2: 'Village', 3: 'Town', 4: 'City' };
const TIER_COLOR = { 1: '#a07850', 2: '#60a060', 3: '#4080c0', 4: '#c060c0' };

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1];
  return `${month} ${+d}`;
}

export default function HUD({ players, loading, error, assetsReady, currentDate, isPlayback }) {
  const hudStyle = {
    position: 'absolute',
    top: 12,
    left: 16,
    color: '#e8e8e8',
    fontFamily: 'monospace',
    fontSize: 13,
    pointerEvents: 'none',
    userSelect: 'none',
  };

  if (loading) return <div style={hudStyle}><span style={{ color: '#888' }}>Loading…</span></div>;
  if (error)   return <div style={hudStyle}><span style={{ color: '#f44' }}>Error: {error}</span></div>;

  const totalCum = players.reduce((s, p) => s + (p.cumulative_plw ?? 0), 0);
  const milestone = getTeamLandmark(totalCum);

  return (
    <>
    <div style={hudStyle}>
      <div style={{ marginBottom: 2, fontSize: 15, fontWeight: 'bold', color: '#FFD700', letterSpacing: 1 }}>
        PLW CHESS CITY
        {isPlayback && currentDate && (
          <span style={{ marginLeft: 10, fontSize: 12, color: '#88aaff', fontWeight: 'normal' }}>
            ▶ {fmtDate(currentDate)}
          </span>
        )}
      </div>
      <div style={{ marginBottom: 6, color: '#666', fontSize: 10, fontStyle: 'italic' }}>
        City grows as players accumulate PLWs. More points means more unlocks.
      </div>
      <div style={{ marginBottom: 6, color: '#aaa', fontSize: 11 }}>
        Team Total: <span style={{ color: '#fff' }}>{totalCum.toLocaleString()}</span> PLW
        {!assetsReady && <span style={{ color: '#666', marginLeft: 6 }}>(loading assets…)</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[...players]
          .sort((a, b) => (b.cumulative_plw ?? 0) - (a.cumulative_plw ?? 0))
          .map(p => {
            const cum = p.cumulative_plw ?? 0;
            const tier = getTier(cum);
            const color = TIER_COLOR[tier];
            const is1k = cum >= 1000;
            return (
              <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color, minWidth: 14 }}>{is1k ? '★' : '·'}</span>
                <span style={{ minWidth: 110 }}>{p.player_id}</span>
                <span style={{ minWidth: 70 }}>
                  {cum.toLocaleString()}
                  <span style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>
                    +{(p.mtd_plw ?? 0).toLocaleString()}
                  </span>
                </span>
                <span style={{ color, fontSize: 11 }}>T{tier} {TIER_LABEL[tier]}</span>
              </div>
            );
          })}
      </div>
    </div>
    {milestone && (
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        color: '#FFD700',
        fontFamily: 'monospace',
        fontSize: 13,
        fontWeight: 'bold',
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 0 8px #FFD700',
      }}>
        Team Milestone: {totalCum.toLocaleString()} PLW — {milestone.label}
      </div>
    )}
    </>
  );
}
