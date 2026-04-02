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
      return { ...state, log: ['[FIREWALL: STATIC FLOOD]', ...state.log].slice(0, 20) };
    case EVENT.VISION_CUT:
      return { ...state, log: ['[FIREWALL: VISION CUT]', ...state.log].slice(0, 20) };
    default:
      return state;
  }
}
