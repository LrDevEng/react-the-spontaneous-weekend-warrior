import { describe, expect, test } from '@jest/globals';
import { computeDestinationPoint, getDistance } from 'geolib';
import { createSeededRandom, mockMathRandom } from '../../testUtils/random';
import { computeRandomDestination } from '../../utils/GeoData';

// Fixed start location of the app (The Social Hub, Vienna)
const start = { lat: 48.223415757807906, lng: 16.390110631145077 };
const startGeolib = { latitude: start.lat, longitude: start.lng };

// computeDestinationPoint uses an earth radius of 6371 km, getDistance one of
// 6378.137 km, so measured distances are up to ~0.12 % longer
const radiusRatio = 6378137 / 6371000;

function distanceKm(point: { lat: number; lng: number }) {
  return (
    getDistance(
      startGeolib,
      { latitude: point.lat, longitude: point.lng },
      0.01,
    ) / 1000
  );
}

describe('computeRandomDestination(start, maxDist, minDist)', () => {
  test('exact result with Math.random mocked (1st draw: distance, 2nd draw: bearing)', () => {
    mockMathRandom([0.5, 0.25]);
    // distance = (10 + 0.5 * (50 - 10)) km = 30 km, bearing = 0.25 * 360 = 90°
    expect(computeRandomDestination(start, 50, 10)).toEqual({
      lat: 48.222704731464574,
      lng: 16.79506821890465,
    });
  });

  test('matches geolib.computeDestinationPoint for the drawn distance and bearing', () => {
    mockMathRandom([0.8, 0.6]);
    const expected = computeDestinationPoint(
      startGeolib,
      (5 + 0.8 * (20 - 5)) * 1000,
      0.6 * 360,
    );
    expect(computeRandomDestination(start, 20, 5)).toEqual({
      lat: expected.latitude,
      lng: expected.longitude,
    });
  });

  test('Math.random() = 0 gives minDist due north', () => {
    mockMathRandom([0, 0]);
    expect(computeRandomDestination(start, 50, 10)).toEqual({
      lat: 48.313347918399785,
      lng: 16.390110631145077,
    });
  });

  test('uses Math.random exactly twice per call', () => {
    const spy = mockMathRandom([0.1, 0.2]);
    computeRandomDestination(start, 50, 10);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('returns only { lat, lng }', () => {
    mockMathRandom([0.3, 0.7]);
    const result = computeRandomDestination(start, 50, 10);
    expect(Object.keys(result).sort()).toEqual(['lat', 'lng']);
    expect(typeof result.lat).toBe('number');
    expect(typeof result.lng).toBe('number');
  });

  test('distance always lies within [minDist, maxDist] for many random draws', () => {
    const random = createSeededRandom(42);
    mockMathRandom([], 7);
    for (let i = 0; i < 300; i++) {
      const minDist = Math.floor(random() * 100);
      const maxDist = minDist + Math.floor(random() * 200);
      const distance = distanceKm(
        computeRandomDestination(start, maxDist, minDist),
      );
      expect(distance).toBeGreaterThanOrEqual(minDist - 0.001);
      expect(distance).toBeLessThanOrEqual(maxDist * radiusRatio + 0.001);
    }
  });

  test('minDist === maxDist gives exactly that distance', () => {
    mockMathRandom([], 3);
    for (let i = 0; i < 50; i++) {
      const destination = computeRandomDestination(start, 25, 25);
      expect(distanceKm(destination) / radiusRatio).toBeCloseTo(25, 2);
    }
  });

  test('minDist === maxDist === 0 returns the start location', () => {
    mockMathRandom([0.42, 0.9]);
    const destination = computeRandomDestination(start, 0, 0);
    expect(destination.lat).toBeCloseTo(start.lat, 10);
    expect(destination.lng).toBeCloseTo(start.lng, 10);
  });

  test('works from any start location', () => {
    mockMathRandom([0, 0.5]);
    // distance = minDist = 100 km, bearing = 180° (due south of 0,0)
    const destination = computeRandomDestination({ lat: 0, lng: 0 }, 200, 100);
    expect(destination.lat).toBeCloseTo(-0.8993, 4);
    expect(destination.lng).toBeCloseTo(0, 10);
  });
});
