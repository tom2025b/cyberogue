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
