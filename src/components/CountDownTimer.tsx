import { useEffect, useState } from 'react';
import styles from '../styles/CountDownTimer.module.css';
import { parseDateToTfs, parseSecondsToTfs } from '../utils/Parsers';
import CountDownCard from './CountDownCard';
import DateTimePicker from './DateTimePicker';

type Props = {
  // Called once when the countdown reaches 0
  handleElapsedTimer: () => void;
  // Called when a countdown is started
  handleTimerStart: () => void;
  // Called when a running countdown is reset
  handleTimerReset: () => void;
};

function CountDownTimer({
  handleElapsedTimer,
  handleTimerStart,
  handleTimerReset,
}: Props) {
  const loadingDate = parseDateToTfs(new Date(Date.now()));
  const [targetDate, setTargetDate] = useState(loadingDate.date);
  const [targetTime, setTargetTime] = useState(loadingDate.time);
  // Timestamp (ms) at which the running countdown ends, null when no countdown is running
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timerValue, setTimerValue] = useState(-1);

  // While a countdown is running, recompute the remaining seconds from the end time on every tick.
  // Deriving the value from the clock (instead of decrementing a counter) keeps the countdown
  // accurate even when the browser throttles timers in background tabs.
  useEffect(() => {
    if (endTime === null) return;
    // Narrowed copy for the tick closure
    const end = endTime;

    let elapsed = false;

    function tick() {
      // Guard so the elapsed callback runs only once: the interval is cleared by the
      // effect cleanup after setEndTime(null) re-renders, a tick may still fire before that
      if (elapsed) return;
      const remaining = Math.ceil((end - Date.now()) / 1000);
      if (remaining <= 0) {
        elapsed = true;
        setEndTime(null);
        setTimerValue(-1);
        handleElapsedTimer();
      } else {
        setTimerValue(remaining);
      }
    }

    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
  }, [endTime, handleElapsedTimer]);

  // Set end time to the target date and start the countdown
  function start() {
    const dateTarget = new Date(`${targetDate}T${targetTime}:00`);

    if (dateTarget.getTime() - Date.now() >= 1000) {
      setEndTime(dateTarget.getTime());
      handleTimerStart();
    } else {
      alert(
        'Please enter a point in time in the future to start the countdown. \n\nThank you.',
      );
    }
  }

  // Stop timer
  function stop() {
    setEndTime(null);
    setTimerValue(-1);
    handleTimerReset();
  }

  const isRunning = endTime !== null;

  return (
    <div className={styles.countDown}>
      <CountDownCard time={parseSecondsToTfs(timerValue)} />
      <div className={styles.picker}>
        <DateTimePicker
          date={targetDate}
          setDate={setTargetDate}
          time={targetTime}
          setTime={setTargetTime}
          disabled={isRunning}
        />
        {!isRunning && <button onClick={start}>Start Countdown</button>}
        {isRunning && <button onClick={stop}>Reset</button>}
      </div>
    </div>
  );
}

export default CountDownTimer;
