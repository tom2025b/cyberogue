// src/render/drawPlayer.js
import { TILE_SIZE, COLORS } from '../game/constants.js';
import { applyGlitch } from './glitch.js';

const WIREFRAME_EDGES = [
  [[0.5,0.05],[0.1,0.45]], [[0.5,0.05],[0.9,0.45]],
  [[0.5,0.05],[0.3,0.7]],  [[0.5,0.05],[0.7,0.7]],
  [[0.1,0.45],[0.3,0.7]],  [[0.9,0.45],[0.7,0.7]],
  [[0.1,0.45],[0.7,0.7]],  [[0.9,0.45],[0.3,0.7]],
  [[0.3,0.7],[0.5,0.95]],  [[0.7,0.7],[0.5,0.95]],
  [[0.1,0.45],[0.5,0.95]], [[0.9,0.45],[0.5,0.95]],
];

export function drawPlayer(ctx, player, ts, tint = COLORS.CYAN) {
  const { x, y, glitchFrames } = player;
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const size = TILE_SIZE;

  const grad = ctx.createRadialGradient(px+size/2, py+size/2, 0, px+size/2, py+size/2, size);
  grad.addColorStop(0, tint + '44');
  grad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(px+size/2, py+size/2, size, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = tint;
  ctx.shadowBlur = 8;
  WIREFRAME_EDGES.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(px + a[0]*size, py + a[1]*size);
    ctx.lineTo(px + b[0]*size, py + b[1]*size);
    ctx.stroke();
  });
  ctx.restore();

  if (glitchFrames > 0) {
    applyGlitch(ctx, px - 4, py - 4, size + 8, size + 8, glitchFrames / 5);
  }
}
