import { useEffect, useState } from 'react';
import styles from '../styles/Weather.module.css';
import { kelvinToCelcius } from '../utils/Parsers';

const openWeatherMapApiKey = process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY;

function Weather({ center }) {
  const [weather, setWeather] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(
    /** @type {string | null} */ (null),
  );

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
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
        setIsLoading(false);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.log(error);
        setFetchError(error.message);
        setIsLoading(false);
      });

    return () => controller.abort();
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
  // instead of weather data when the request fails
  if (!weather.weather || !weather.main) {
    return (
      <div className={styles.weather}>
        Weather unavailable: {weather.message || 'unknown error'}
      </div>
    );
  }

  return (
    <div className={styles.weather}>
      <table>
        <tbody>
          <tr>
            <th colSpan="2">Current weather in {weather.name}</th>
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
            <td>{weather.weather[0].description.toUpperCase()}</td>
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
