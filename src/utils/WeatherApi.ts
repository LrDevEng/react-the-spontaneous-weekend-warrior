import type { WeatherData } from '../types';

// Type guard for OpenWeatherMap current weather responses: true when the
// response carries weather data, false for API error objects ({ cod, message }).
// Checks the same thing as the JS version did (`weather` and `main` present
// and truthy), at runtime, so it is safe on whatever `res.json()` returned.
export function isWeatherData(value: unknown): value is WeatherData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'weather' in value &&
    Boolean(value.weather) &&
    'main' in value &&
    Boolean(value.main)
  );
}
