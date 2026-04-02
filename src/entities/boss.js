// src/entities/boss.js
const MUTATIONS = ['logic_bomb', 'echo_attack', null, null];

export function createBoss() {
  const root = {
    id: 0, alive: true, mutation: null,
    depth: 0, parentId: null,
    x: 0.5, y: 0.08,
    vulnerable: true,
  };
  return { root, nodes: { 0: root }, nextId: 1, vulnerableId: 0, vulnerableTimer: 0 };
}

export function countAlive(boss) {
  return Object.values(boss.nodes).filter(n => n.alive).length;
}

export function killNode(boss, id) {
  const node = boss.nodes[id];
  if (!node || !node.alive) return boss;

  const nodes = { ...boss.nodes, [id]: { ...node, alive: false } };
  let nextId = boss.nextId;
  const spread = 0.22 / (node.depth + 1);

  for (let i = 0; i < 2; i++) {
    const mutation = MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
    const child = {
      id: nextId, alive: true, mutation,
      depth: node.depth + 1, parentId: id,
      x: Math.max(0.05, Math.min(0.95, node.x + (i === 0 ? -spread : spread))),
      y: Math.min(0.92, node.y + 0.11),
      vulnerable: false,
    };
    nodes[nextId] = child;
    nextId++;
  }

  const alive = Object.values(nodes).filter(n => n.alive);
  const next = alive.length > 0 ? alive[Math.floor(Math.random() * alive.length)] : null;
  const updatedNodes = { ...nodes };
  Object.keys(updatedNodes).forEach(k => {
    updatedNodes[k] = { ...updatedNodes[k], vulnerable: false };
  });
  if (next) updatedNodes[next.id] = { ...updatedNodes[next.id], vulnerable: true };

  return { ...boss, nodes: updatedNodes, nextId, vulnerableId: next?.id ?? -1 };
}

export function tickVulnerable(boss, ts) {
  if (ts - boss.vulnerableTimer < 3000) return boss;
  const alive = Object.values(boss.nodes).filter(n => n.alive);
  if (alive.length === 0) return boss;
  const next = alive[Math.floor(Math.random() * alive.length)];
  const nodes = { ...boss.nodes };
  Object.keys(nodes).forEach(k => { nodes[k] = { ...nodes[k], vulnerable: false }; });
  nodes[next.id] = { ...nodes[next.id], vulnerable: true };
  return { ...boss, nodes, vulnerableId: next.id, vulnerableTimer: ts };
}
