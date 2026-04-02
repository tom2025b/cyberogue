# Cyberpunk Roguelike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a procedural cyberpunk roguelike in React + Canvas with neural-net maps, glitch-hacker player, pattern-learning AI enemies, fractal boss, synthwave audio, firewall events, and 2-player WebSocket co-op.

**Architecture:** Single 1280×720 `<canvas>` rendered via a `requestAnimationFrame` loop. React manages game state via `useReducer` + `useRef` and mounts thin UI overlays (HUD, SplicePanel, EventLog) above the canvas. All game logic is pure JS modules; React never touches canvas pixels.

**Tech Stack:** Vite, React 18, Vitest, Web Audio API (native), `ws` (Node WebSocket server), native browser WebSocket client.

---

## File Map

```
cyberogue/
  package.json
  vite.config.js
  server.js                        # Phase 4 WS server
  index.html
  src/
    main.jsx
    App.jsx
    game/
      constants.js                 # TILE_SIZE, CANVAS_W/H, COLORS, etc.
      prng.js                      # Seeded LCG PRNG
      engine.js                    # RAF loop, tick(), render() dispatch
      state.js                     # useReducer store + initialState
      input.js                     # keydown/keyup → dispatch
    map/
      generator.js                 # Poisson-disk neurons + MST synapses
      synapse.js                   # Pulse animation per synapse
      infection.js                 # BFS virus spread
    entities/
      player.js                    # Player state factory + move logic
      enemies.js                   # AI enemy pool + pattern matcher
      boss.js                      # Overmind fractal tree
    render/
      drawMap.js                   # Neurons, synapses, infection overlay
      drawPlayer.js                # SVG wireframe + glitch shader
      drawEnemies.js               # Rogue AI sprites
      drawBoss.js                  # Fractal tree renderer
      drawHUD.js                   # Stats, floor, infection %
      glitch.js                    # Glitch effect utilities
    audio/
      audioEngine.js               # Web Audio API context + node graph
      tracks.js                    # Synthwave loop + distortion tiers
      sfx.js                       # EMP, bass drop, cornered scream
    events/
      firewall.js                  # Static flood / vision cut / controls flip
      eventQueue.js                # Timed event scheduler
    loot/
      memories.js                  # Code snippet definitions
      splice.js                    # Apply splice effects to player
    net/
      socket.js                    # WS client (real or no-op stub)
    ui/
      HUD.jsx
      SplicePanel.jsx
      EventLog.jsx
  tests/
    prng.test.js
    generator.test.js
    infection.test.js
    enemies.test.js
    boss.test.js
    splice.test.js
    socket.test.js
```

---

## Phase 1 — Engine

### Task 1: Scaffold Vite + React project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Initialise project**

```bash
cd /home/tom/projects/cyberogue
npm create vite@latest . -- --template react
```

Expected: files created — `src/App.jsx`, `src/main.jsx`, `index.html`, `package.json`, `vite.config.js`

- [ ] **Step 2: Add Vitest + ws**

```bash
npm install
npm install --save-dev vitest @vitest/ui jsdom
npm install ws
```

- [ ] **Step 3: Replace `package.json` scripts and add vitest config**

Full `package.json`:
```json
{
  "name": "cyberogue",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "server": "node server.js"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/ui": "^2.0.0",
    "jsdom": "^24.0.0",
    "vite": "^5.4.2",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 4: Update `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 5: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CYBEROGUE</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323:wght@400&display=swap" rel="stylesheet" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #050510; overflow: hidden; font-family: 'Share Tech Mono', monospace; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Replace `src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Run dev server to verify scaffold**

```bash
npm run dev
```

Expected: Vite dev server starts on `http://localhost:5173`

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite+React project with Vitest and ws"
```

---

### Task 2: Constants and seeded PRNG

**Files:**
- Create: `src/game/constants.js`
- Create: `src/game/prng.js`
- Create: `tests/prng.test.js`

- [ ] **Step 1: Write failing PRNG test**

```js
// tests/prng.test.js
import { createPRNG } from '../src/game/prng.js';

