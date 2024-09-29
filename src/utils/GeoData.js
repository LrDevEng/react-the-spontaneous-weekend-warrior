import { computeDestinationPoint } from 'geolib';

// Function to compute random destination based on a given location and minimum and maximum Radius
export function computeRandomDestination(
  startingDestination,
  maxDist,
  minDist,
) {
  const randomDistance = Math.max(
    Math.random() * maxDist * 1000,
    minDist * 1000,
  );
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
