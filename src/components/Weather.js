import { useEffect, useState } from 'react';

const openWeatherMapApiKey = process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY;

function Weather({ center }) {
  const [weather, setWeather] = useState({
    weather: [{ main: 'Not available' }],
  });
  useEffect(() => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${openWeatherMapApiKey}`,
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setWeather(data);
      })
      .catch((error) => console.log(error));
  }, [center]);

  return (
    <div>
      <p>{weather.weather[0].main}</p>
    </div>
  );
}

export default Weather;
