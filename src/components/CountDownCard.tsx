import styles from '../styles/CountDownCard.module.css';
import type { CountDownTime } from '../types';

type Props = {
  // Values are '-1' while no countdown is running
  time: CountDownTime;
};

function CountDownCard({ time }: Props) {
  // Idle countdown ('-1'). Number() is exactly the conversion the relational
  // comparison `time.seconds < 0` applied to the string implicitly, so every
  // input behaves as before ('' -> 0, '-0' -> -0 and 'abc' -> NaN are not idle)
  const isIdle = Number(time.seconds) < 0;

  return (
    <div className={styles.card}>
      <table>
        <tbody>
          <tr>
            <th>Days</th>
            <th>Hours</th>
            <th>Minutes</th>
            <th>Seconds</th>
          </tr>
          {isIdle ? (
            <tr>
              <td>-</td>
              <td>--</td>
              <td>--</td>
              <td>--</td>
            </tr>
          ) : (
            <tr>
              <td>{time.days}</td>
              <td>{time.hours}</td>
              <td>{time.minutes}</td>
              <td>{time.seconds}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CountDownCard;
