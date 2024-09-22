import { useEffect, useState } from 'react';
import { parseSecondsToTfs } from '../utils/Parsers';
import DateTimePicker from './DateTimePicker';

function CountDownTimer() {
  const loadingDate = new Date(Date.now());
  const [targetDate, setTargetDate] = useState('2024-09-21');
  const [targetTime, setTargetTime] = useState('14:00');

  const [timerValue, setTimerValue] = useState(-1);

  useEffect(() => {
    if (timerValue > 0) {
      const interval = setInterval(() => {
        setTimerValue((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timerValue === 0) {
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
    </div>
  );
}

export default CountDownTimer;
