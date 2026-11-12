import { computeDestinationPoint } from 'geolib';
import type { Coordinates } from '../types';

// Function to compute random destination based on a given location and minimum and maximum Radius
// The distance is uniformly distributed between minDist and maxDist (in km)
export function computeRandomDestination(
  startingDestination: Coordinates,
  maxDist: number,
  minDist: number,
): Coordinates {
  const randomDistance = (minDist + Math.random() * (maxDist - minDist)) * 1000;
  const randomBearing = Math.random() * 360;

  const randomDestination = computeDestinationPoint(
    { latitude: startingDestination.lat, longitude: startingDestination.lng },
    randomDistance,
    randomBearing,
  );

  return {
    lat: randomDestination.latitude,
    lng: randomDestination.longitude,
  };
}
