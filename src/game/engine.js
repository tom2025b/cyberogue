// src/game/engine.js
let rafId = null;

export function startLoop(stateRef, dispatch, ctx) {
  let lastTime = 0;

  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    const state = stateRef.current;
    tick(state, dispatch, dt);
    render(state, ctx, ts);
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafId);
}

function tick(state, dispatch, dt) {
  // Placeholder: infection, enemy AI, event ticks wired in later tasks
  if (state.player.glitchFrames > 0) {
    dispatch({ type: 'TICK_GLITCH' });
  }
}

function render(state, ctx, ts) {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Render functions wired in later tasks
}
