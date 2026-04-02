// src/events/eventQueue.js
import { EVENT } from '../game/constants.js';

const EVENT_TYPES = [EVENT.STATIC_FLOOD, EVENT.VISION_CUT, EVENT.CONTROLS_FLIP];

export function scheduleNextEvent(rng) {
  const delayTurns = rng.nextInt(30, 70);
  const type = EVENT_TYPES[rng.nextInt(0, EVENT_TYPES.length - 1)];
  const durationTurns = rng.nextInt(15, 30);
  return { type, delayTurns, durationTurns, id: `${type}-${Math.random().toString(36).slice(2)}` };
}
