// tests/prng.test.js
import { createPRNG } from '../src/game/prng.js';

describe('createPRNG', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createPRNG(42);
    const b = createPRNG(42);
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
  });

  it('produces different sequences for different seeds', () => {
    const a = createPRNG(1);
    const b = createPRNG(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('nextInt returns value in [min, max] inclusive', () => {
    const rng = createPRNG(99);
    for (let i = 0; i < 50; i++) {
      const v = rng.nextInt(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
});
