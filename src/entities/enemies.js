// src/entities/enemies.js

export function createEnemy(x, y, floor = 1) {
  return {
    x, y,
    hp: 20 + floor * 5,
    speed: 1,
    confused: 0,
    turnsSincePredict: 0,
  };
}

export function predictNextMove(history) {
  if (history.length < 4) return null;
  const [a, b, c, d] = history.slice(-4);
  if (a.dx === c.dx && a.dy === c.dy && b.dx === d.dx && b.dy === d.dy) {
    return { dx: a.dx, dy: a.dy };
  }
  if (history.length >= 3) {
    const [x, , z] = history.slice(-3);
    if (x.dx === z.dx && x.dy === z.dy) return { dx: x.dx, dy: x.dy };
  }
  return null;
}

export function tickEnemy(enemy, player, infectedTiles) {
  const e = { ...enemy };
  e.turnsSincePredict++;

  if (e.confused > 0) {
    e.confused--;
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    const d = dirs[Math.floor(Math.random() * 4)];
    e.x += d.dx; e.y += d.dy;
    return e;
  }

  const onInfected = infectedTiles.has(`${e.x},${e.y}`);
  const effectiveSpeed = onInfected ? Math.max(0, e.speed - 1) : e.speed;
  if (effectiveSpeed === 0) return e;

  if (e.turnsSincePredict >= 3) {
    e.turnsSincePredict = 0;
    const pred = predictNextMove(player.moveHistory);
    if (pred) {
      const targetX = player.x + pred.dx;
      const targetY = player.y + pred.dy;
      e.x += Math.sign(targetX - e.x);
      e.y += Math.sign(targetY - e.y);
      return e;
    }
  }

  e.x += Math.sign(player.x - e.x);
  e.y += Math.sign(player.y - e.y);
  return e;
}

export function spawnEnemies(map, floor, rng) {
  const count = 3 + floor * 2;
  const neurons = map.neurons.slice(1);
  return Array.from({ length: Math.min(count, neurons.length) }, (_, i) => {
    const n = neurons[i % neurons.length];
    return createEnemy(n.center.x + 1, n.center.y + 1, floor);
  });
}

export function isCornered(player, enemies) {
  const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
  return dirs.every(d =>
    enemies.some(e => e.x === player.x + d.dx && e.y === player.y + d.dy)
  );
}
