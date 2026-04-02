// src/game/engine.js
import { drawMap, drawFirewallEvents } from '../render/drawMap.js';
import { drawPlayer } from '../render/drawPlayer.js';
import { drawEnemies } from '../render/drawEnemies.js';
import { drawBoss } from '../render/drawBoss.js';
import { spreadInfection } from '../map/infection.js';
import { spawnEnemies, tickEnemy, isCornered } from '../entities/enemies.js';
import { tickVulnerable } from '../entities/boss.js';
import { createPRNG } from './prng.js';
import { setInfectionDistortion } from '../audio/tracks.js';
import { startCorneredScream, stopCorneredScream } from '../audio/sfx.js';
import { GRID_W, GRID_H, PHASE } from './constants.js';

let rafId = null;
let lastTurn = -1;
let prevInfPct = 0;
let wasCorned = false;

export function startLoop(stateRef, dispatch, ctx) {
  function loop(ts) {
    const state = stateRef.current;
    tick(state, dispatch, ts);
    render(state, ctx, ts);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(rafId); rafId = null; };
}

function tick(state, dispatch, ts) {
  if (state.phase !== PHASE.PLAY && state.phase !== PHASE.BOSS) return;

  // Glitch frames
  if (state.player.glitchFrames > 0) dispatch({ type: 'TICK_GLITCH' });

  // Infection spread — grows by 1 every 5 turns
  const radius = Math.floor(state.turn / 5);
  const newTiles = spreadInfection(
    state.player.x, state.player.y, radius,
    state.infectedTiles, state.map.neurons
  );
  if (newTiles.size !== state.infectedTiles.size) {
    dispatch({ type: 'SET_INFECTED_TILES', tiles: newTiles });
    const pct = newTiles.size / (GRID_W * GRID_H);
    const milestone = Math.floor(pct * 10);
    const prevMilestone = Math.floor(prevInfPct * 10);
    if (milestone > prevMilestone) setInfectionDistortion(pct);
    prevInfPct = pct;
  }

  // Per-turn logic (runs once per player move)
  if (state.turn !== lastTurn && state.turn > 0) {
    lastTurn = state.turn;

    // Spawn enemies on floor start
    if (state.enemies.length === 0 && state.phase === PHASE.PLAY) {
      const rng = createPRNG(state.seed ^ (state.floor * 0x9e3779b9));
      dispatch({ type: 'SET_ENEMIES', enemies: spawnEnemies(state.map, state.floor, rng) });
    }

    // Tick enemies
    if (state.enemies.length > 0) {
      const updated = state.enemies.map(e => tickEnemy(e, state.player, state.infectedTiles));
      dispatch({ type: 'SET_ENEMIES', enemies: updated });
    }

    // Tick boss vulnerable rotation
    if (state.boss) {
      const updatedBoss = tickVulnerable(state.boss, ts);
      if (updatedBoss !== state.boss) dispatch({ type: 'SET_BOSS', boss: updatedBoss });
    }

    // Expire firewall events
    const activeEvents = state.events.filter(ev => {
      const remaining = ev.durationTurns - (state.turn - ev.startTurn);
      return remaining > 0;
    });
    if (activeEvents.length !== state.events.length) {
      dispatch({ type: 'SET_EVENTS', events: activeEvents });
    }
  }

  // Cornered scream
  const cornered = isCornered(state.player, state.enemies);
  if (cornered && !wasCorned) startCorneredScream();
  if (!cornered && wasCorned) stopCorneredScream();
  wasCorned = cornered;
}

function render(state, ctx, ts) {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (state.phase === PHASE.BOSS && state.boss) {
    drawBoss(ctx, state.boss, ts);
  } else {
    drawMap(ctx, state.map, state.infectedTiles, ts);
    drawEnemies(ctx, state.enemies, ts);
  }

  drawPlayer(ctx, state.player, ts);
  drawFirewallEvents(ctx, state.events, state.player, ts);
}
