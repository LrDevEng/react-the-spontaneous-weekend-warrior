import { useEffect, useState } from 'react';
import { parseDateToTfs, parseSecondsToTfs } from '../utils/Parsers';
import DateTimePicker from './DateTimePicker';
import Map from './Map';

const openWeatherMapApiKey = process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY;

function CountDownTimer() {
  // --- Map Definition -----------------------------------------------
  // Inital state The Social Hub Vienna
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
  const [targetDate, setTargetDate] = useState(loadingDate.date);
  const [targetTime, setTargetTime] = useState(loadingDate.time);
  const [timerValue, setTimerValue] = useState(-1);

  // Attach interval on change of timerValue
  // Effect will reduce timer value every second until it reaches a value of 0
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

  // Set timer to delta between current and target date
  // Start timer
  function start() {
    const dateNow = new Date(Date.now());
    const dateTarget = new Date(`${targetDate}T${targetTime}:00`);
    const diffInSeconds = Math.floor((dateTarget - dateNow) / 1000);

    if (diffInSeconds > 0) {
      setTimerValue(Math.floor((dateTarget - dateNow) / 1000));
    } else {
      alert(
        'Please enter a point in time in the future to start the countdown. \n\nThank you.',
      );
    }
  }

  // Stop timer
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
      <p>{parseSecondsToTfs(timerValue).seconds}</p>
      <p>{weather.weather[0].main}</p>
      <Map center={center} zoom={13} popUp="The Social Hub" />
    </div>
  );
}

export default CountDownTimer;
