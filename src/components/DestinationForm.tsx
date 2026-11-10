import styles from '../styles/DestinationForm.module.css';

type Props = {
  // Distances in km: App's initial state holds numbers, after an edit the raw
  // input strings (possibly empty or invalid)
  minDist: string | number;
  setMinDist: (minDist: string) => void;
  maxDist: string | number;
  setMaxDist: (maxDist: string) => void;
  disabled: boolean;
};

function DestinationForm({
  minDist,
  setMinDist,
  maxDist,
  setMaxDist,
  disabled,
}: Props) {
  return (
    <div className={styles.destination}>
      <div className={styles.center}>
        <label>
          Minimum distance
          <input
            type="number"
            min="0"
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
            min="0"
            value={maxDist}
            onChange={(event) => setMaxDist(event.currentTarget.value)}
            disabled={disabled}
          />
          km
        </label>
      </div>
    </div>
  );
}

export default DestinationForm;
