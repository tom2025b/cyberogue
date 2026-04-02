// src/ui/EventLog.jsx
import { COLORS } from '../game/constants.js';

export default function EventLog({ lines }) {
  return (
    <div style={{
      position: 'absolute', bottom: 54, right: 12,
      width: 255, maxHeight: 130, overflow: 'hidden',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 11, color: COLORS.CYAN,
      display: 'flex', flexDirection: 'column-reverse',
      pointerEvents: 'none', userSelect: 'none',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: Math.max(0.1, 1 - i * 0.08), padding: '1px 0' }}>
          {'> '}{line}
        </div>
      ))}
    </div>
  );
}
