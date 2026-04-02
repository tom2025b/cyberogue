// src/game/state.js
import { generateMap } from '../map/generator.js';
import { killNode } from '../entities/boss.js';
import { executeSplice } from '../loot/splice.js';
import { PHASE } from './constants.js';

export function makeInitialState(arg) {
  const seed = (typeof arg === 'number' && arg > 0)
    ? arg
    : Math.floor(Math.random() * 0xFFFFFF) + 1;
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
      splices: [],
      moveHistory: [],
      glitchFrames: 0,
      inverted: false,
      invertedTurns: 0,
      speedBoostTurns: 0,
    },
    infectedTiles: new Set(),
    enemies: [],
    boss: null,
    events: [],
    turn: 0,
    log: [],
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'MOVE_PLAYER': {
      const { dx, dy } = action;
      const { player } = state;
      const effectiveDx = player.inverted ? -dx : dx;
      const effectiveDy = player.inverted ? -dy : dy;
      const nx = Math.max(0, player.x + effectiveDx);
      const ny = Math.max(0, player.y + effectiveDy);
      const history = [...player.moveHistory, { dx: effectiveDx, dy: effectiveDy }].slice(-5);
      return {
        ...state,
        player: {
          ...player,
          x: nx, y: ny,
          moveHistory: history,
          glitchFrames: 3,
          invertedTurns: Math.max(0, player.invertedTurns - 1),
          inverted: player.invertedTurns > 1,
          speedBoostTurns: Math.max(0, player.speedBoostTurns - 1),
          speed: player.speedBoostTurns > 1 ? 2 : 1,
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

    case 'SET_EVENTS':
      return { ...state, events: action.events };

    case 'ADD_LOG':
      return { ...state, log: [action.line, ...state.log].slice(0, 20) };

    case 'ADD_SPLICE': {
      const splices = [...state.player.splices, action.splice].slice(-3);
      return { ...state, player: { ...state.player, splices } };
    }

    case 'USE_SPLICE': {
      const splice = state.player.splices[action.index];
      if (!splice) return state;
      const next = executeSplice(splice.type, state);
      const splices = next.player.splices.filter((_, i) => i !== action.index);
      return { ...next, player: { ...next.player, splices } };
    }

    case 'APPLY_INVERT':
      return {
        ...state,
        player: { ...state.player, inverted: true, invertedTurns: 8 },
        log: ['[CONTROLS INVERTED]', ...state.log].slice(0, 20),
      };

    case 'APPLY_SPEED':
      return {
        ...state,
        player: { ...state.player, speedBoostTurns: 10, speed: 2 },
      };

    case 'ADD_EVENT': {
      const ev = { ...action.event, startTurn: state.turn };
      return { ...state, events: [...state.events, ev] };
    }

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

    case 'TICK_GLITCH':
      return {
        ...state,
        player: { ...state.player, glitchFrames: Math.max(0, state.player.glitchFrames - 1) },
      };

    case 'BOSS_KILL_NODE': {
      if (!state.boss) return state;
      const updatedBoss = killNode(state.boss, action.id);
      return {
        ...state,
        boss: updatedBoss,
        log: [`[NODE ${action.id} TERMINATED]`, ...state.log].slice(0, 20),
      };
    }

    case 'ENTER_BOSS': {
      const { createBoss } = action;
      return { ...state, phase: PHASE.BOSS, boss: createBoss() };
    }

    default:
      return state;
  }
}
