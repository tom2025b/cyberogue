// src/audio/audioEngine.js
let _ctx = null;
let _masterGain = null;

export function getAudioContext() { return _ctx; }
export function getMasterGain() { return _masterGain; }

export function initAudio() {
  if (_ctx) return _ctx;
  _ctx = new (window.AudioContext || window.webkitAudioContext)();
  _masterGain = _ctx.createGain();
  _masterGain.gain.value = 0.65;
  _masterGain.connect(_ctx.destination);
  return _ctx;
}

export function createReverb(ctx) {
  const conv = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * 1.5;
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  conv.buffer = buffer;
  return conv;
}
