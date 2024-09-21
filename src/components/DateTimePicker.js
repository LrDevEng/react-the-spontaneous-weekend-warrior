function DateTimePicker({ date, setDate, time, setTime }) {
  return (
    <div>
      <input
        type="date"
        value={date}
        onChange={(event) => {
          setDate(event.currentTarget.value);
        }}
      />
      <input
        type="time"
        value={time}
        onChange={(event) => {
          setTime(event.currentTarget.value);
        }}
      />
    </div>
  );
}

export default DateTimePicker;
