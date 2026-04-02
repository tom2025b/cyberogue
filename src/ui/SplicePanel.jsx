// src/ui/SplicePanel.jsx
import { COLORS, SPLICE } from '../game/constants.js';

const SPLICE_COLOR = {
  [SPLICE.EMP]:       COLORS.AMBER,
  [SPLICE.SPEED]:     COLORS.CYAN,
  [SPLICE.TENTACLES]: COLORS.GREEN,
};

export default function SplicePanel({ splices }) {
  return (
    <div style={{
      position: 'absolute', bottom: 10, left: 14,
      display: 'flex', gap: 8,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 11, pointerEvents: 'none', userSelect: 'none',
    }}>
      {[0, 1, 2].map(i => {
        const s = splices[i];
        const color = s ? SPLICE_COLOR[s.type] : '#2a2a3a';
        return (
          <div key={i} style={{
            width: 96, height: 34,
            border: `1px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, background: 'rgba(5,5,16,0.92)',
            textShadow: s ? `0 0 8px ${color}` : 'none',
            letterSpacing: 1,
          }}>
            {s ? `[${i+1}] ${s.type}` : `[${i+1}] —`}
          </div>
        );
      })}
    </div>
  );
}
