// src/render/drawMap.js
import { TILE_SIZE, COLORS, CANVAS_W, CANVAS_H } from '../game/constants.js';

export function drawMap(ctx, map, infectedTiles, ts) {
  if (!map) return;
  drawInfection(ctx, infectedTiles);
  drawSynapses(ctx, map, ts);
  drawNeurons(ctx, map, ts);
}

function drawInfection(ctx, infectedTiles) {
  infectedTiles.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = 'rgba(57,255,20,0.08)';
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });
}

function drawSynapses(ctx, map, ts) {
  const { neurons, synapses } = map;
  synapses.forEach(syn => {
    if (!syn.active) return;
    const a = neurons[syn.nodeA];
    const b = neurons[syn.nodeB];
    if (!a || !b) return;
    const ax = a.center.x * TILE_SIZE + TILE_SIZE / 2;
    const ay = a.center.y * TILE_SIZE + TILE_SIZE / 2;
    const bx = b.center.x * TILE_SIZE + TILE_SIZE / 2;
    const by = b.center.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = 'rgba(0,255,247,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const phase = ((ts * 0.0008 + syn.pulseOffset) % (Math.PI * 2)) / (Math.PI * 2);
    const px = ax + (bx - ax) * phase;
    const py = ay + (by - ay) * phase;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.CYAN;
    ctx.fill();
  });
}

function drawNeurons(ctx, map, ts) {
  map.neurons.forEach(n => {
    const cx = n.center.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = n.center.y * TILE_SIZE + TILE_SIZE / 2;
    const r = n.radius * TILE_SIZE;
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.002 + n.pulsePhase);

    const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    grad.addColorStop(0, n.infected ? 'rgba(57,255,20,0.2)' : 'rgba(0,255,247,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = n.infected
      ? `rgba(57,255,20,${0.4 + 0.4 * pulse})`
      : `rgba(0,255,247,${0.18 + 0.28 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

export function drawFirewallEvents(ctx, events, player, ts) {
  events.forEach(ev => {
    if (ev.type === 'static_flood') drawStaticFlood(ctx, player, ts);
    else if (ev.type === 'vision_cut') drawVisionCut(ctx, ts);
  });
}

function drawStaticFlood(ctx, player, ts) {
  for (let i = 0; i < 180; i++) {
    const x = Math.floor(Math.random() * (CANVAS_W / TILE_SIZE)) * TILE_SIZE;
    const y = Math.floor(Math.random() * (CANVAS_H / TILE_SIZE)) * TILE_SIZE;
    ctx.fillStyle = `rgba(0,255,247,${Math.random() * 0.45})`;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
  const px = player.x * TILE_SIZE + TILE_SIZE / 2;
  const py = player.y * TILE_SIZE + TILE_SIZE / 2;
  const vR = 3 * TILE_SIZE;
  const grad = ctx.createRadialGradient(px, py, vR * 0.5, px, py, vR * 1.8);
  grad.addColorStop(0, 'rgba(5,5,16,0)');
  grad.addColorStop(1, 'rgba(5,5,16,0.97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawVisionCut(ctx, ts) {
  const seed = Math.floor(ts / 2000);
  for (let x = 0; x < CANVAS_W; x += TILE_SIZE) {
    for (let y = 0; y < CANVAS_H; y += TILE_SIZE) {
      const h = Math.sin(x * 374761 + y * 1234567 + seed * 99) * 0.5 + 0.5;
      if (h < 0.6) {
        ctx.fillStyle = 'rgba(5,5,16,0.95)';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}
