import { useEffect, useState } from 'react';
import DateTimePicker from './DateTimePicker';

function CountDownTimer() {
  const [targetDate, setTargetDate] = useState('2024-06-06');
  const [targetTime, setTargetTime] = useState('08:00');

  const [timerValue, setTimerValue] = useState(0);

  useEffect(() => {
    if (timerValue > 0) {
      const interval = setInterval(() => {
        setTimerValue((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerValue]);

  function start() {
    setTimerValue(1000);
  }

  function stop() {
    setTimerValue(0);
  }

  return (
    <div>
      <DateTimePicker
        date={targetDate}
        setDate={setTargetDate}
        time={targetTime}
        setTime={setTargetTime}
      />
      {timerValue === 0 && <button onClick={start}>Start Countdown</button>}
      {timerValue > 0 && <button onClick={stop}>Stop</button>}
      <p>{timerValue}</p>
    </div>
  );
}

export default CountDownTimer;
