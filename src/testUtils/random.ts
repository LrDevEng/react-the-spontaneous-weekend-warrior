import { jest } from '@jest/globals';

// Deterministic pseudo-random number generator (mulberry32), returns floats in [0, 1)
export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Replaces Math.random with a generator that returns `values` in order and
// then continues with a seeded sequence. Restored by `jest.restoreAllMocks()`
// (see setupTests.ts).
export function mockMathRandom(values: number[], seed = 1) {
  const fallback = createSeededRandom(seed);
  let index = 0;
  return jest.spyOn(Math, 'random').mockImplementation(() => {
    const value = index < values.length ? values[index] : fallback();
    index += 1;
    return value ?? fallback();
  });
}
