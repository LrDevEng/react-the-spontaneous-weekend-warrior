import { describe, expect, test } from '@jest/globals';
import * as legacyGeoData from '../../__legacy__/utils/GeoData';
import * as legacyParsers from '../../__legacy__/utils/Parsers';
import { createSeededRandom, mockMathRandom } from '../../testUtils/random';
import * as liveGeoData from '../../utils/GeoData';
import * as liveParsers from '../../utils/Parsers';

// Back-to-back: frozen legacy JS (src/__legacy__) vs live code, same inputs

const day = 24 * 60 * 60;

function secondsInputs() {
  const random = createSeededRandom(2024);
  const edges = [
    -1, 0, 1, 9, 10, 59, 60, 61, 599, 600, 3599, 3600, 3601, 35_999, 36_000,
    86_399, 86_400, 86_401, 863_999, 864_000, 8_640_000, 31_536_000,
    1_000_000_000,
  ];
  const generated = Array.from({ length: 400 }, (element, i) => {
    // Mix of short, medium and very long durations
    const scale = [60, 3600, day, 100 * day][i % 4] ?? day;
    return Math.floor(random() * scale);
  });
  return [...edges, ...generated];
}

function dateInputs() {
  const random = createSeededRandom(77);
  const edges = [
    new Date(2026, 0, 1, 0, 0, 0, 0),
    new Date(2026, 11, 31, 23, 59, 59, 999),
    new Date(2028, 1, 29, 12, 30),
    new Date(1999, 8, 9, 9, 9, 9),
    new Date(2026, 5, 1, 10, 0, 0, 0),
  ];
  const min = new Date(1970, 0, 2).getTime();
  const max = new Date(2100, 0, 1).getTime();
  const generated = Array.from(
    { length: 400 },
    () => new Date(min + Math.floor(random() * (max - min))),
  );
  return [...edges, ...generated];
}

function kelvinInputs() {
  const random = createSeededRandom(5);
  const edges = [0, 273.15, 373.15, 300, 288.15, 263.2, 263.1, -10, 1e6];
  const generated = Array.from(
    { length: 300 },
    () => 200 + random() * 150, // realistic air temperatures
  );
  return [...edges, ...generated];
}

describe('B2B: utils/Parsers', () => {
  test('exports the same functions', () => {
    expect(Object.keys(liveParsers).sort()).toEqual(
      expect.arrayContaining(Object.keys(legacyParsers).sort()),
    );
  });

  test('parseSecondsToTfs', () => {
    for (const seconds of secondsInputs()) {
      expect([seconds, liveParsers.parseSecondsToTfs(seconds)]).toEqual([
        seconds,
        legacyParsers.parseSecondsToTfs(seconds),
      ]);
    }
  });

  test('parseDateToTfs', () => {
    for (const date of dateInputs()) {
      expect([date, liveParsers.parseDateToTfs(new Date(date))]).toEqual([
        date,
        legacyParsers.parseDateToTfs(new Date(date)),
      ]);
    }
  });

  test('kelvinToCelcius (exact floating point equality)', () => {
    for (const kelvin of kelvinInputs()) {
      expect([kelvin, liveParsers.kelvinToCelcius(kelvin)]).toEqual([
        kelvin,
        legacyParsers.kelvinToCelcius(kelvin),
      ]);
    }
  });
});

describe('B2B: utils/GeoData', () => {
  test('computeRandomDestination with identical Math.random sequences', () => {
    const inputs = createSeededRandom(99);
    const starts = [
      { lat: 48.223415757807906, lng: 16.390110631145077 },
      { lat: 0, lng: 0 },
      { lat: -33.8688, lng: 151.2093 },
      { lat: 64.1466, lng: -21.9426 },
    ];
    const edgeDistances: [number, number][] = [
      [0, 0],
      [0, 1],
      [10, 50],
      [25, 25],
      [0, 500],
      [1000, 2000],
    ];

    for (let i = 0; i < 300; i++) {
      const start = starts[i % starts.length] ?? { lat: 0, lng: 0 };
      const edge = edgeDistances[i];
      const minDist = edge ? edge[0] : Math.floor(inputs() * 200);
      const maxDist = edge ? edge[1] : minDist + inputs() * 300;
      const seed = Math.floor(inputs() * 1e9);

      const legacy = withSeededRandom(seed, () =>
        legacyGeoData.computeRandomDestination(start, maxDist, minDist),
      );
      const live = withSeededRandom(seed, () =>
        liveGeoData.computeRandomDestination(start, maxDist, minDist),
      );

      // Same result and same number of Math.random draws
      expect({ start, minDist, maxDist, ...live }).toEqual({
        start,
        minDist,
        maxDist,
        ...legacy,
      });
    }
  });

  test('computeRandomDestination with boundary random values', () => {
    const start = { lat: 48.223415757807906, lng: 16.390110631145077 };
    for (const values of [
      [0, 0],
      [0, 0.999999],
      [0.999999, 0],
      [0.5, 0.5],
      [0.25, 0.75],
    ]) {
      const legacy = withSequence(values, () =>
        legacyGeoData.computeRandomDestination(start, 50, 10),
      );
      const live = withSequence(values, () =>
        liveGeoData.computeRandomDestination(start, 50, 10),
      );
      expect(live).toEqual(legacy);
    }
  });
});

// Runs fn with Math.random replaced by a deterministic sequence and returns
// the result plus the number of random numbers drawn
function withSequence<T>(values: number[], fn: () => T, seed = 1) {
  const spy = mockMathRandom(values, seed);
  try {
    return { result: fn(), randomCalls: spy.mock.calls.length };
  } finally {
    spy.mockRestore();
  }
}

function withSeededRandom<T>(seed: number, fn: () => T) {
  return withSequence([], fn, seed);
}
