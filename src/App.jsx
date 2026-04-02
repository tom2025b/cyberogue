// src/App.jsx
import { useReducer, useRef, useEffect, useState } from 'react';
import { makeInitialState, gameReducer } from './game/state.js';
import { startLoop } from './game/engine.js';
import { attachInput } from './game/input.js';
import { startSynthwave, setInfectionDistortion } from './audio/tracks.js';
import { playBassDrop, playEMPFlash } from './audio/sfx.js';
import { CANVAS_W, CANVAS_H, GRID_W, GRID_H } from './game/constants.js';
import HUD from './ui/HUD.jsx';
import SplicePanel from './ui/SplicePanel.jsx';
import EventLog from './ui/EventLog.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const [state, dispatch] = useReducer(gameReducer, null, makeInitialState);
  const stateRef = useRef(state);
  const [audioStarted, setAudioStarted] = useState(false);
  const prevLogRef = useRef([]);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    return startLoop(stateRef, dispatch, ctx);
  }, []);

  useEffect(() => attachInput(dispatch), []);

  useEffect(() => {
    if (!audioStarted) return;
    const pct = state.infectedTiles.size / (GRID_W * GRID_H);
    setInfectionDistortion(pct);
  }, [state.infectedTiles.size, audioStarted]);

  useEffect(() => {
    if (!audioStarted) return;
    const newest = state.log[0];
    if (newest && newest !== prevLogRef.current[0]) {
      if (newest.includes('EMP')) playEMPFlash();
      else if (newest.includes('SPEED') || newest.includes('TENTACLES')) playBassDrop();
    }
    prevLogRef.current = state.log;
  }, [state.log, audioStarted]);

  return (
    <div style={{
      position: 'relative', width: CANVAS_W, height: CANVAS_H,
      margin: '0 auto', overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block' }}
      />
      <HUD
        player={state.player}
        floor={state.floor}
        infectedTiles={state.infectedTiles}
        mapTileCount={GRID_W * GRID_H}
      />
      <SplicePanel splices={state.player.splices} />
      <EventLog lines={state.log} />

      {!audioStarted && (
        <div
          onClick={() => { startSynthwave(); setAudioStarted(true); }}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,5,16,0.93)', cursor: 'pointer',
          }}
        >
          <div style={{
            fontFamily: "'VT323', monospace", fontSize: 44,
            color: '#00fff7', textShadow: '0 0 28px #00fff7',
            letterSpacing: 7, marginBottom: 18,
          }}>
            CYBEROGUE
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: 15,
            color: '#00fff7', opacity: 0.65, letterSpacing: 4,
          }}>
            [ CLICK TO JACK IN ]
          </div>
          <div style={{
            marginTop: 34, fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11, color: '#00fff733', letterSpacing: 2,
          }}>
            WASD / ARROWS — MOVE &nbsp;|&nbsp; 1 2 3 — SPLICE
          </div>
        </div>
      )}
    </div>
  );
}
