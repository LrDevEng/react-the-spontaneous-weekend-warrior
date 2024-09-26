function DestinationForm({
  minDist,
  setMinDist,
  maxDist,
  setMaxDist,
  disabled,
}) {
  return (
    <div>
      <input
        type="number"
        value={minDist}
        onChange={(event) => setMinDist(event.currentTarget.value)}
        disabled={disabled}
      />
      <input
        type="number"
        value={maxDist}
        onChange={(event) => setMaxDist(event.currentTarget.value)}
        disabled={disabled}
      />
    </div>
  );
}

export default DestinationForm;
