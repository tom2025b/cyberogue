// src/map/infection.js
import { GRID_W, GRID_H } from '../game/constants.js';

export function spreadInfection(px, py, radius, existing, neurons) {
  const tiles = new Set(existing);
  const queue = [{ x: px, y: py, dist: 0 }];
  const visited = new Set([`${px},${py}`]);
  while (queue.length) {
    const { x, y, dist } = queue.shift();
    tiles.add(`${x},${y}`);
    if (dist >= radius) continue;
    const neighbours = [
      [x-1,y],[x+1,y],[x,y-1],[x,y+1],
      [x-1,y-1],[x+1,y-1],[x-1,y+1],[x+1,y+1],
    ];
    for (const [nx, ny] of neighbours) {
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
      const key = `${nx},${ny}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ x: nx, y: ny, dist: dist + 1 });
      }
    }
  }
  neurons.forEach(n => {
    if (tiles.has(`${n.center.x},${n.center.y}`)) n.infected = true;
  });
  return tiles;
}
