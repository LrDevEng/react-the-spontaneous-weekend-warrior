import { useEffect, useState } from 'react';
import styles from '../styles/Weather.module.css';
import type { Coordinates, WeatherApiResponse } from '../types';
import { kelvinToCelcius } from '../utils/Parsers';
import { isWeatherData } from '../utils/WeatherApi';

// NOTE: not checked, a missing key ends up as `appid=undefined` in the URL
// and the API answers with an error object
const openWeatherMapApiKey = process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY;

// fetch() and res.json() reject with Error-like objects (Error, TypeError,
// SyntaxError, DOMException); their name and message are read without
// relying on a specific class
type ErrorLike = { name?: unknown; message?: unknown };

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === 'object' && value !== null;
}

type Props = {
  center: Coordinates;
};

function Weather({ center }: Props) {
  // Last API response, null until the first one arrives
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch weather information from API when map location changes
  useEffect(() => {
    // Abort the request when the location changes again (or on unmount),
    // so a slow response for an old location can't overwrite a newer one
    const controller = new AbortController();
    setIsLoading(true);
    setFetchError(null);

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${openWeatherMapApiKey}`,
      { signal: controller.signal },
    )
      // The body is either weather data or an API error object, told apart
      // with isWeatherData() when rendering
      .then((res) => res.json() as Promise<WeatherApiResponse>)
      .then((data) => {
        setWeather(data);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (isErrorLike(error) && error.name === 'AbortError') return;
        console.log(error);
        setFetchError(
          isErrorLike(error) && typeof error.message === 'string'
            ? error.message
            : null,
        );
        setIsLoading(false);
      });

    return () => controller.abort();
    // NOTE: keyed on the center object identity, a new object with equal
    // coordinates refetches
  }, [center]);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  // Network failure (offline, blocked request, invalid JSON, ...)
  if (fetchError) {
    return (
      <div className={styles.weather}>Weather unavailable: {fetchError}</div>
    );
  }

  // The API returns an error object (e.g. { cod: 401, message: '...' })
  // instead of weather data when the request fails.
  // `||` on purpose: an empty message also falls back to 'unknown error'
  if (!isWeatherData(weather)) {
    return (
      <div className={styles.weather}>
        Weather unavailable: {weather?.message || 'unknown error'}
      </div>
    );
  }

  // NOTE: the API always sends at least one weather condition. Unlike the JS
  // version, which crashed on an empty `weather` array, the cell stays empty
  const description = weather.weather[0]?.description.toUpperCase();

  return (
    <div className={styles.weather}>
      <table>
        <tbody>
          <tr>
            <th colSpan={2}>Current weather in {weather.name}</th>
          </tr>
          <tr>
            <td>Latitude</td>
            <td>{center.lat}</td>
          </tr>
          <tr>
            <td>Longitude</td>
            <td>{center.lng}</td>
          </tr>
          <tr>
            <td>Weather</td>
            <td>{description}</td>
          </tr>
          <tr>
            <td>Temperature °C</td>
            <td>{Math.round(kelvinToCelcius(weather.main.temp) * 10) / 10}</td>
          </tr>
          <tr>
            <td>Feels like °C</td>
            <td>
              {Math.round(kelvinToCelcius(weather.main.feels_like) * 10) / 10}
            </td>
          </tr>
          <tr>
            <td>Humidity %</td>
            <td>{weather.main.humidity}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Weather;
