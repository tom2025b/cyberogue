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
        log: [`[TENTACLES: ${grabbed.length} grabbed]`, ...state.log].slice(0, 20),
      };
    }
    default:
      return state;
  }
}
