// src/App.jsx
import { useReducer, useRef, useEffect } from 'react';
import { makeInitialState, gameReducer } from './game/state.js';
import { startLoop } from './game/engine.js';
import { CANVAS_W, CANVAS_H } from './game/constants.js';

export default function App() {
  const canvasRef = useRef(null);
  const [state, dispatch] = useReducer(gameReducer, null, makeInitialState);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const stop = startLoop(stateRef, dispatch, ctx);
    return stop;
  }, []);

  return (
    <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', background: '#050510' }}
      />
    </div>
  );
}
