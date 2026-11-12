// Shared domain types

// Map position in decimal degrees
export type Coordinates = {
  lat: number;
  lng: number;
};

// Countdown time format strings, e.g. { days: '1', hours: '02', minutes: '03', seconds: '04' }
// A countdown that is not running is represented by all values being '-1'
export type CountDownTime = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

// Values of the native date and time inputs, e.g. { date: '2026-06-01', time: '10:00' }
export type DateTimeInput = {
  date: string;
  time: string;
};

// OpenWeatherMap current weather API (https://openweathermap.org/current),
// only the fields the app reads

export type WeatherCondition = {
  description: string;
};

export type WeatherData = {
  name: string;
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
};

// Returned instead of weather data when the request fails, e.g.
// { cod: 401, message: 'Invalid API key. ...' } or { cod: '404' }
export type WeatherApiError = {
  cod: number | string;
  message?: string;
};

export type WeatherApiResponse = WeatherData | WeatherApiError;
