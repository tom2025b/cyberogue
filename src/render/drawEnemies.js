// src/render/drawEnemies.js
import { TILE_SIZE, COLORS } from '../game/constants.js';

export function drawEnemies(ctx, enemies, ts) {
  enemies.forEach(e => {
    const px = e.x * TILE_SIZE;
    const py = e.y * TILE_SIZE;
    const flicker = e.confused > 0 && Math.sin(ts * 0.025) > 0;

    ctx.save();
    ctx.globalAlpha = flicker ? 0.35 : 1;
    ctx.strokeStyle = COLORS.MAGENTA;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = COLORS.MAGENTA;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const r = TILE_SIZE * 0.44;
      const vx = px + TILE_SIZE/2 + r * Math.cos(angle);
      const vy = py + TILE_SIZE/2 + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.stroke();

    // HP pip
    const hpMax = e.hp + 20;
    ctx.fillStyle = COLORS.MAGENTA;
    ctx.fillRect(px, py - 4, TILE_SIZE * (e.hp / hpMax), 2);

    ctx.restore();
  });
}
