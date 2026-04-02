// src/render/drawBoss.js
import { CANVAS_W, CANVAS_H, COLORS } from '../game/constants.js';

export function drawBoss(ctx, boss, ts) {
  if (!boss) return;
  const nodes = Object.values(boss.nodes);

  // Edges
  nodes.forEach(node => {
    if (node.parentId == null) return;
    const parent = boss.nodes[node.parentId];
    if (!parent) return;
    ctx.beginPath();
    ctx.moveTo(parent.x * CANVAS_W, parent.y * CANVAS_H);
    ctx.lineTo(node.x * CANVAS_W, node.y * CANVAS_H);
    ctx.strokeStyle = node.alive ? 'rgba(255,0,170,0.28)' : 'rgba(255,0,170,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Nodes
  nodes.forEach(node => {
    const x = node.x * CANVAS_W;
    const y = node.y * CANVAS_H;
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.003 + node.id);
    const r = node.vulnerable ? 9 : 5;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);

    if (!node.alive) {
      ctx.fillStyle = '#0a0a1a';
      ctx.fill();
      return;
    }

    ctx.fillStyle = node.vulnerable
      ? `rgba(255,170,0,${0.7 + 0.3 * pulse})`
      : `rgba(255,0,170,${0.4 + 0.3 * pulse})`;
    ctx.fill();
    ctx.strokeStyle = node.vulnerable ? COLORS.AMBER : COLORS.MAGENTA;
    ctx.lineWidth = node.vulnerable ? 2.5 : 1;
    ctx.stroke();

    if (node.mutation === 'logic_bomb') {
      ctx.fillStyle = COLORS.AMBER;
      ctx.font = '9px Share Tech Mono';
      ctx.fillText('⚠', x - 5, y - 12);
    } else if (node.mutation === 'echo_attack') {
      ctx.fillStyle = COLORS.CYAN;
      ctx.font = '9px Share Tech Mono';
      ctx.fillText('◈', x - 5, y - 12);
    }
  });

  const alive = nodes.filter(n => n.alive).length;
  ctx.fillStyle = COLORS.MAGENTA;
  ctx.font = '13px Share Tech Mono';
  ctx.shadowColor = COLORS.MAGENTA;
  ctx.shadowBlur = 6;
  ctx.fillText(`NODES: ${alive}`, 16, CANVAS_H - 16);
  ctx.shadowBlur = 0;
}
