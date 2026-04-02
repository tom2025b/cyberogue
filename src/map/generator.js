// src/map/generator.js
import { createPRNG } from '../game/prng.js';
import { GRID_W, GRID_H } from '../game/constants.js';

// --- Poisson-disk neuron placement ---
function poissonDisk(rng, minDist = 8, maxAttempts = 30) {
  const nodes = [];
  const margin = 4;
  function tooClose(x, y) {
    return nodes.some(n => Math.hypot(n.cx - x, n.cy - y) < minDist);
  }
  const attempts = rng.nextInt(20, 35) * maxAttempts;
  for (let i = 0; i < attempts && nodes.length < 35; i++) {
    const cx = rng.nextInt(margin, GRID_W - margin);
    const cy = rng.nextInt(margin, GRID_H - margin);
    if (!tooClose(cx, cy)) {
      nodes.push({ cx, cy });
      if (nodes.length >= 20 && rng.nextBool(0.15)) break;
    }
  }
  return nodes.slice(0, 35);
}

// --- Kruskal MST ---
function kruskalMST(nodes) {
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].cx - nodes[j].cx, nodes[i].cy - nodes[j].cy);
      edges.push({ i, j, d });
    }
  }
  edges.sort((a, b) => a.d - b.d);
  const parent = nodes.map((_, i) => i);
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(a, b) { parent[find(a)] = find(b); }
  const mst = [];
  for (const e of edges) {
    if (find(e.i) !== find(e.j)) {
      mst.push(e);
      union(e.i, e.j);
    }
  }
  return mst;
}

// --- Extra random edges (~30%) ---
function addExtraEdges(nodes, mst, rng) {
  const mstSet = new Set(mst.map(e => `${e.i}-${e.j}`));
  const extras = [];
  const maxExtra = Math.floor(mst.length * 0.3);
  for (let attempt = 0; attempt < 200 && extras.length < maxExtra; attempt++) {
    const i = rng.nextInt(0, nodes.length - 1);
    const j = rng.nextInt(0, nodes.length - 1);
    if (i !== j) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!mstSet.has(key)) {
        mstSet.add(key);
        extras.push({ i: Math.min(i,j), j: Math.max(i,j), d: 0 });
      }
    }
  }
  return extras;
}

export function generateMap(seed) {
  const rng = createPRNG(seed);

  const positions = poissonDisk(rng);
  if (positions.length < 20) {
    // fallback: force minimum grid
    while (positions.length < 20) {
      positions.push({
        cx: rng.nextInt(4, GRID_W - 4),
        cy: rng.nextInt(4, GRID_H - 4),
      });
    }
  }

  const neurons = positions.map((p, id) => ({
    id,
    center: { x: p.cx, y: p.cy },
    radius: rng.nextInt(3, 6),
    infected: false,
    pulsePhase: rng.next() * Math.PI * 2,
  }));

  const mstEdges = kruskalMST(positions);
  const extraEdges = addExtraEdges(positions, mstEdges, rng);
  const allEdges = [...mstEdges, ...extraEdges];

  const synapses = allEdges.map((e, idx) => ({
    id: idx,
    nodeA: e.i,
    nodeB: e.j,
    pulseOffset: rng.next() * Math.PI * 2,
    active: true,
  }));

  // Staircase neuron: last neuron in list
  const staircaseId = neurons.length - 1;

  return { neurons, synapses, staircaseId, seed };
}
