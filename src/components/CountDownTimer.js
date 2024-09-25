import { useEffect, useState } from 'react';
import { parseDateToTfs, parseSecondsToTfs } from '../utils/Parsers';
import DateTimePicker from './DateTimePicker';

function CountDownTimer({ handleElapsedTimer }) {
  const loadingDate = parseDateToTfs(new Date(Date.now()));
  const [targetDate, setTargetDate] = useState(loadingDate.date);
  const [targetTime, setTargetTime] = useState(loadingDate.time);
  const [timerValue, setTimerValue] = useState(-1);

  // Attach interval on change of timerValue
  // Effect will reduce timer value every second until it reaches a value of 0
  useEffect(() => {
    if (timerValue > 0) {
      const interval = setInterval(() => {
        setTimerValue((prevTimerValue) => prevTimerValue - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timerValue === 0) {
      handleElapsedTimer();
      // console.log('Timer elapsed.');
    }
  }, [timerValue, handleElapsedTimer]);

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
    </div>
  );
}

export default CountDownTimer;
