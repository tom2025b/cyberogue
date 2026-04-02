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

describe('nextBool', () => {
  it('returns booleans', () => {
    const rng = createPRNG(55);
    for (let i = 0; i < 20; i++) {
      expect(typeof rng.nextBool()).toBe('boolean');
    }
  });

  it('with p=1 always returns true', () => {
    const rng = createPRNG(1);
    expect(rng.nextBool(1)).toBe(true);
  });

  it('with p=0 always returns false', () => {
    const rng = createPRNG(1);
    expect(rng.nextBool(0)).toBe(false);
  });
});

describe('shuffle', () => {
  it('returns all original elements', () => {
    const rng = createPRNG(42);
    const arr = [1, 2, 3, 4, 5];
    const result = rng.shuffle(arr);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the input array', () => {
    const rng = createPRNG(42);
    const arr = [1, 2, 3, 4, 5];
    rng.shuffle(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});
