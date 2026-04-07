# CYBEROGUE

A procedurally generated cyberpunk roguelike built on React + Canvas. You are an icosahedron wireframe hacker jacking through infected neural networks while pattern-learning AI hunts you down and a fractal boss tries to eat your soul.

---

## INSTALL & RUN

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

**Tests:**
```bash
npm test
```

---

## CONTROLS

| Key | Action |
|-----|--------|
| `W` / `Arrow Up` | Move up |
| `S` / `Arrow Down` | Move down |
| `A` / `Arrow Left` | Move left |
| `D` / `Arrow Right` | Move right |
| `1` | Use splice slot 1 |
| `2` | Use splice slot 2 |
| `3` | Use splice slot 3 |

---

## WHAT YOU'RE DOING

You're navigating a 64×36 tile neural network map. Each floor is procedurally generated using seeded Poisson-disk node placement + Kruskal MST corridors. Find the staircase tile to descend to the next floor.

**The infection grows every 5 turns**, spreading from your position outward. Enemies standing on infected tiles move slower. You do not want to be the one causing the infection to spread to 100%.

---

## ENEMIES

Enemies are not dumb. They:
- Track your last 5 moves and **predict where you're going next**
- Move toward your predicted position, not your current one
- Get confused for 4 turns if hit by EMP (stumble around randomly)
- Slow down if standing on infected tiles
- Scale in HP and count per floor (`20 + floor×5` HP, `3 + floor×2` enemies)

If enemies surround all 4 of your cardinal directions simultaneously — you're **cornered**. The audio will tell you.

---

## SPLICES (ABILITIES)

Splices are weapons/abilities picked up as loot on the map. You can hold up to 3. Use them with keys `1`, `2`, `3`.

| Splice | What It Does |
|--------|-------------|
| **EMP.exe** | Stuns all enemies within 5 tiles for 4 turns (they wander randomly) |
| **SPEED.dll** | Doubles your movement speed for 10 turns |
| **TENTACLE.bin** | Instantly destroys all enemies in the 8 tiles directly adjacent to you |

---

## FIREWALL EVENTS

The network fights back. Random firewall events trigger during play:

| Event | Effect |
|-------|--------|
| **STATIC FLOOD** | Visual noise floods the screen |
| **VISION CUT** | Your view is cut — you're flying half-blind |
| **CONTROLS FLIP** | Your movement controls are inverted for 80 turns. Yes, really. |

Events expire after a set number of turns. Check the event log (bottom-left HUD) to see what's active.

---

## THE BOSS (OVERMIND)

When you reach the staircase deep enough in the network, the Overmind phase triggers. The boss is a **fractal tree of nodes**:

- One node is **vulnerable** (glowing) at a time — that's the one you need to hit
- Killing a node **spawns 2 children** that spread outward
- Children can have mutations:
  - `logic_bomb` — explodes on contact
  - `echo_attack` — creates a delayed clone attack
- The vulnerable node rotates every **3 seconds**
- Kill all nodes to win

---

## HUD ELEMENTS

| Element | Location | Shows |
|---------|----------|-------|
| HP bar | Top-left | Your current health |
| Infection % | Top-center | How much of the map is corrupted |
| Floor | Top-right | Current depth |
| Splice slots | Bottom-right | Your 3 held splices (empty = `—`) |
| Event log | Bottom-left | Last 20 game events |

---

## AUDIO

The game uses Web Audio API — **no files, all synthesized**.

- Synthwave loop plays during gameplay
- Infection distortion increases in **tiers** as the map corrupts (10% increments)
- **Bass drop** on EMP detonation
- **Cornered scream** loops while you're surrounded
- **Staircase tone** plays near the exit
- **EMP flash** SFX on ability use

If your browser blocks audio on load, click anywhere on the canvas to unlock it.

---

## TECH STACK

- **Vite + React 18** — UI overlays and state management
- **HTML5 Canvas** — all game rendering via RAF loop
- **Web Audio API** — procedural audio, no audio files
- **Seeded LCG PRNG** — deterministic map generation per seed+floor
- **Vitest** — 12 unit tests covering map gen, AI, splices, boss logic

---

## KNOWN GAPS (in progress)

- Enemy attacks don't reduce player HP yet
- Loot pickup collision not yet wired to the engine tick
- Floor transition trigger (staircase → next floor) not yet hooked up
- Boss phase trigger on staircase collision pending dispatch wiring
