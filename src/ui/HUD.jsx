// src/ui/HUD.jsx
import { COLORS } from '../game/constants.js';

export default function HUD({ player, floor, infectedTiles, mapTileCount }) {
  const hp = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
  const infPct = mapTileCount > 0
    ? Math.min(100, Math.round((infectedTiles.size / mapTileCount) * 100))
    : 0;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      display: 'flex', gap: 20, padding: '6px 14px',
      background: 'rgba(5,5,16,0.88)',
      borderBottom: `1px solid ${COLORS.CYAN}20`,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 12, color: COLORS.CYAN,
      pointerEvents: 'none', userSelect: 'none',
    }}>
      <span>FL:{floor}</span>
      <span>HP:
        <Bar pct={hp} color={COLORS.GREEN} />
        {hp}%
      </span>
      <span>INF:
        <Bar pct={infPct} color={COLORS.CYAN} />
        {infPct}%
      </span>
      {player.inverted && (
        <span style={{ color: '#ff4444', fontWeight: 'bold' }}>[CTRL INVERTED]</span>
      )}
      {player.speedBoostTurns > 0 && (
        <span style={{ color: COLORS.AMBER }}>[SPD×2: {player.speedBoostTurns}t]</span>
      )}
    </div>
  );
}

function Bar({ pct, color }) {
  return (
    <span style={{
      display: 'inline-block', width: 72, height: 7,
      background: '#0a0a1a', verticalAlign: 'middle',
      margin: '0 5px', position: 'relative', overflow: 'hidden',
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`, background: color,
        transition: 'width 0.2s',
      }} />
    </span>
  );
}
