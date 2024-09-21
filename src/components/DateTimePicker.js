import { useState } from 'react';

function DateTimePicker() {
  const [date, setDate] = useState('2024-06-06');
  const [time, setTime] = useState('08:00');

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
