import styles from '../styles/CountDownCard.module.css';

function CountDownCard({ time }) {
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
          {time.seconds < 0 ? (
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
