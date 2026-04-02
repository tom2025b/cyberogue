// src/audio/sfx.js
import { initAudio, getMasterGain } from './audioEngine.js';

export function playBassDrop() {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(1.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(getMasterGain());
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

export function playEMPFlash() {
  const ctx = initAudio();
  const size = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  src.connect(gain);
  gain.connect(getMasterGain());
  src.start();
}

let corneredNodes = null;

export function startCorneredScream() {
  if (corneredNodes) return;
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const tremolo = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(3000, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(4500, ctx.currentTime + 2);

  lfo.frequency.value = 18;
  lfoGain.gain.value = 0.4;
  tremolo.gain.value = 0.5;
  gain.gain.value = 0.28;

  lfo.connect(lfoGain);
  lfoGain.connect(tremolo.gain);
  osc.connect(tremolo);
  tremolo.connect(gain);
  gain.connect(getMasterGain());
  osc.start();
  lfo.start();
  corneredNodes = { osc, lfo };
}

export function stopCorneredScream() {
  if (!corneredNodes) return;
  try { corneredNodes.osc.stop(); corneredNodes.lfo.stop(); } catch (_) {}
  corneredNodes = null;
}

export function playStaircaseTone() {
  const ctx = initAudio();
  const size = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(600, ctx.currentTime);
  filt.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
  filt.Q.value = 5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.45, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(getMasterGain());
  src.start();
}
