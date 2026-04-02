// src/loot/memories.js
import { SPLICE, COLORS } from '../game/constants.js';

export const MEMORY_DEFS = [
  { type: SPLICE.EMP,       label: 'EMP.exe',       color: COLORS.AMBER },
  { type: SPLICE.SPEED,     label: 'SPEED.dll',     color: COLORS.CYAN  },
  { type: SPLICE.TENTACLES, label: 'TENTACLE.bin',  color: COLORS.GREEN },
];

export function randomMemory(rng) {
  return { ...MEMORY_DEFS[rng.nextInt(0, MEMORY_DEFS.length - 1)] };
}
