# Cyberpunk Roguelike — Design Spec
**Date:** 2026-04-02  
**Project:** `cyberogue` — procedural cyberpunk roguelike, React + Canvas  
**Status:** Approved

---

## Overview

A procedural cyberpunk roguelike built with Vite + React. One `<canvas>` at 1280×720 handles all world rendering via a `requestAnimationFrame` loop. React manages game state (`useReducer`) and mounts thin UI overlay components (HUD, SplicePanel, EventLog) above the canvas. The player is a glitch-hacker avatar propagating a virus through a living neural-net map. Enemies are rogue AIs that learn movement patterns. A fractal boss tree caps each run. Web Audio API provides a reactive synthwave soundtrack.

---

## Architecture

### Rendering Model
- Single `<canvas>` 1280×720, `TILE_SIZE = 20px` (~64×36 tile grid)
- RAF loop: `tick()` advances game logic → render functions draw to canvas each frame
- React components never render game world — canvas only
- React UI overlays (`position: absolute`) sit above canvas for HUD, inventory, event log
- Game state stored in `useReducer`; RAF loop reads via `useRef` to avoid stale closures

### File Structure
```
/src
  main.jsx
  App.jsx                    # Shell: canvas ref, loop init, overlay mount
  game/
    engine.js                # RAF loop, tick(), render() dispatch
    state.js                 # useReducer — all game state
    constants.js             # TILE_SIZE, CANVAS_W, CANVAS_H, etc.
    input.js                 # keydown/keyup → action dispatch
  map/
    generator.js             # Poisson-disk neurons + MST synapses
    synapse.js               # Pulse animation state per corridor
    infection.js             # BFS virus spread from player
  entities/
    player.js                # Position, stats, move history (last 5), splices
    enemies.js               # AI pool: pattern tracker, predictor, spawner
    boss.js                  # Overmind: 256-node fractal tree, split logic
  render/
    drawMap.js               # Neurons, synapses, infection overlay
    drawPlayer.js            # SVG wireframe → canvas, glitch shader
    drawEnemies.js           # Rogue AI sprites
    drawBoss.js              # Fractal tree renderer
    drawHUD.js               # Health, floor, infection %, event log
    glitch.js                # Glitch utilities: scanlines, chromatic shift
  audio/
    audioEngine.js           # Web Audio API context + node graph
    tracks.js                # Synthwave base loop + distortion tiers
    sfx.js                   # EMP flash, splice bass drop, cornered scream
  events/
    firewall.js              # Static flood / vision cut / controls flip
    eventQueue.js            # Timed event scheduler
  loot/
    memories.js              # Code snippet definitions + splice effects
    splice.js                # Apply splice to player state
  ui/
    HUD.jsx                  # React overlay: stats bar
    SplicePanel.jsx          # React overlay: splice inventory (3 slots)
    EventLog.jsx             # React overlay: scrolling event text
```

---

## Map Generation — Living Neural Net

### Neurons (Rooms)
- 20–35 nodes per floor via Poisson-disk sampling (seeded LCG PRNG for deterministic co-op output)
- Each node: `{ id, center: {x,y}, radius: 5–12 tiles, infected: false, pulsePhase: float }`
- Rendered as glowing circular chambers (blue → toxic green when infected)

### Synapses (Corridors)
- Minimum Spanning Tree for guaranteed connectivity + ~30% extra random edges
- Each synapse: 2-tile-wide L-shaped or diagonal corridor
- Metadata: `{ nodeA, nodeB, pulseOffset: 0–2π, active: true }`
- 10–15% of synapses culled and re-routed on each new floor (the "rewire" effect)
- Floor transition: synapses flash white → dark → new color over 0.5s

### Infection Spread
- BFS from player tile; radius grows +1 per move
- Infected tiles: sickly cyan/green overlay with noise texture
- Fully infected neurons glow toxic green; enemies on infected tiles get –1 speed

### Pulse Animation
- Each synapse has independent `pulseOffset` advanced in RAF loop
- Rendered as a bright dot traveling the corridor length; speed scales with floor number

---

## Player — Glitch-Hacker Avatar

- **Visual:** SVG wireframe (icosahedron silhouette) via `Path2D` on canvas
- **Glitch shader:** on each move, random horizontal slice displacement + RGB channel offset for 3–5 frames
- **Stats:** `hp`, `speed` (tiles/tick), `infectionRadius`, `splices[]` (max 3 active)
- **Move history:** circular buffer of last 5 `{dx, dy}` vectors — fed to enemy AI each turn

---

## Enemies — Rogue AIs

- Each enemy maintains a copy of the player's last-5-move buffer
- Every 3 turns: pattern matcher scans for repeated sub-sequences (e.g. left-left, up-right-up)
  - **Match found:** enemy pre-positions to predicted tile instead of direct chase
  - **Wrong prediction:** 2-turn confused state (render flicker), cooldown resets
- Spawn rate scales with floor number
- Infected tiles: enemy speed –1; uninfected tiles: enemy speed +1

---

## Loot — Memories (Code Snippets)

Scattered in neuron chambers. Player holds up to 3 splices; activate with 1/2/3 keys.

| Splice | Effect | Visual |
|--------|--------|--------|
| **EMP** | Stun all enemies within 5 tiles for 4 turns | Canvas white flash → scanline dissolve |
| **SPEED** | +1 movement/tick for 10 turns | Player glitch anim intensifies |
| **TENTACLES** | Grab all entities in 8 adjacent tiles on next move | Green SVG tendrils extend for 1 turn |

