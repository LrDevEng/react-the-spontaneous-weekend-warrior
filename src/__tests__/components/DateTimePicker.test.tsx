import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import DateTimePicker from '../../components/DateTimePicker';

function renderPicker(disabled: boolean) {
  const setDate = jest.fn();
  const setTime = jest.fn();
  render(
    <DateTimePicker
      date="2026-06-01"
      setDate={setDate}
      time="10:00"
      setTime={setTime}
      disabled={disabled}
    />,
  );
  return {
    setDate,
    setTime,
    dateInput: screen.getByDisplayValue('2026-06-01'),
    timeInput: screen.getByDisplayValue('10:00'),
  };
}

describe('DateTimePicker', () => {
  test('renders a date input and a time input with the given values', () => {
    const { dateInput, timeInput } = renderPicker(false);
    expect(dateInput).toHaveAttribute('type', 'date');
    expect(timeInput).toHaveAttribute('type', 'time');
    expect(dateInput).toHaveValue('2026-06-01');
    expect(timeInput).toHaveValue('10:00');
    expect(dateInput).toBeEnabled();
    expect(timeInput).toBeEnabled();
  });

  test('propagates date changes via setDate(value)', () => {
    const { dateInput, setDate, setTime } = renderPicker(false);
    fireEvent.change(dateInput, { target: { value: '2026-07-15' } });
    expect(setDate).toHaveBeenCalledTimes(1);
    expect(setDate).toHaveBeenCalledWith('2026-07-15');
    expect(setTime).not.toHaveBeenCalled();
  });

  test('propagates time changes via setTime(value)', () => {
    const { timeInput, setDate, setTime } = renderPicker(false);
    fireEvent.change(timeInput, { target: { value: '18:30' } });
    expect(setTime).toHaveBeenCalledTimes(1);
    expect(setTime).toHaveBeenCalledWith('18:30');
    expect(setDate).not.toHaveBeenCalled();
  });

  test('is a controlled component: the value comes from props', () => {
    const { dateInput } = renderPicker(false);
    fireEvent.change(dateInput, { target: { value: '2026-07-15' } });
    expect(dateInput).toHaveValue('2026-06-01');
  });

  test('disables both inputs when disabled', () => {
    const { dateInput, timeInput } = renderPicker(true);
    expect(dateInput).toBeDisabled();
    expect(timeInput).toBeDisabled();
  });
});
