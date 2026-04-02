// src/audio/tracks.js
import { initAudio, getMasterGain, createReverb } from './audioEngine.js';

let loopNodes = null;
let distortionNode = null;

function makeDistortionCurve(amount) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function startSynthwave() {
  if (loopNodes) return;
  const ctx = initAudio();

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 110;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 2;

  distortionNode = ctx.createWaveShaper();
  distortionNode.curve = makeDistortionCurve(0);
  distortionNode.oversample = '2x';

  const reverb = createReverb(ctx);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.25;
  const dry = ctx.createGain();
  dry.gain.value = 0.75;

  // LFO for arpeggio movement
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 2;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 35;

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.connect(filter);
  filter.connect(distortionNode);
  distortionNode.connect(dry);
  distortionNode.connect(reverb);
  reverb.connect(reverbGain);
  dry.connect(getMasterGain());
  reverbGain.connect(getMasterGain());

  osc.start();
  lfo.start();
  loopNodes = { osc, lfo };
}

export function setInfectionDistortion(level) {
  if (!distortionNode) return;
  distortionNode.curve = makeDistortionCurve(level * 380);
}

export function stopSynthwave() {
  if (!loopNodes) return;
  loopNodes.osc.stop();
  loopNodes.lfo.stop();
  loopNodes = null;
}
