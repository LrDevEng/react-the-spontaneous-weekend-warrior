// Environment variables used by the app. CRA inlines REACT_APP_* values into
// the client bundle at build time (set them in .env.local)
declare namespace NodeJS {
  interface ProcessEnv {
    // OpenWeatherMap API key, undefined when not configured
    REACT_APP_OPEN_WEATHER_MAP_API_KEY?: string;
  }
}
