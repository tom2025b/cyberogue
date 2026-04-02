// src/game/prng.js
export function createPRNG(seed) {
  let s = (seed >>> 0) || 1;
  return {
    next() {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 0x100000000;
    },
    nextInt(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    nextBool(p = 0.5) {
      return this.next() < p;
    },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = this.nextInt(0, i);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
