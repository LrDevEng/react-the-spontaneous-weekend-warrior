import { useEffect, useState } from 'react';
import { parseDateToTfs, parseSecondsToTfs } from '../utils/Parsers';
import DateTimePicker from './DateTimePicker';
import Map from './Map';

const openWeatherMapApiKey = process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY;

function CountDownTimer() {
  // --- Map Definition -----------------------------------------------
  const [center, setCenter] = useState({
    lat: 48.223415757807906,
    lng: 16.390110631145077,
  });
  // --- End of Map Definition ----------------------------------------

  // --- Weather Api Definition ---------------------------------------
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
  // --- End of Weather Api Definition --------------------------------

  // --- Timer Definition ---------------------------------------------
  const loadingDate = parseDateToTfs(new Date(Date.now()));
  const [targetDate, setTargetDate] = useState(loadingDate[0]);
  const [targetTime, setTargetTime] = useState(loadingDate[1]);

  const [timerValue, setTimerValue] = useState(-1);
  useEffect(() => {
    if (timerValue > 0) {
      const interval = setInterval(() => {
        setTimerValue((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timerValue === 0) {
      setCenter({ lat: 47.223415757807906, lng: 15.390110631145077 });
      console.log('Timer elapsed.');
    }
  }, [timerValue]);

  function start() {
    const dateNow = new Date(Date.now());
    const dateTarget = new Date(`${targetDate}T${targetTime}:00`);
    const diffInSeconds = Math.floor((dateTarget - dateNow) / 1000);

    if (diffInSeconds > 0) {
      setTimerValue(Math.floor((dateTarget - dateNow) / 1000));
    }
  }

  function stop() {
    setTimerValue(-1);
  }
  // --- End of Timer Definition --------------------------------------

  return (
    <div>
      <DateTimePicker
        date={targetDate}
        setDate={setTargetDate}
        time={targetTime}
        setTime={setTargetTime}
      />
      {timerValue <= 0 && <button onClick={start}>Start Countdown</button>}
      {timerValue > 0 && <button onClick={stop}>Stop</button>}
      <p>{parseSecondsToTfs(timerValue)}</p>
      <p>{weather.weather[0].main}</p>
      <Map center={center} zoom={13} popUp="The Social Hub" />
    </div>
  );
}

export default CountDownTimer;
