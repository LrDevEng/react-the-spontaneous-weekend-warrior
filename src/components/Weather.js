import { useEffect, useState } from 'react';
import styles from '../styles/Weather.module.css';
import { kelvinToCelcius } from '../utils/Parsers';

const openWeatherMapApiKey = process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY;

function Weather({ center }) {
  const [weather, setWeather] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch weather information from API when map location changes
  useEffect(() => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${openWeatherMapApiKey}`,
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setWeather(data);
        setIsLoading(false);
      })
      .catch((error) => console.log(error));
  }, [center]);

  if (isLoading) {
    return <div>Loading ...</div>;
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
