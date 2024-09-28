import styles from '../styles/DestinationForm.module.css';

function DestinationForm({
  minDist,
  setMinDist,
  maxDist,
  setMaxDist,
  disabled,
}) {
  return (
    <div className={styles.destination}>
      <label>
        Minimum distance
        <input
          type="number"
          value={minDist}
          onChange={(event) => setMinDist(event.currentTarget.value)}
          disabled={disabled}
        />
        km
      </label>
      <label>
        Maximum distance
        <input
          type="number"
          value={maxDist}
          onChange={(event) => setMaxDist(event.currentTarget.value)}
          disabled={disabled}
        />
        km
      </label>
    </div>
  );
}

export default DestinationForm;
