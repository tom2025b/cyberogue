// src/render/glitch.js
export function applyGlitch(ctx, x, y, w, h, intensity = 1) {
  if (intensity <= 0) return;
  const slices = Math.floor(3 * intensity);
  for (let i = 0; i < slices; i++) {
    const sy = y + Math.random() * h;
    const sh = 2 + Math.random() * 4;
    const offset = (Math.random() - 0.5) * 12 * intensity;
    try {
      const imageData = ctx.getImageData(x, sy, w, sh);
      ctx.putImageData(imageData, x + offset, sy);
    } catch (_) {}
  }
  ctx.save();
  ctx.globalAlpha = 0.25 * intensity;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(255,0,170,0.5)';
  ctx.fillRect(x - 2, y, w, h);
  ctx.fillStyle = 'rgba(0,255,247,0.5)';
  ctx.fillRect(x + 2, y, w, h);
  ctx.restore();
}