SplicePanel (React overlay) shows 3 slots with glitch-font labels and cooldown state.

---

## Boss — Overmind (Fractal Tree)

- Binary tree, 256 leaf nodes maximum, rendered across full canvas
- Root at center-top; edges are pulsing lines; nodes are glowing circles
- Vulnerable node cycles every 3s (highlighted); player attacks it to kill
- **On node death:** two child nodes spawn with randomized mutation:
  - **Logic Bomb** (30%): inverts player controls for 8 turns; HUD shows `[CONTROLS INVERTED]`
  - **Echo Attack** (30%): replays player's last 3 moves as homing projectiles
  - **None** (40%): straight damage node
- Win condition: all leaf nodes eliminated
- HUD shows nodes remaining (no health bar)

---

## Events — Firewall Breach

Trigger randomly every 3–7 floors. Duration 15–30s. EventLog warns 3s before controls flip.

| Event | Effect |
|-------|--------|
| **Static Flood** | Canvas noise overlay; vision radius reduced to 3 tiles |
| **Vision Cut** | 60% of tiles randomly blacked out, shuffles every 2s |
| **Controls Flip** | WASD/arrow axes inverted (up=down, left=right) |

---

## Audio — Web Audio API

All audio gated behind a single "click to start" prompt (browser autoplay policy).

### Synthwave Base Loop
- `OscillatorNode` (sawtooth) → `BiquadFilterNode` (lowpass ~800Hz) → `ConvolverNode` (reverb)
- Loops at ~120BPM

### Reactive Distortion (Infection)
- Every 10% infection milestone adds a `WaveShaperNode` overdrive tier
- At 100% infection: full noise/distortion on the base loop

### SFX
| Trigger | Sound |
|---------|-------|
| Splice activate | `OscillatorNode` sweep 200Hz→40Hz over 0.3s + gain spike (bass drop) |
| EMP use | White noise burst + canvas flash |
| Cornered (enemy on all 4 sides) | `OscillatorNode` 3kHz + fast tremolo + pitch rise; cuts on escape |
| Staircase descent | Synapse rewire tone (filtered noise sweep) |

---

## Implementation Phases

### Phase 1 — Engine
Grid generation, player SVG avatar, basic movement, infection BFS, map render

### Phase 2 — AI + Loot
Enemy pattern-learning loop, splice system, boss fractal tree, Overmind fight

### Phase 3 — Audio + Events
Web Audio API layer, synthwave loop, SFX, firewall breach events, polish passes

### Phase 4 — Multiplayer Co-op
2-player co-op via WebSockets. Node.js `server.js` manages rooms, shared map seed, and player state sync. Client detects `?room=<uuid>` in URL to join; without it, falls back to full offline single-player mode.

---

## Phase 4 — Multiplayer Design

### Architecture
- **Transport:** Node.js `server.js` using `ws` package (raw WebSockets, no Socket.io overhead)
- **Rooms:** server generates a UUID room on first connection; second player joins via `?room=<uuid>`
- **Map seed:** server picks a random integer seed, sends to both clients on join; each client runs the same deterministic `generator.js` (seeded LCG PRNG, seed passed as arg) — no map state transmitted over wire
- **Player sync:** each client sends `{ type: 'move', dx, dy }` on every move; server broadcasts to the other player; client applies remote player position update
- **Infection sync:** each client owns infection BFS from its own player; every 500ms it broadcasts `{ type: 'infection_update', tiles: [...] }` to server; server relays to peer; peer renders remote infection at 50% opacity and unions into its local mask
- **Boss sync:** boss node kills sent to server, broadcast to both; both clients apply the same tree mutation

### Server (`server.js`)
- Runs on port `3001` (configurable via `PORT` env var)
- On start: logs `Join URL: http://localhost:3001?room=<uuid>` for the first room
- Handles: `join`, `move`, `splice_use`, `boss_hit`, `infection_update` message types
- Max 2 clients per room; third connection gets `{ type: 'room_full' }` and is closed

### Client (`App.jsx` updates)
- On mount: reads `window.location.search` for `?room=<uuid>`
- If present: opens `WebSocket` to `ws://localhost:3001`, sends `{ type: 'join', room }`, enters co-op mode
- If absent: skips WS entirely, runs single-player loop unchanged
- Remote player rendered as a second wireframe avatar (magenta tint vs local cyan)
- Shared infection: remote infection tiles rendered at 50% opacity until merged

### New Dependencies
- Server: `ws` (WebSocket server)
- Client: none (uses native browser `WebSocket`)
- Dev: `nodemon` for server hot-reload

### Single-Player Fallback
All WS code is isolated in `src/net/socket.js`. If no room param: `socket.js` exports a no-op stub — all `socket.send()` calls silently drop. Game logic never checks connection state directly.

---

## Visual Style
- **Palette:** near-black background (`#050510`), neon cyan (`#00fff7`), hot magenta (`#ff00aa`), toxic green (`#39ff14`), amber (`#ffaa00`)
- **Font:** `Share Tech Mono` or `VT323` (Google Fonts) — glitch-styled via CSS `text-shadow` and `clip` animations
- **Scanlines:** subtle repeating CSS overlay on the canvas container

---

## Constraints & Non-Goals
- No persistence or save/load
- Max 2 players per room (co-op only, no spectators)
- No mobile/touch support
- No save/load system
- Audio: procedural only, no external audio files
