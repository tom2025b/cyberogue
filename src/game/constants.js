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
