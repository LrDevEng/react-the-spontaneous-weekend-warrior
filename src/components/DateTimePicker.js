// Component containig one html input element for setting a date and one html input element for setting a time
function DateTimePicker({ date, setDate, time, setTime, disabled }) {
  return (
    <div>
      {/* Date picker */}
      <input
        type="date"
        value={date}
        disabled={disabled}
        onChange={(event) => {
          setDate(event.currentTarget.value);
        }}
      />
      {/* Time picker */}
      <input
        type="time"
        value={time}
        disabled={disabled}
        onChange={(event) => {
          setTime(event.currentTarget.value);
        }}
      />
    </div>
  );
}

export default DateTimePicker;