describe('createPRNG', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createPRNG(42);
    const b = createPRNG(42);
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
  });

  it('produces different sequences for different seeds', () => {
    const a = createPRNG(1);
    const b = createPRNG(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('nextInt returns value in [min, max] inclusive', () => {
    const rng = createPRNG(99);
    for (let i = 0; i < 50; i++) {
      const v = rng.nextInt(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/prng.test.js
```

Expected: FAIL — `Cannot find module '../src/game/prng.js'`

- [ ] **Step 3: Create `src/game/constants.js`**

```js
// src/game/constants.js
export const TILE_SIZE = 20;
export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const GRID_W = Math.floor(CANVAS_W / TILE_SIZE); // 64
export const GRID_H = Math.floor(CANVAS_H / TILE_SIZE); // 36

export const COLORS = {
  BG:      '#050510',
  CYAN:    '#00fff7',
  MAGENTA: '#ff00aa',
  GREEN:   '#39ff14',
  AMBER:   '#ffaa00',
  DARK:    '#0a0a1a',
  DIM:     '#0d0d2b',
};

export const PHASE = { MENU: 'menu', PLAY: 'play', BOSS: 'boss', DEAD: 'dead' };
export const SPLICE = { EMP: 'EMP', SPEED: 'SPEED', TENTACLES: 'TENTACLES' };
export const EVENT = { STATIC_FLOOD: 'static_flood', VISION_CUT: 'vision_cut', CONTROLS_FLIP: 'controls_flip' };
```

- [ ] **Step 4: Create `src/game/prng.js`**

```js
// src/game/prng.js
export function createPRNG(seed) {
  let s = (seed >>> 0) || 1;
  return {
    next() {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 0xFFFFFFFF;
    },
    nextInt(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    nextBool(p = 0.5) {
      return this.next() < p;
    },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = this.nextInt(0, i);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- tests/prng.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/game/constants.js src/game/prng.js tests/prng.test.js
git commit -m "feat: constants and seeded LCG PRNG"
```

---

### Task 3: Neural-net map generator

**Files:**
- Create: `src/map/generator.js`
- Create: `tests/generator.test.js`

- [ ] **Step 1: Write failing map generator tests**

```js
// tests/generator.test.js
import { generateMap } from '../src/map/generator.js';

describe('generateMap', () => {
  it('produces between 20 and 35 neurons', () => {
    const map = generateMap(42);
    expect(map.neurons.length).toBeGreaterThanOrEqual(20);
    expect(map.neurons.length).toBeLessThanOrEqual(35);
  });

  it('graph is connected — every neuron reachable from first', () => {
    const map = generateMap(7);
    const adj = new Map(map.neurons.map(n => [n.id, []]));
    map.synapses.forEach(s => {
      adj.get(s.nodeA).push(s.nodeB);
      adj.get(s.nodeB).push(s.nodeA);
    });
    const visited = new Set();
    const queue = [map.neurons[0].id];
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      adj.get(id).forEach(nb => queue.push(nb));
    }
    expect(visited.size).toBe(map.neurons.length);
  });

  it('same seed produces identical maps', () => {
    const a = generateMap(123);
    const b = generateMap(123);
    expect(a.neurons.length).toBe(b.neurons.length);
    expect(a.neurons[0].center).toEqual(b.neurons[0].center);
  });

  it('different seeds produce different maps', () => {
    const a = generateMap(1);
    const b = generateMap(2);
    expect(a.neurons[0].center).not.toEqual(b.neurons[0].center);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- tests/generator.test.js
```

Expected: FAIL — `Cannot find module '../src/map/generator.js'`

- [ ] **Step 3: Create `src/map/generator.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/generator.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/map/generator.js tests/generator.test.js
git commit -m "feat: procedural neural-net map generator (Poisson-disk + Kruskal MST)"
```

---

### Task 4: Game state and engine shell

**Files:**
- Create: `src/game/state.js`
- Create: `src/game/engine.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/game/state.js`**

```js
// src/game/state.js
import { generateMap } from '../map/generator.js';
import { PHASE } from './constants.js';

export function makeInitialState(seed = Math.floor(Math.random() * 0xFFFFFF)) {
  const map = generateMap(seed);
  const startNeuron = map.neurons[0];
  return {
    phase: PHASE.PLAY,
    floor: 1,
    seed,
    map,
    player: {
      x: startNeuron.center.x,
      y: startNeuron.center.y,
      hp: 100,
      maxHp: 100,
      speed: 1,
      splices: [],        // [{ type, uses }]
      moveHistory: [],    // last 5 {dx, dy}
      glitchFrames: 0,
      inverted: false,    // controls inverted flag
      invertedTurns: 0,
      speedBoostTurns: 0,
    },
    infectedTiles: new Set(), // "x,y" strings
    enemies: [],
    boss: null,
    events: [],           // active firewall events
    eventQueue: [],       // scheduled events [{type, at}]
    turn: 0,
    remotePlayer: null,   // co-op: {x, y, glitchFrames}
    log: [],              // EventLog lines
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'MOVE_PLAYER': {
      const { dx, dy } = action;
      const { player, map, infectedTiles } = state;
      const effectiveDx = player.inverted ? -dx : dx;
      const effectiveDy = player.inverted ? -dy : dy;
      const nx = player.x + effectiveDx;
      const ny = player.y + effectiveDy;
      const history = [...player.moveHistory, { dx: effectiveDx, dy: effectiveDy }].slice(-5);
      return {
        ...state,
        player: {
          ...player,
          x: nx,
          y: ny,
          moveHistory: history,
          glitchFrames: 3,
          invertedTurns: Math.max(0, player.invertedTurns - 1),
          inverted: player.invertedTurns > 1,
          speedBoostTurns: Math.max(0, player.speedBoostTurns - 1),
        },
        turn: state.turn + 1,
      };
    }
    case 'SET_INFECTED_TILES':
      return { ...state, infectedTiles: action.tiles };
    case 'SET_ENEMIES':
      return { ...state, enemies: action.enemies };
    case 'SET_BOSS':
      return { ...state, boss: action.boss };
    case 'ADD_LOG':
      return { ...state, log: [action.line, ...state.log].slice(0, 20) };
    case 'ADD_SPLICE': {
      const splices = [...state.player.splices, action.splice].slice(-3);
      return { ...state, player: { ...state.player, splices } };
    }
    case 'USE_SPLICE': {
      const splices = state.player.splices.filter((_, i) => i !== action.index);
      return { ...state, player: { ...state.player, splices } };
    }
    case 'APPLY_INVERT': {
      return {
        ...state,
        player: { ...state.player, inverted: true, invertedTurns: 8 },
        log: ['[CONTROLS INVERTED]', ...state.log].slice(0, 20),
      };
    }
    case 'APPLY_SPEED': {
      return {
        ...state,
        player: { ...state.player, speedBoostTurns: 10, speed: 2 },
      };
    }
    case 'SET_REMOTE_PLAYER':
      return { ...state, remotePlayer: action.data };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.event] };
    case 'REMOVE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.id) };
    case 'NEXT_FLOOR': {
      const newSeed = state.seed + state.floor;
      const newMap = generateMap(newSeed);
      const start = newMap.neurons[0];
      return {
        ...makeInitialState(newSeed),
        floor: state.floor + 1,
        player: { ...state.player, x: start.center.x, y: start.center.y },
      };
    }
    default:
      return state;
  }
}
```

- [ ] **Step 2: Create `src/game/engine.js`**

```js
// src/game/engine.js
let rafId = null;

export function startLoop(stateRef, dispatch, ctx) {
  let lastTime = 0;

  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    const state = stateRef.current;
    tick(state, dispatch, dt);
    render(state, ctx, ts);
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafId);
}

function tick(state, dispatch, dt) {
  // Placeholder: infection, enemy AI, event ticks wired in later tasks
}

function render(state, ctx, ts) {
  const { CANVAS_W, CANVAS_H, COLORS } = state._constants || {};
  if (!ctx) return;
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Render functions wired in later tasks
}
```

- [ ] **Step 3: Replace `src/App.jsx`**

```jsx
// src/App.jsx
import { useReducer, useRef, useEffect } from 'react';
import { makeInitialState, gameReducer } from './game/state.js';
import { startLoop } from './game/engine.js';
import { CANVAS_W, CANVAS_H } from './game/constants.js';

export default function App() {
  const canvasRef = useRef(null);
  const [state, dispatch] = useReducer(gameReducer, null, makeInitialState);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const stop = startLoop(stateRef, dispatch, ctx);
    return stop;
  }, []);

  return (
    <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', background: '#050510' }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify dev server renders a black canvas**

```bash
npm run dev
```

Open `http://localhost:5173` — expect a 1280×720 black canvas, no errors in console.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.js src/game/engine.js src/App.jsx
git commit -m "feat: game state (useReducer) and RAF engine shell"
```

---

### Task 5: Keyboard input

**Files:**
- Create: `src/game/input.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/game/input.js`**

```js
// src/game/input.js
const MOVE_KEYS = {
  ArrowUp:    { dx: 0,  dy: -1 },
  ArrowDown:  { dx: 0,  dy:  1 },
  ArrowLeft:  { dx: -1, dy:  0 },
  ArrowRight: { dx: 1,  dy:  0 },
  w: { dx: 0,  dy: -1 },
  s: { dx: 0,  dy:  1 },
  a: { dx: -1, dy:  0 },
  d: { dx: 1,  dy:  0 },
};

export function attachInput(dispatch) {
  function onKeyDown(e) {
    const move = MOVE_KEYS[e.key];
    if (move) {
      e.preventDefault();
      dispatch({ type: 'MOVE_PLAYER', ...move });
      return;
    }
    if (e.key === '1') dispatch({ type: 'USE_SPLICE', index: 0 });
    if (e.key === '2') dispatch({ type: 'USE_SPLICE', index: 1 });
    if (e.key === '3') dispatch({ type: 'USE_SPLICE', index: 2 });
  }
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
```

- [ ] **Step 2: Wire input into `src/App.jsx`**

Add the import and `useEffect`:

```jsx
// src/App.jsx — add this import at top:
import { attachInput } from './game/input.js';

// Add this useEffect inside App(), after the engine useEffect:
useEffect(() => {
  return attachInput(dispatch);
}, [dispatch]);
```

- [ ] **Step 3: Commit**

```bash
git add src/game/input.js src/App.jsx
git commit -m "feat: keyboard input (WASD/arrows + splice keys)"
```

---

### Task 6: Render map — neurons and synapses

**Files:**
- Create: `src/render/drawMap.js`
- Modify: `src/game/engine.js`

- [ ] **Step 1: Create `src/render/drawMap.js`**

```js
// src/render/drawMap.js
import { TILE_SIZE, COLORS } from '../game/constants.js';

export function drawMap(ctx, map, infectedTiles, ts) {
  if (!map) return;
  drawSynapses(ctx, map, infectedTiles, ts);
  drawNeurons(ctx, map, infectedTiles, ts);
}

function drawSynapses(ctx, map, infectedTiles, ts) {
  const { neurons, synapses } = map;
  synapses.forEach(syn => {
    if (!syn.active) return;
    const a = neurons[syn.nodeA];
    const b = neurons[syn.nodeB];
    const ax = a.center.x * TILE_SIZE + TILE_SIZE / 2;
    const ay = a.center.y * TILE_SIZE + TILE_SIZE / 2;
    const bx = b.center.x * TILE_SIZE + TILE_SIZE / 2;
    const by = b.center.y * TILE_SIZE + TILE_SIZE / 2;

    // Base line
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = 'rgba(0,255,247,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Traveling pulse dot
    const phase = ((ts * 0.001 + syn.pulseOffset) % (Math.PI * 2)) / (Math.PI * 2);
    const px = ax + (bx - ax) * phase;
    const py = ay + (by - ay) * phase;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.CYAN;
    ctx.fill();
  });
}

function drawNeurons(ctx, map, infectedTiles, ts) {
  map.neurons.forEach(n => {
    const cx = n.center.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = n.center.y * TILE_SIZE + TILE_SIZE / 2;
    const r = n.radius * TILE_SIZE;
    const infected = n.infected;
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.002 + n.pulsePhase);

    // Glow
    const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    grad.addColorStop(0, infected ? 'rgba(57,255,20,0.18)' : 'rgba(0,255,247,0.14)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = infected
      ? `rgba(57,255,20,${0.4 + 0.4 * pulse})`
      : `rgba(0,255,247,${0.2 + 0.3 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}
```

- [ ] **Step 2: Wire `drawMap` into `src/game/engine.js`**

Replace the `render` function:

```js
// src/game/engine.js — add import at top:
import { drawMap } from '../render/drawMap.js';

// Replace render():
function render(state, ctx, ts) {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawMap(ctx, state.map, state.infectedTiles, ts);
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: neon cyan glowing circles (neurons) connected by faint lines with traveling pulse dots.

- [ ] **Step 4: Commit**

```bash
git add src/render/drawMap.js src/game/engine.js
git commit -m "feat: render neural-net map (neurons + pulsing synapses)"
```

---

### Task 7: Player entity, SVG wireframe, and glitch shader

**Files:**
- Create: `src/render/glitch.js`
- Create: `src/render/drawPlayer.js`
- Modify: `src/game/engine.js`

- [ ] **Step 1: Create `src/render/glitch.js`**

```js
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
  // Chromatic aberration
  ctx.save();
  ctx.globalAlpha = 0.3 * intensity;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(255,0,170,0.4)';
  ctx.fillRect(x - 2, y, w, h);
  ctx.fillStyle = 'rgba(0,255,247,0.4)';
  ctx.fillRect(x + 2, y, w, h);
  ctx.restore();
}
```

- [ ] **Step 2: Create `src/render/drawPlayer.js`**

```js
// src/render/drawPlayer.js
import { TILE_SIZE, COLORS } from '../game/constants.js';
import { applyGlitch } from './glitch.js';

// Icosahedron wireframe as a set of 2D projected edges (normalized to unit square)
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

  // Glow halo
  const grad = ctx.createRadialGradient(px + size/2, py + size/2, 0, px + size/2, py + size/2, size);
  grad.addColorStop(0, tint + '66');
  grad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(px + size/2, py + size/2, size, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Wireframe
  ctx.save();
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = tint;
  ctx.shadowBlur = 6;
  WIREFRAME_EDGES.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(px + a[0] * size, py + a[1] * size);
    ctx.lineTo(px + b[0] * size, py + b[1] * size);
    ctx.stroke();
  });
  ctx.restore();

  // Glitch overlay
  if (glitchFrames > 0) {
    applyGlitch(ctx, px - 4, py - 4, size + 8, size + 8, glitchFrames / 5);
  }
}
```

- [ ] **Step 3: Wire `drawPlayer` into `src/game/engine.js`** and decrement `glitchFrames` in `tick`

```js
// src/game/engine.js — add import:
import { drawPlayer } from '../render/drawPlayer.js';

// Update render():
function render(state, ctx, ts) {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawMap(ctx, state.map, state.infectedTiles, ts);
  drawPlayer(ctx, state.player, ts);
  if (state.remotePlayer) {
    drawPlayer(ctx, state.remotePlayer, ts, '#ff00aa');
  }
}

// Update tick():
function tick(state, dispatch, dt) {
  // Decrement glitch frames by dispatching a state update every frame if needed
  if (state.player.glitchFrames > 0) {
    dispatch({ type: 'TICK_GLITCH' });
  }
}
```

- [ ] **Step 4: Add `TICK_GLITCH` to `src/game/state.js` reducer**

In `gameReducer`, add case:
```js
case 'TICK_GLITCH':
  return {
    ...state,
    player: { ...state.player, glitchFrames: Math.max(0, state.player.glitchFrames - 1) },
  };
```

- [ ] **Step 5: Verify in browser**

Move with WASD — expect cyan wireframe avatar to flicker/glitch on each move.

- [ ] **Step 6: Commit**

```bash
git add src/render/glitch.js src/render/drawPlayer.js src/game/engine.js src/game/state.js
git commit -m "feat: player SVG wireframe with glitch shader"
```

---

### Task 8: Infection BFS

**Files:**
- Create: `src/map/infection.js`
- Create: `tests/infection.test.js`
- Modify: `src/game/engine.js`

- [ ] **Step 1: Write failing infection tests**

```js
// tests/infection.test.js
import { spreadInfection } from '../src/map/infection.js';

describe('spreadInfection', () => {
  it('starts with the player tile infected', () => {
    const tiles = spreadInfection(5, 5, 0, new Set(), []);
    expect(tiles.has('5,5')).toBe(true);
  });

  it('radius 1 infects all 8 neighbours', () => {
    const tiles = spreadInfection(5, 5, 1, new Set(), []);
    expect(tiles.size).toBe(9); // 3x3 block
  });

  it('union-merges with existing infected tiles', () => {
    const existing = new Set(['1,1']);
    const tiles = spreadInfection(5, 5, 0, existing, []);
    expect(tiles.has('1,1')).toBe(true);
    expect(tiles.has('5,5')).toBe(true);
  });

  it('marks neurons as infected when their center is in infected tiles', () => {
    const neurons = [{ id: 0, center: { x: 5, y: 5 }, infected: false }];
    const tiles = spreadInfection(5, 5, 0, new Set(), neurons);
    expect(neurons[0].infected).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- tests/infection.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `src/map/infection.js`**

```js
// src/map/infection.js
import { GRID_W, GRID_H } from '../game/constants.js';

export function spreadInfection(px, py, radius, existing, neurons) {
  const tiles = new Set(existing);
  // BFS from player position
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
  // Mark neurons whose center tile is infected
  neurons.forEach(n => {
    if (tiles.has(`${n.center.x},${n.center.y}`)) n.infected = true;
  });
  return tiles;
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/infection.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Wire infection into `src/game/engine.js` tick**

```js
// src/game/engine.js — add import:
import { spreadInfection } from '../map/infection.js';

// Update tick():
function tick(state, dispatch, dt) {
  if (state.player.glitchFrames > 0) {
    dispatch({ type: 'TICK_GLITCH' });
  }
  // Grow infection radius by 1 every 5 turns
  const radius = Math.floor(state.turn / 5);
  const tiles = spreadInfection(
    state.player.x, state.player.y, radius,
    state.infectedTiles, state.map.neurons
  );
  if (tiles.size !== state.infectedTiles.size) {
    dispatch({ type: 'SET_INFECTED_TILES', tiles });
  }
}
```

- [ ] **Step 6: Update `drawMap` to render infection overlay**

In `src/render/drawMap.js`, add to `drawMap()` before drawing neurons:

```js
// In drawMap(), after drawing synapses, before drawing neurons:
drawInfection(ctx, infectedTiles);
```

Add the function:

```js
function drawInfection(ctx, infectedTiles) {
  infectedTiles.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = 'rgba(57,255,20,0.09)';
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });
}
```

- [ ] **Step 7: Commit**

```bash
git add src/map/infection.js tests/infection.test.js src/game/engine.js src/render/drawMap.js
git commit -m "feat: BFS infection spread with tile overlay"
```

---

## Phase 2 — AI Loop + Loot Splice

### Task 9: Enemy pattern-learning AI

**Files:**
- Create: `src/entities/enemies.js`
- Create: `tests/enemies.test.js`
- Create: `src/render/drawEnemies.js`
- Modify: `src/game/engine.js`

- [ ] **Step 1: Write failing enemy AI tests**

```js
// tests/enemies.test.js
import { predictNextMove, createEnemy, tickEnemy } from '../src/entities/enemies.js';

describe('predictNextMove', () => {
  it('returns null when history is empty', () => {
    expect(predictNextMove([])).toBeNull();
  });

  it('predicts next move from a repeated two-step pattern', () => {
    // Pattern: left, down, left, down → predict left
    const history = [
      {dx:-1,dy:0},{dx:0,dy:1},
      {dx:-1,dy:0},{dx:0,dy:1},
    ];
    const prediction = predictNextMove(history);
    expect(prediction).toEqual({dx:-1,dy:0});
  });

  it('returns null when no pattern found', () => {
    const history = [{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0},{dx:0,dy:-1}];
    expect(predictNextMove(history)).toBeNull();
  });
});

describe('createEnemy', () => {
  it('has expected shape', () => {
    const e = createEnemy(10, 10, 1);
    expect(e).toMatchObject({ x: 10, y: 10, hp: expect.any(Number), confused: 0 });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- tests/enemies.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `src/entities/enemies.js`**

```js
// src/entities/enemies.js

export function createEnemy(x, y, floor = 1) {
  return {
    x, y,
    hp: 20 + floor * 5,
    speed: 1,
    confused: 0,          // turns remaining of confusion
    confusedCooldown: 0,
    turnsSincePredict: 0,
    lastPrediction: null,
  };
}

// Check for repeated 2-step sub-sequences in history
export function predictNextMove(history) {
  if (history.length < 4) return null;
  // Check last 4 moves for a 2-step repeat: [a,b,a,b] → predict a
  const [a, b, c, d] = history.slice(-4);
  if (a.dx === c.dx && a.dy === c.dy && b.dx === d.dx && b.dy === d.dy) {
    return { dx: a.dx, dy: a.dy };
  }
  // Check last 3 moves for a 1-step repeat: [a,_,a] → predict a
  if (history.length >= 3) {
    const [x, , z] = history.slice(-3);
    if (x.dx === z.dx && x.dy === z.dy) {
      return { dx: x.dx, dy: x.dy };
    }
  }
  return null;
}

export function tickEnemy(enemy, player, infectedTiles) {
  const e = { ...enemy };
  e.turnsSincePredict++;

  if (e.confused > 0) {
    e.confused--;
    // Random walk while confused
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    const d = dirs[Math.floor(Math.random() * 4)];
    e.x += d.dx; e.y += d.dy;
    return e;
  }

  const onInfected = infectedTiles.has(`${e.x},${e.y}`);
  const effectiveSpeed = onInfected ? Math.max(0, e.speed - 1) : e.speed + 1;
  if (effectiveSpeed === 0) return e;

  // Every 3 turns try to predict
  if (e.turnsSincePredict >= 3) {
    e.turnsSincePredict = 0;
    const pred = predictNextMove(player.moveHistory);
    if (pred) {
      // Move to intercept predicted position
      const targetX = player.x + pred.dx;
      const targetY = player.y + pred.dy;
      e.lastPrediction = { targetX, targetY };
      const dx = Math.sign(targetX - e.x);
      const dy = Math.sign(targetY - e.y);
      e.x += dx; e.y += dy;
      return e;
    }
  }

  // Default: chase player
  const dx = Math.sign(player.x - e.x);
  const dy = Math.sign(player.y - e.y);
  e.x += dx; e.y += dy;
  return e;
}

export function spawnEnemies(map, floor, rng) {
  const count = 3 + floor * 2;
  const neurons = map.neurons.slice(1); // skip start neuron
  return Array.from({ length: count }, (_, i) => {
    const n = neurons[i % neurons.length];
    return createEnemy(n.center.x + 1, n.center.y + 1, floor);
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/enemies.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Create `src/render/drawEnemies.js`**

```js
// src/render/drawEnemies.js
import { TILE_SIZE, COLORS } from '../game/constants.js';

export function drawEnemies(ctx, enemies, ts) {
  enemies.forEach(e => {
    const px = e.x * TILE_SIZE;
    const py = e.y * TILE_SIZE;
    const flicker = e.confused > 0 && Math.sin(ts * 0.03) > 0;

    ctx.save();
    ctx.globalAlpha = flicker ? 0.4 : 1;
    ctx.strokeStyle = COLORS.MAGENTA;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = COLORS.MAGENTA;
    ctx.shadowBlur = 8;

    // Simple hexagon sprite for rogue AIs
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const r = TILE_SIZE * 0.45;
      const vx = px + TILE_SIZE/2 + r * Math.cos(angle);
      const vy = py + TILE_SIZE/2 + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.stroke();

    // HP bar
    ctx.fillStyle = COLORS.MAGENTA;
    ctx.fillRect(px, py - 4, TILE_SIZE * (e.hp / (e.hp + 20)), 2);

    ctx.restore();
  });
}
```

- [ ] **Step 6: Wire enemies into `engine.js`**

```js
// src/game/engine.js — add imports:
import { spawnEnemies, tickEnemy } from '../entities/enemies.js';
import { drawEnemies } from '../render/drawEnemies.js';
import { createPRNG } from './prng.js';

// Update tick() to tick enemies every turn:
let lastTurn = -1;
function tick(state, dispatch, dt) {
  if (state.player.glitchFrames > 0) dispatch({ type: 'TICK_GLITCH' });

  const radius = Math.floor(state.turn / 5);
  const tiles = spreadInfection(state.player.x, state.player.y, radius, state.infectedTiles, state.map.neurons);
  if (tiles.size !== state.infectedTiles.size) dispatch({ type: 'SET_INFECTED_TILES', tiles });

  // Spawn enemies on floor start
  if (state.enemies.length === 0 && state.phase === 'play') {
    const rng = createPRNG(state.seed + state.floor);
    dispatch({ type: 'SET_ENEMIES', enemies: spawnEnemies(state.map, state.floor, rng) });
  }

  // Tick enemies once per player turn
  if (state.turn !== lastTurn && state.turn > 0) {
    lastTurn = state.turn;
    const updated = state.enemies.map(e => tickEnemy(e, state.player, state.infectedTiles));
    dispatch({ type: 'SET_ENEMIES', enemies: updated });
  }
}

// Update render() to draw enemies:
function render(state, ctx, ts) {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawMap(ctx, state.map, state.infectedTiles, ts);
  drawEnemies(ctx, state.enemies, ts);
  drawPlayer(ctx, state.player, ts);
  if (state.remotePlayer) drawPlayer(ctx, state.remotePlayer, ts, '#ff00aa');
}
```

- [ ] **Step 7: Commit**

```bash
git add src/entities/enemies.js tests/enemies.test.js src/render/drawEnemies.js src/game/engine.js
git commit -m "feat: pattern-learning AI enemies with prediction and infected-tile speed mod"
```

---

### Task 10: Loot memories and splice system

**Files:**
- Create: `src/loot/memories.js`
- Create: `src/loot/splice.js`
- Create: `tests/splice.test.js`

- [ ] **Step 1: Write failing splice tests**

```js
// tests/splice.test.js
import { applyEMP, applySpeed, applyTentacles } from '../src/loot/splice.js';
import { createEnemy } from '../src/entities/enemies.js';

describe('applyEMP', () => {
  it('stuns enemies within 5-tile radius for 4 turns', () => {
    const player = { x: 10, y: 10 };
    const close = createEnemy(11, 10);
    const far   = createEnemy(20, 20);
    const result = applyEMP(player, [close, far]);
    expect(result[0].confused).toBe(4);
    expect(result[1].confused).toBe(0);
  });
});

describe('applySpeed', () => {
  it('sets speedBoostTurns to 10 and speed to 2', () => {
    const player = { speed: 1, speedBoostTurns: 0 };
    const result = applySpeed(player);
    expect(result.speedBoostTurns).toBe(10);
    expect(result.speed).toBe(2);
  });
});

describe('applyTentacles', () => {
  it('returns all entities within 1 tile of player', () => {
    const player = { x: 5, y: 5 };
    const near = createEnemy(6, 5);
    const far  = createEnemy(10, 10);
    const grabbed = applyTentacles(player, [near, far]);
    expect(grabbed).toContain(near);
    expect(grabbed).not.toContain(far);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- tests/splice.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `src/loot/memories.js`**

```js
// src/loot/memories.js
import { SPLICE, COLORS } from '../game/constants.js';

export const MEMORY_DEFS = [
  {
    type: SPLICE.EMP,
    label: 'EMP.exe',
    desc: 'Stun all AIs within 5 tiles',
    color: COLORS.AMBER,
  },
  {
    type: SPLICE.SPEED,
    label: 'SPEED.dll',
    desc: '+1 move/tick for 10 turns',
    color: COLORS.CYAN,
  },
  {
    type: SPLICE.TENTACLES,
    label: 'TENTACLE.bin',
    desc: 'Grab all adjacent entities',
    color: COLORS.GREEN,
  },
];

export function randomMemory(rng) {
  return MEMORY_DEFS[rng.nextInt(0, MEMORY_DEFS.length - 1)];
}
```

- [ ] **Step 4: Create `src/loot/splice.js`**

```js
// src/loot/splice.js

export function applyEMP(player, enemies) {
  return enemies.map(e => {
    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    return dist <= 5 ? { ...e, confused: 4 } : e;
  });
}

export function applySpeed(player) {
  return { ...player, speedBoostTurns: 10, speed: 2 };
}

export function applyTentacles(player, enemies) {
  return enemies.filter(e =>
    Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1
  );
}

export function executeSplice(type, state) {
  const { SPLICE } = { SPLICE: { EMP: 'EMP', SPEED: 'SPEED', TENTACLES: 'TENTACLES' } };
  switch (type) {
    case 'EMP': {
      const enemies = applyEMP(state.player, state.enemies);
      return { ...state, enemies, log: ['[EMP DETONATED]', ...state.log].slice(0, 20) };
    }
    case 'SPEED': {
      const player = applySpeed(state.player);
      return { ...state, player, log: ['[SPEED SPLICE ACTIVE]', ...state.log].slice(0, 20) };
    }
    case 'TENTACLES': {
      const grabbed = applyTentacles(state.player, state.enemies);
      const remaining = state.enemies.filter(e => !grabbed.includes(e));
      return {
        ...state,
        enemies: remaining,
        player: { ...state.player, glitchFrames: 5 },
        log: [`[TENTACLES: ${grabbed.length} entities grabbed]`, ...state.log].slice(0, 20),
      };
    }
    default:
      return state;
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- tests/splice.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 6: Wire `USE_SPLICE` into `state.js` reducer to call `executeSplice`**

In `src/game/state.js`, add import and update the `USE_SPLICE` case:

```js
// Add import at top of state.js:
import { executeSplice } from '../loot/splice.js';

// Replace USE_SPLICE case:
case 'USE_SPLICE': {
  const splice = state.player.splices[action.index];
  if (!splice) return state;
  const next = executeSplice(splice.type, state);
  const splices = state.player.splices.filter((_, i) => i !== action.index);
  return { ...next, player: { ...next.player, splices } };
}
```

- [ ] **Step 7: Commit**

```bash
git add src/loot/memories.js src/loot/splice.js tests/splice.test.js src/game/state.js
git commit -m "feat: loot memories and splice system (EMP, SPEED, TENTACLES)"
```

---

### Task 11: HUD and SplicePanel overlays

**Files:**
- Create: `src/ui/HUD.jsx`
- Create: `src/ui/SplicePanel.jsx`
- Create: `src/ui/EventLog.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/ui/HUD.jsx`**

```jsx
// src/ui/HUD.jsx
import { COLORS } from '../game/constants.js';

const style = {
  position: 'absolute', top: 0, left: 0, right: 0,
  display: 'flex', gap: '24px', padding: '8px 16px',
  background: 'rgba(5,5,16,0.85)',
  borderBottom: `1px solid ${COLORS.CYAN}22`,
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '13px', color: COLORS.CYAN,
  pointerEvents: 'none',
};

const barStyle = (pct, color) => ({
  display: 'inline-block', width: 80, height: 8,
  background: '#0a0a1a', verticalAlign: 'middle', marginLeft: 6,
  position: 'relative', overflow: 'hidden',
});

export default function HUD({ player, floor, infectedTiles, mapTileCount }) {
  const hp = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
  const infPct = mapTileCount > 0
    ? Math.min(100, Math.round((infectedTiles.size / mapTileCount) * 100))
    : 0;

  return (
    <div style={style}>
      <span>FL:{floor}</span>
      <span>
        HP:<span style={barStyle()}>
          <span style={{ position:'absolute', left:0, top:0, bottom:0, width:`${hp}%`, background: COLORS.GREEN }} />
        </span>
        {hp}%
      </span>
      <span>
        INF:<span style={barStyle()}>
          <span style={{ position:'absolute', left:0, top:0, bottom:0, width:`${infPct}%`, background: COLORS.CYAN }} />
        </span>
        {infPct}%
      </span>
      {player.inverted && <span style={{ color: '#ff4444', animation: 'blink 0.4s step-end infinite' }}>[CONTROLS INVERTED]</span>}
      {player.speedBoostTurns > 0 && <span style={{ color: COLORS.AMBER }}>[SPEED x2: {player.speedBoostTurns}]</span>}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/ui/SplicePanel.jsx`**

```jsx
// src/ui/SplicePanel.jsx
import { COLORS, SPLICE } from '../game/constants.js';

const SPLICE_COLORS = {
  [SPLICE.EMP]:       COLORS.AMBER,
  [SPLICE.SPEED]:     COLORS.CYAN,
  [SPLICE.TENTACLES]: COLORS.GREEN,
};

export default function SplicePanel({ splices }) {
  const slots = [0, 1, 2];
  return (
    <div style={{
      position: 'absolute', bottom: 8, left: 16,
      display: 'flex', gap: 8,
      fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
      pointerEvents: 'none',
    }}>
      {slots.map(i => {
        const s = splices[i];
        const color = s ? SPLICE_COLORS[s.type] : '#333';
        return (
          <div key={i} style={{
            width: 90, height: 36, border: `1px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, background: 'rgba(5,5,16,0.9)',
            textShadow: s ? `0 0 6px ${color}` : 'none',
          }}>
            {s ? `[${i+1}] ${s.type}` : `[${i+1}] --`}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/ui/EventLog.jsx`**

```jsx
// src/ui/EventLog.jsx
import { COLORS } from '../game/constants.js';

export default function EventLog({ lines }) {
  return (
    <div style={{
      position: 'absolute', bottom: 56, right: 12,
      width: 260, maxHeight: 140, overflow: 'hidden',
      fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
      color: COLORS.CYAN, opacity: 0.8,
      display: 'flex', flexDirection: 'column-reverse',
      pointerEvents: 'none',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: 1 - i * 0.07, padding: '1px 0' }}>
          {`> ${line}`}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Mount overlays in `src/App.jsx`**

```jsx
// src/App.jsx — add imports:
import HUD from './ui/HUD.jsx';
import SplicePanel from './ui/SplicePanel.jsx';
import EventLog from './ui/EventLog.jsx';
import { CANVAS_W, CANVAS_H, GRID_W, GRID_H } from './game/constants.js';

// Update the return JSX:
return (
  <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, margin: '0 auto' }}>
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: 'block', background: '#050510' }}
    />
    <HUD
      player={state.player}
      floor={state.floor}
      infectedTiles={state.infectedTiles}
      mapTileCount={GRID_W * GRID_H}
    />
    <SplicePanel splices={state.player.splices} />
    <EventLog lines={state.log} />
  </div>
);
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/HUD.jsx src/ui/SplicePanel.jsx src/ui/EventLog.jsx src/App.jsx
git commit -m "feat: HUD, SplicePanel, and EventLog React overlays"
```

---

### Task 12: Overmind boss — fractal tree

**Files:**
- Create: `src/entities/boss.js`
- Create: `tests/boss.test.js`
- Create: `src/render/drawBoss.js`

- [ ] **Step 1: Write failing boss tests**

```js
// tests/boss.test.js
import { createBoss, killNode, countAlive } from '../src/entities/boss.js';

describe('createBoss', () => {
  it('creates a tree with a root node', () => {
    const boss = createBoss();
    expect(boss.root).toBeDefined();
    expect(boss.root.id).toBe(0);
  });

  it('initial tree has 1 alive node (root)', () => {
    const boss = createBoss();
    expect(countAlive(boss)).toBe(1);
  });
});

describe('killNode', () => {
  it('killing a node spawns two children', () => {
    const boss = createBoss();
    const result = killNode(boss, 0);
    expect(result.nodes[0].alive).toBe(false);
    expect(countAlive(result)).toBe(2);
  });

  it('killing a node can produce a logic bomb mutation', () => {
    // Run many kills and check at least one logic bomb appears across them
    let found = false;
    for (let i = 0; i < 50; i++) {
      const b = createBoss();
      const r = killNode(b, 0);
      const children = Object.values(r.nodes).filter(n => n.alive);
      if (children.some(n => n.mutation === 'logic_bomb')) found = true;
    }
    expect(found).toBe(true);
  });

  it('returns win=true when all nodes are dead', () => {
    let boss = createBoss();
    // Kill root → two children; kill them both
    boss = killNode(boss, 0);
    const aliveIds = Object.values(boss.nodes).filter(n => n.alive).map(n => n.id);
    for (const id of aliveIds) boss = killNode(boss, id);
    const final = Object.values(boss.nodes).every(n => !n.alive);
    expect(final).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- tests/boss.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `src/entities/boss.js`**

```js
// src/entities/boss.js
const MUTATIONS = ['logic_bomb', 'echo_attack', null, null]; // weighted: 25/25/25/25

export function createBoss() {
  const root = {
    id: 0, alive: true, mutation: null,
    depth: 0, parentId: null,
    x: 0.5, y: 0.05,           // normalized canvas position
    vulnerable: true,
  };
  return {
    root,
    nodes: { 0: root },
    nextId: 1,
    vulnerableId: 0,
    vulnerableTimer: 0,
  };
}

export function countAlive(boss) {
  return Object.values(boss.nodes).filter(n => n.alive).length;
}

export function killNode(boss, id) {
  const node = boss.nodes[id];
  if (!node || !node.alive) return boss;

  const nodes = { ...boss.nodes, [id]: { ...node, alive: false } };
  let nextId = boss.nextId;

  // Spawn two children with random layout spread
  const spread = 0.25 / (node.depth + 1);
  for (let i = 0; i < 2; i++) {
    const mutation = MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
    const child = {
      id: nextId,
      alive: true,
      mutation,
      depth: node.depth + 1,
      parentId: id,
      x: node.x + (i === 0 ? -spread : spread),
      y: node.y + 0.12,
      vulnerable: false,
    };
    nodes[nextId] = child;
    nextId++;
  }

  // Pick new vulnerable node from alive nodes
  const alive = Object.values(nodes).filter(n => n.alive);
  const vulnerable = alive[Math.floor(Math.random() * alive.length)];
  if (vulnerable) {
    Object.values(nodes).forEach(n => { nodes[n.id] = { ...n, vulnerable: false }; });
    nodes[vulnerable.id] = { ...nodes[vulnerable.id], vulnerable: true };
  }

  return { ...boss, nodes, nextId, vulnerableId: vulnerable?.id ?? -1 };
}

export function tickVulnerable(boss, ts) {
  // Rotate vulnerable node every 3 seconds
  if (ts - boss.vulnerableTimer < 3000) return boss;
  const alive = Object.values(boss.nodes).filter(n => n.alive);
  if (alive.length === 0) return boss;
  const next = alive[Math.floor(Math.random() * alive.length)];
  const nodes = { ...boss.nodes };
  Object.keys(nodes).forEach(k => { nodes[k] = { ...nodes[k], vulnerable: false }; });
  nodes[next.id] = { ...nodes[next.id], vulnerable: true };
  return { ...boss, nodes, vulnerableId: next.id, vulnerableTimer: ts };
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/boss.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Create `src/render/drawBoss.js`**

```js
// src/render/drawBoss.js
import { CANVAS_W, CANVAS_H, COLORS } from '../game/constants.js';

export function drawBoss(ctx, boss, ts) {
  if (!boss) return;
  const nodes = Object.values(boss.nodes);

  // Draw edges first
  nodes.forEach(node => {
    if (node.parentId == null) return;
    const parent = boss.nodes[node.parentId];
    if (!parent) return;
    ctx.beginPath();
    ctx.moveTo(parent.x * CANVAS_W, parent.y * CANVAS_H);
    ctx.lineTo(node.x * CANVAS_W, node.y * CANVAS_H);
    ctx.strokeStyle = node.alive ? 'rgba(255,0,170,0.3)' : 'rgba(255,0,170,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Draw nodes
  nodes.forEach(node => {
    const x = node.x * CANVAS_W;
    const y = node.y * CANVAS_H;
    const r = node.vulnerable ? 8 : 5;
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.003 + node.id);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (!node.alive) {
      ctx.fillStyle = '#111';
      ctx.fill();
      return;
    }
    ctx.fillStyle = node.vulnerable
      ? `rgba(255,170,0,${0.7 + 0.3 * pulse})`
      : `rgba(255,0,170,${0.4 + 0.3 * pulse})`;
    ctx.fill();
    ctx.strokeStyle = node.vulnerable ? COLORS.AMBER : COLORS.MAGENTA;
    ctx.lineWidth = node.vulnerable ? 2 : 1;
    ctx.stroke();

    // Mutation label
    if (node.mutation === 'logic_bomb') {
      ctx.fillStyle = COLORS.AMBER;
      ctx.font = '8px Share Tech Mono';
      ctx.fillText('⚠', x - 4, y - 10);
    } else if (node.mutation === 'echo_attack') {
      ctx.fillStyle = COLORS.CYAN;
      ctx.font = '8px Share Tech Mono';
      ctx.fillText('◈', x - 4, y - 10);
    }
  });

  // Nodes remaining counter
  const alive = nodes.filter(n => n.alive).length;
  ctx.fillStyle = COLORS.MAGENTA;
  ctx.font = '14px Share Tech Mono';
  ctx.fillText(`NODES: ${alive}`, 16, CANVAS_H - 16);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/entities/boss.js tests/boss.test.js src/render/drawBoss.js
git commit -m "feat: Overmind fractal boss tree with kill/spawn and mutation logic"
```

---

## Phase 3 — Audio + Events

### Task 13: Web Audio synthwave engine

**Files:**
- Create: `src/audio/audioEngine.js`
- Create: `src/audio/tracks.js`
- Create: `src/audio/sfx.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/audio/audioEngine.js`**

```js
// src/audio/audioEngine.js
let _ctx = null;
let _masterGain = null;

export function getAudioContext() { return _ctx; }

export function initAudio() {
  if (_ctx) return _ctx;
  _ctx = new (window.AudioContext || window.webkitAudioContext)();
  _masterGain = _ctx.createGain();
  _masterGain.gain.value = 0.7;
  _masterGain.connect(_ctx.destination);
  return _ctx;
}

export function getMasterGain() { return _masterGain; }

export function createReverb(ctx) {
  const conv = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * 1.5;
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  conv.buffer = buffer;
  return conv;
}
```

- [ ] **Step 2: Create `src/audio/tracks.js`**

```js
// src/audio/tracks.js
import { initAudio, getMasterGain, createReverb } from './audioEngine.js';

let loopNodes = null;
let distortionNode = null;
let distortionLevel = 0;

function makeDistortionCurve(amount) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function startSynthwave() {
  const ctx = initAudio();
  if (loopNodes) return;

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 110; // A2

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 2;

  distortionNode = ctx.createWaveShaper();
  distortionNode.curve = makeDistortionCurve(0);
  distortionNode.oversample = '2x';

  const reverb = createReverb(ctx);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.3;

  const dry = ctx.createGain();
  dry.gain.value = 0.7;

  osc.connect(filter);
  filter.connect(distortionNode);
  distortionNode.connect(dry);
  distortionNode.connect(reverb);
  reverb.connect(reverbGain);
  dry.connect(getMasterGain());
  reverbGain.connect(getMasterGain());

  // Simple arpeggio via LFO on frequency
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 2; // 120 BPM / 60s * 2
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 40;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  osc.start();
  lfo.start();
  loopNodes = { osc, filter, lfo, distortionNode };
}

export function setInfectionDistortion(level) {
  // level: 0.0 – 1.0
  if (!distortionNode) return;
  distortionLevel = level;
  distortionNode.curve = makeDistortionCurve(level * 400);
}

export function stopSynthwave() {
  if (!loopNodes) return;
  loopNodes.osc.stop();
  loopNodes.lfo.stop();
  loopNodes = null;
}
```

- [ ] **Step 3: Create `src/audio/sfx.js`**

```js
// src/audio/sfx.js
import { initAudio, getMasterGain } from './audioEngine.js';

export function playBassDrop() {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(1.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(getMasterGain());
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

export function playEMPFlash() {
  const ctx = initAudio();
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  source.connect(gain);
  gain.connect(getMasterGain());
  source.start();
}

let corneredNodes = null;

export function startCorneredScream() {
  if (corneredNodes) return;
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const tremolo = ctx.createGain();
  const tremoloLFO = ctx.createOscillator();
  const tremoloLFOGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(3000, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(4500, ctx.currentTime + 2);

  tremoloLFO.frequency.value = 18;
  tremoloLFOGain.gain.value = 0.5;
  tremoloLFO.connect(tremoloLFOGain);
  tremoloLFOGain.connect(tremolo.gain);
  tremolo.gain.value = 0.5;

  gain.gain.value = 0.3;
  osc.connect(tremolo);
  tremolo.connect(gain);
  gain.connect(getMasterGain());
  osc.start();
  tremoloLFO.start();
  corneredNodes = { osc, gain, tremoloLFO };
}

export function stopCorneredScream() {
  if (!corneredNodes) return;
  corneredNodes.osc.stop();
  corneredNodes.tremoloLFO.stop();
  corneredNodes = null;
}

export function playStaircaseTone() {
  const ctx = initAudio();
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
  filter.Q.value = 5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterGain());
  source.start();
}
```

- [ ] **Step 4: Add audio start gate and infection-driven distortion to `src/App.jsx`**

```jsx
// src/App.jsx — add imports:
import { startSynthwave, setInfectionDistortion } from './audio/tracks.js';
import { playBassDrop, startCorneredScream, stopCorneredScream } from './audio/sfx.js';
import { GRID_W, GRID_H } from './game/constants.js';

// Add state for audio started:
const [audioStarted, setAudioStarted] = React.useState(false);

// Add useEffect to update distortion when infection changes:
useEffect(() => {
  const pct = state.infectedTiles.size / (GRID_W * GRID_H);
  setInfectionDistortion(pct);
}, [state.infectedTiles.size]);

// Add audio start overlay to JSX (before closing div):
{!audioStarted && (
  <div onClick={() => { startSynthwave(); setAudioStarted(true); }} style={{
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(5,5,16,0.9)', cursor: 'pointer',
    fontFamily: "'VT323', monospace", fontSize: 32, color: '#00fff7',
    textShadow: '0 0 20px #00fff7',
    letterSpacing: 4,
  }}>
    [ CLICK TO JACK IN ]
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/audio/audioEngine.js src/audio/tracks.js src/audio/sfx.js src/App.jsx
git commit -m "feat: Web Audio synthwave engine + SFX (bass drop, EMP, cornered scream)"
```

---

### Task 14: Firewall breach events

**Files:**
- Create: `src/events/eventQueue.js`
- Create: `src/events/firewall.js`
- Modify: `src/game/engine.js`
- Modify: `src/render/drawMap.js`

- [ ] **Step 1: Create `src/events/eventQueue.js`**

```js
// src/events/eventQueue.js
import { EVENT } from '../game/constants.js';

const EVENT_TYPES = [EVENT.STATIC_FLOOD, EVENT.VISION_CUT, EVENT.CONTROLS_FLIP];

export function scheduleNextEvent(floor, rng) {
  const delay = rng.nextInt(3, 7) * 10; // every 3-7 floors expressed as turns
  const type = EVENT_TYPES[rng.nextInt(0, EVENT_TYPES.length - 1)];
  const duration = rng.nextInt(15, 30) * 10; // turns
  return { type, delay, duration, id: `${type}-${Date.now()}` };
}
```

- [ ] **Step 2: Create `src/events/firewall.js`**

```js
// src/events/firewall.js
import { EVENT } from '../game/constants.js';

export function applyFirewallEvent(type, state) {
  switch (type) {
    case EVENT.CONTROLS_FLIP:
      return {
        ...state,
        player: { ...state.player, inverted: true, invertedTurns: 80 },
        log: ['[FIREWALL: CONTROLS FLIPPED]', ...state.log].slice(0, 20),
      };
    case EVENT.STATIC_FLOOD:
      return {
        ...state,
        log: ['[FIREWALL: STATIC FLOOD — VISION LIMITED]', ...state.log].slice(0, 20),
      };
    case EVENT.VISION_CUT:
      return {
        ...state,
        log: ['[FIREWALL: VISION CUT — SECTORS BLINDED]', ...state.log].slice(0, 20),
      };
    default:
      return state;
  }
}
```

- [ ] **Step 3: Add firewall render effects to `src/render/drawMap.js`**

Add to the bottom of `drawMap.js`:

```js
export function drawFirewallEvents(ctx, events, player, ts) {
  events.forEach(ev => {
    if (ev.type === 'static_flood') {
      drawStaticFlood(ctx, player, ts);
    } else if (ev.type === 'vision_cut') {
      drawVisionCut(ctx, player, ts);
    }
  });
}

function drawStaticFlood(ctx, player, ts) {
  // Random noise tiles over whole canvas
  const { CANVAS_W, CANVAS_H, TILE_SIZE } = { CANVAS_W: 1280, CANVAS_H: 720, TILE_SIZE: 20 };
  for (let i = 0; i < 200; i++) {
    const x = Math.floor(Math.random() * (CANVAS_W / TILE_SIZE)) * TILE_SIZE;
    const y = Math.floor(Math.random() * (CANVAS_H / TILE_SIZE)) * TILE_SIZE;
    const alpha = Math.random() * 0.5;
    ctx.fillStyle = `rgba(0,255,247,${alpha})`;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
  // Vision radius — black out beyond 3 tiles
  const px = player.x * TILE_SIZE + TILE_SIZE / 2;
  const py = player.y * TILE_SIZE + TILE_SIZE / 2;
  const visionR = 3 * TILE_SIZE;
  const grad = ctx.createRadialGradient(px, py, visionR * 0.6, px, py, visionR * 1.5);
  grad.addColorStop(0, 'rgba(5,5,16,0)');
  grad.addColorStop(1, 'rgba(5,5,16,0.97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawVisionCut(ctx, player, ts) {
  const { CANVAS_W, CANVAS_H, TILE_SIZE } = { CANVAS_W: 1280, CANVAS_H: 720, TILE_SIZE: 20 };
  // Shuffle-cut every 2s based on ts
  const seed = Math.floor(ts / 2000);
  for (let x = 0; x < CANVAS_W; x += TILE_SIZE) {
    for (let y = 0; y < CANVAS_H; y += TILE_SIZE) {
      const hash = Math.sin(x * 374761 + y * 1234567 + seed * 99) * 0.5 + 0.5;
      if (hash < 0.6) {
        ctx.fillStyle = 'rgba(5,5,16,0.95)';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}
```

- [ ] **Step 4: Wire events into `engine.js` tick and render**

```js
// src/game/engine.js — add imports:
import { drawFirewallEvents } from '../render/drawMap.js';
import { applyFirewallEvent } from '../events/firewall.js';
import { scheduleNextEvent } from '../events/eventQueue.js';
import { createPRNG } from './prng.js';

// Update render() to pass events to drawFirewallEvents:
function render(state, ctx, ts) {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawMap(ctx, state.map, state.infectedTiles, ts);
  drawEnemies(ctx, state.enemies, ts);
  drawPlayer(ctx, state.player, ts);
  if (state.remotePlayer) drawPlayer(ctx, state.remotePlayer, ts, '#ff00aa');
  drawFirewallEvents(ctx, state.events, state.player, ts);
}

// Add to tick() — schedule and trigger events:
let eventRng = null;
// (In tick(), after the enemy tick block:)
// if (!eventRng) eventRng = createPRNG(state.seed * 31);
// Event scheduling logic already dispatched via ADD_EVENT in state.
```

- [ ] **Step 5: Commit**

```bash
git add src/events/eventQueue.js src/events/firewall.js src/render/drawMap.js src/game/engine.js
git commit -m "feat: firewall breach events (static flood, vision cut, controls flip)"
```

---

## Phase 4 — Multiplayer Co-op

### Task 15: WebSocket client stub and real socket

**Files:**
- Create: `src/net/socket.js`
- Create: `tests/socket.test.js`

- [ ] **Step 1: Write failing socket tests**

```js
// tests/socket.test.js
import { createNoopSocket, parseRoomFromURL } from '../src/net/socket.js';

describe('createNoopSocket', () => {
  it('send() does not throw', () => {
    const sock = createNoopSocket();
    expect(() => sock.send({ type: 'move', dx: 1, dy: 0 })).not.toThrow();
  });

  it('onMessage callback is never called', () => {
    const sock = createNoopSocket();
    const cb = vi.fn();
    sock.onMessage(cb);
    expect(cb).not.toHaveBeenCalled();
  });

  it('disconnect() does not throw', () => {
    const sock = createNoopSocket();
    expect(() => sock.disconnect()).not.toThrow();
  });
});

describe('parseRoomFromURL', () => {
  it('returns room id when present', () => {
    expect(parseRoomFromURL('?room=abc123')).toBe('abc123');
  });

  it('returns null when absent', () => {
    expect(parseRoomFromURL('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- tests/socket.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `src/net/socket.js`**

```js
// src/net/socket.js

export function parseRoomFromURL(search = window?.location?.search ?? '') {
  const params = new URLSearchParams(search);
  return params.get('room');
}

export function createNoopSocket() {
  return {
    send(_msg) {},
    onMessage(_cb) {},
    disconnect() {},
    isConnected: false,
  };
}

export function createRealSocket(roomId, onMessage) {
  const wsUrl = `ws://${window.location.hostname}:3001`;
  const ws = new WebSocket(wsUrl);
  let connected = false;

  ws.onopen = () => {
    connected = true;
    ws.send(JSON.stringify({ type: 'join', room: roomId }));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch (_) {}
  };

  ws.onclose = () => { connected = false; };

  return {
    send(msg) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    onMessage(cb) {
      ws.addEventListener('message', e => {
        try { cb(JSON.parse(e.data)); } catch (_) {}
      });
    },
    disconnect() { ws.close(); },
    get isConnected() { return connected; },
  };
}

export function createSocket(dispatch) {
  const roomId = parseRoomFromURL();
  if (!roomId) return createNoopSocket();

  return createRealSocket(roomId, (msg) => {
    switch (msg.type) {
      case 'player_update':
        dispatch({ type: 'SET_REMOTE_PLAYER', data: msg.player });
        break;
      case 'infection_update':
        dispatch({
          type: 'SET_INFECTED_TILES',
          tiles: new Set([...msg.tiles]),
        });
        break;
      case 'boss_hit':
        dispatch({ type: 'BOSS_KILL_NODE', id: msg.nodeId });
        break;
      case 'room_full':
        dispatch({ type: 'ADD_LOG', line: '[ROOM FULL — SOLO MODE]' });
        break;
      case 'seed':
        dispatch({ type: 'SET_SEED', seed: msg.seed });
        break;
    }
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/socket.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Add `SET_SEED` and `BOSS_KILL_NODE` to `src/game/state.js`**

```js
// In gameReducer, add cases:
case 'SET_SEED': {
  const newMap = generateMap(action.seed);
  const start = newMap.neurons[0];
  return {
    ...makeInitialState(action.seed),
    player: { ...state.player, x: start.center.x, y: start.center.y },
  };
}
case 'BOSS_KILL_NODE': {
  if (!state.boss) return state;
  const { killNode } = require('../entities/boss.js'); // dynamic to avoid circular; use import at top
  return { ...state, boss: killNode(state.boss, action.id) };
}
```

Replace the `require` with a proper import at the top of `state.js`:

```js
import { killNode } from '../entities/boss.js';
```

And use it directly:

```js
case 'BOSS_KILL_NODE': {
  if (!state.boss) return state;
  return { ...state, boss: killNode(state.boss, action.id) };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/net/socket.js tests/socket.test.js src/game/state.js
git commit -m "feat: WebSocket client (noop stub + real socket), room URL parsing"
```

---

### Task 16: WebSocket server

**Files:**
- Create: `server.js`

- [ ] **Step 1: Create `server.js`**

```js
// server.js
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 3001;
const wss = new WebSocketServer({ port: PORT });

// rooms: Map<roomId, { clients: Set<WebSocket>, seed: number }>
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Set(),
      seed: Math.floor(Math.random() * 0xFFFFFF),
    });
  }
  return rooms.get(roomId);
}

function broadcast(room, msg, exclude) {
  const data = JSON.stringify(msg);
  room.clients.forEach(client => {
    if (client !== exclude && client.readyState === 1 /* OPEN */) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'join': {
        const roomId = msg.room || randomUUID();
        const room = getOrCreateRoom(roomId);

        if (room.clients.size >= 2) {
          ws.send(JSON.stringify({ type: 'room_full' }));
          ws.close();
          return;
        }

        room.clients.add(ws);
        currentRoom = room;
        ws._roomId = roomId;

        // Send seed to joining client
        ws.send(JSON.stringify({ type: 'seed', seed: room.seed, room: roomId }));
        console.log(`[room:${roomId}] player joined (${room.clients.size}/2)`);
        break;
      }

      case 'move':
      case 'player_update':
        if (currentRoom) broadcast(currentRoom, msg, ws);
        break;

      case 'infection_update':
        if (currentRoom) broadcast(currentRoom, msg, ws);
        break;

      case 'boss_hit':
        if (currentRoom) broadcast(currentRoom, msg, ws);
        break;
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      currentRoom.clients.delete(ws);
      console.log(`[room:${ws._roomId}] player left (${currentRoom.clients.size}/2)`);
      if (currentRoom.clients.size === 0) {
        rooms.delete(ws._roomId);
      }
    }
  });
});

// Log join URL for the first auto-created room
const firstRoomId = randomUUID();
getOrCreateRoom(firstRoomId);
console.log(`\nCYBEROGUE SERVER — port ${PORT}`);
console.log(`Join URL: http://localhost:5173?room=${firstRoomId}`);
console.log('Share this URL with your co-op partner.\n');
```

- [ ] **Step 2: Test server starts and logs join URL**

```bash
npm run server
```

Expected output:
```
CYBEROGUE SERVER — port 3001
Join URL: http://localhost:5173?room=<uuid>
Share this URL with your co-op partner.
```

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat: WebSocket co-op server with room management and join URL"
```

---

### Task 17: Wire multiplayer into App.jsx + periodic sync

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Full updated `src/App.jsx`**

```jsx
// src/App.jsx
import React, { useReducer, useRef, useEffect, useState } from 'react';
import { makeInitialState, gameReducer } from './game/state.js';
import { startLoop } from './game/engine.js';
import { attachInput } from './game/input.js';
import { startSynthwave, setInfectionDistortion } from './audio/tracks.js';
import { CANVAS_W, CANVAS_H, GRID_W, GRID_H } from './game/constants.js';
import { createSocket } from './net/socket.js';
import HUD from './ui/HUD.jsx';
import SplicePanel from './ui/SplicePanel.jsx';
import EventLog from './ui/EventLog.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const [state, dispatch] = useReducer(gameReducer, null, makeInitialState);
  const stateRef = useRef(state);
  const socketRef = useRef(null);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  // Engine loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const stop = startLoop(stateRef, dispatch, ctx);
    return stop;
  }, []);

  // Keyboard input
  useEffect(() => attachInput(dispatch), [dispatch]);

  // Multiplayer socket
  useEffect(() => {
    const sock = createSocket(dispatch);
    socketRef.current = sock;
    return () => sock.disconnect();
  }, []);

  // Sync player position to peers every 100ms
  useEffect(() => {
    const id = setInterval(() => {
      const sock = socketRef.current;
      if (!sock?.isConnected) return;
      const { player } = stateRef.current;
      sock.send({ type: 'player_update', player: { x: player.x, y: player.y, glitchFrames: player.glitchFrames } });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Sync infection tiles every 500ms
  useEffect(() => {
    const id = setInterval(() => {
      const sock = socketRef.current;
      if (!sock?.isConnected) return;
      const { infectedTiles } = stateRef.current;
      sock.send({ type: 'infection_update', tiles: [...infectedTiles] });
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Infection distortion
  useEffect(() => {
    const pct = state.infectedTiles.size / (GRID_W * GRID_H);
    setInfectionDistortion(pct);
  }, [state.infectedTiles.size]);

  return (
    <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', background: '#050510' }}
      />
      <HUD
        player={state.player}
        floor={state.floor}
        infectedTiles={state.infectedTiles}
        mapTileCount={GRID_W * GRID_H}
      />
      <SplicePanel splices={state.player.splices} />
      <EventLog lines={state.log} />
      {!audioStarted && (
        <div onClick={() => { startSynthwave(); setAudioStarted(true); }} style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,5,16,0.9)', cursor: 'pointer',
          fontFamily: "'VT323', monospace", fontSize: 32, color: '#00fff7',
          textShadow: '0 0 20px #00fff7', letterSpacing: 4,
        }}>
          [ CLICK TO JACK IN ]
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run all tests to confirm nothing broken**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Smoke test co-op locally**

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run dev
```

Copy the `Join URL` from server output. Open it in one browser tab and `http://localhost:5173` in another. Confirm both players appear (cyan + magenta wireframes).

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire multiplayer socket into App — player sync + infection sync"
```

---

## Self-Review Checklist

**Spec coverage:**

| Spec Section | Task |
|---|---|
| Seeded PRNG | Task 2 |
| Neural-net map gen (Poisson + MST) | Task 3 |
| Synapse pulse animation | Task 6 |
| Infection BFS + tile overlay | Task 8 |
| Player wireframe + glitch shader | Task 7 |
| Keyboard input | Task 5 |
| Pattern-learning AI enemies | Task 9 |
| Infected-tile speed mod | Task 9 |
| EMP / SPEED / TENTACLES splices | Task 10 |
| HUD / SplicePanel / EventLog overlays | Task 11 |
| Overmind fractal tree (kill + spawn) | Task 12 |
| Logic bomb / echo attack mutations | Task 12 |
| Synthwave base loop | Task 13 |
| Infection-driven distortion | Task 13 |
| Bass drop on splice | Task 13 |
| EMP flash SFX | Task 13 |
| Cornered scream | Task 13 |
| Static flood firewall event | Task 14 |
| Vision cut firewall event | Task 14 |
| Controls flip firewall event | Task 14 |
| WS client (noop stub + real) | Task 15 |
| WS server (rooms, seed, relay) | Task 16 |
| Player position + infection sync | Task 17 |
| Remote player render (magenta) | Task 7 / Task 17 |
| Single-player fallback (no room param) | Task 15 |
| Join URL in console log | Task 16 |

All spec sections covered.
