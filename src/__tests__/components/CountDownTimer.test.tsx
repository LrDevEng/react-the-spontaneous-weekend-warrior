import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CountDownTimer from '../../components/CountDownTimer';
import {
  advance,
  fixedNow,
  installFakeClock,
  jumpClock,
} from '../../testUtils/time';

const alertMessage =
  'Please enter a point in time in the future to start the countdown. \n\nThank you.';

let alertSpy: jest.Spied<typeof window.alert>;

beforeEach(() => {
  alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
});

function renderTimer() {
  const handleElapsedTimer = jest.fn();
  const handleTimerStart = jest.fn();
  const handleTimerReset = jest.fn();
  render(
    <CountDownTimer
      handleElapsedTimer={handleElapsedTimer}
      handleTimerStart={handleTimerStart}
      handleTimerReset={handleTimerReset}
    />,
  );
  return { handleElapsedTimer, handleTimerStart, handleTimerReset };
}

function dateInput() {
  return screen.getByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
}

function timeInput() {
  return screen.getByDisplayValue(/^\d{2}:\d{2}$/);
}

function setTarget(date: string, time: string) {
  fireEvent.change(dateInput(), { target: { value: date } });
  fireEvent.change(timeInput(), { target: { value: time } });
}

function display() {
  return screen.getAllByRole('cell').map((cell) => cell.textContent);
}

const idleDisplay = ['-', '--', '--', '--'];

function clickStart() {
  userEvent.click(screen.getByRole('button', { name: 'Start Countdown' }));
}

function clickReset() {
  userEvent.click(screen.getByRole('button', { name: 'Reset' }));
}

function expectIdle() {
  expect(display()).toEqual(idleDisplay);
  expect(
    screen.getByRole('button', { name: 'Start Countdown' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  expect(dateInput()).toBeEnabled();
  expect(timeInput()).toBeEnabled();
}

function expectRunning() {
  expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start Countdown' })).toBeNull();
  expect(dateInput()).toBeDisabled();
  expect(timeInput()).toBeDisabled();
}

describe('CountDownTimer', () => {
  describe('initial render', () => {
    test('pre-fills date and time with the current local date/time and shows the idle card', () => {
      installFakeClock();
      const callbacks = renderTimer();
      expect(dateInput()).toHaveValue('2026-06-01');
      expect(dateInput()).toHaveAttribute('type', 'date');
      expect(timeInput()).toHaveValue('10:00');
      expect(timeInput()).toHaveAttribute('type', 'time');
      expect(
        screen.getAllByRole('columnheader').map((header) => header.textContent),
      ).toEqual(['Days', 'Hours', 'Minutes', 'Seconds']);
      expectIdle();
      expect(callbacks.handleTimerStart).not.toHaveBeenCalled();
      expect(callbacks.handleTimerReset).not.toHaveBeenCalled();
      expect(callbacks.handleElapsedTimer).not.toHaveBeenCalled();
    });

    test('the pre-filled time is truncated to the minute', () => {
      installFakeClock(new Date(2026, 11, 31, 23, 59, 59, 999));
      renderTimer();
      expect(dateInput()).toHaveValue('2026-12-31');
      expect(timeInput()).toHaveValue('23:59');
    });

    test('changing the inputs updates their values', () => {
      installFakeClock();
      renderTimer();
      setTarget('2026-06-02', '11:30');
      expect(screen.getByDisplayValue('2026-06-02')).toBeInTheDocument();
      expect(screen.getByDisplayValue('11:30')).toBeInTheDocument();
      expectIdle();
    });
  });

  describe('start validation', () => {
    test('target equal to now (the pre-filled value) alerts and does not start', () => {
      installFakeClock();
      const callbacks = renderTimer();
      clickStart();
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith(alertMessage);
      expect(callbacks.handleTimerStart).not.toHaveBeenCalled();
      expectIdle();
    });

    test('target in the past alerts and does not start', () => {
      installFakeClock();
      const callbacks = renderTimer();
      setTarget('2026-05-31', '23:00');
      clickStart();
      expect(alertSpy).toHaveBeenCalledWith(alertMessage);
      expect(callbacks.handleTimerStart).not.toHaveBeenCalled();
      expectIdle();
    });

    test('target less than 1 second ahead alerts', () => {
      installFakeClock(new Date(2026, 5, 1, 10, 0, 59, 1));
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(callbacks.handleTimerStart).not.toHaveBeenCalled();
    });

    test('target exactly 1 second ahead starts', () => {
      installFakeClock(new Date(2026, 5, 1, 10, 0, 59, 0));
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      expect(alertSpy).not.toHaveBeenCalled();
      expect(callbacks.handleTimerStart).toHaveBeenCalledTimes(1);
      expect(display()).toEqual(['0', '00', '00', '01']);
    });

    test('an empty (invalid) date alerts and does not start', () => {
      installFakeClock();
      const callbacks = renderTimer();
      fireEvent.change(timeInput(), { target: { value: '11:00' } });
      fireEvent.change(screen.getByDisplayValue('2026-06-01'), {
        target: { value: '' },
      });
      userEvent.click(screen.getByRole('button', { name: 'Start Countdown' }));
      expect(alertSpy).toHaveBeenCalledWith(alertMessage);
      expect(callbacks.handleTimerStart).not.toHaveBeenCalled();
    });
  });

  describe('running countdown', () => {
    test('start calls handleTimerStart once, locks the inputs and shows the remaining time', () => {
      installFakeClock();
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      expect(callbacks.handleTimerStart).toHaveBeenCalledTimes(1);
      expect(callbacks.handleTimerStart).toHaveBeenCalledWith();
      expect(callbacks.handleTimerReset).not.toHaveBeenCalled();
      expect(callbacks.handleElapsedTimer).not.toHaveBeenCalled();
      expect(display()).toEqual(['0', '00', '01', '00']);
      expectRunning();
      expect(screen.getByDisplayValue('10:01')).toBeInTheDocument();
    });

    test('the display updates every second', () => {
      installFakeClock();
      renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      advance(1000);
      expect(display()).toEqual(['0', '00', '00', '59']);
      advance(29_000);
      expect(display()).toEqual(['0', '00', '00', '30']);
      advance(29_000);
      expect(display()).toEqual(['0', '00', '00', '01']);
    });

    test('shows days, hours and minutes for long countdowns', () => {
      installFakeClock();
      renderTimer();
      setTarget('2026-06-03', '13:04');
      clickStart();
      expect(display()).toEqual(['2', '03', '04', '00']);
      advance(1000);
      expect(display()).toEqual(['2', '03', '03', '59']);
    });

    test('remaining seconds are rounded up', () => {
      installFakeClock(new Date(2026, 5, 1, 10, 0, 0, 400));
      renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      // 59.6 s remaining
      expect(display()).toEqual(['0', '00', '01', '00']);
      advance(1000);
      // 58.6 s remaining
      expect(display()).toEqual(['0', '00', '00', '59']);
    });

    test('the remaining time is derived from the clock, not from counted ticks (throttled background tab)', () => {
      installFakeClock();
      renderTimer();
      setTarget('2026-06-01', '10:10');
      clickStart();
      // 5 minutes pass without any interval firing
      jumpClock(5 * 60 * 1000);
      advance(1000);
      // 10:10:00 - 10:05:01 = 299 s
      expect(display()).toEqual(['0', '00', '04', '59']);
    });
  });

  describe('elapse', () => {
    test('calls handleElapsedTimer exactly once and returns to idle', () => {
      installFakeClock();
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      advance(59_000);
      expect(display()).toEqual(['0', '00', '00', '01']);
      expect(callbacks.handleElapsedTimer).not.toHaveBeenCalled();
      advance(1000);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledTimes(1);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledWith();
      expectIdle();
      // the elapsed countdown does not count as a reset
      expect(callbacks.handleTimerReset).not.toHaveBeenCalled();
      advance(10 * 60 * 1000);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledTimes(1);
      expect(callbacks.handleTimerStart).toHaveBeenCalledTimes(1);
      // the target stays in the inputs
      expect(dateInput()).toHaveValue('2026-06-01');
      expect(timeInput()).toHaveValue('10:01');
    });

    test('elapses once when the clock jumps past the end (e.g. device asleep)', () => {
      installFakeClock();
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      jumpClock(20 * 60 * 1000);
      advance(1000);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledTimes(1);
      expectIdle();
      advance(5000);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledTimes(1);
    });

    test('a new countdown can be started after the previous one elapsed', () => {
      installFakeClock();
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      advance(60_000);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledTimes(1);
      // 10:01 is now in the past
      clickStart();
      expect(alertSpy).toHaveBeenCalledTimes(1);
      setTarget('2026-06-01', '10:03');
      clickStart();
      expect(callbacks.handleTimerStart).toHaveBeenCalledTimes(2);
      expect(display()).toEqual(['0', '00', '02', '00']);
      advance(120_000);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset', () => {
    test('stops the countdown, calls handleTimerReset once and never elapses', () => {
      installFakeClock();
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      advance(5000);
      expect(display()).toEqual(['0', '00', '00', '55']);
      clickReset();
      expect(callbacks.handleTimerReset).toHaveBeenCalledTimes(1);
      expect(callbacks.handleTimerReset).toHaveBeenCalledWith();
      expectIdle();
      advance(10 * 60 * 1000);
      expect(callbacks.handleElapsedTimer).not.toHaveBeenCalled();
      expect(callbacks.handleTimerStart).toHaveBeenCalledTimes(1);
      expect(display()).toEqual(idleDisplay);
      // the target is kept
      expect(timeInput()).toHaveValue('10:01');
    });

    test('can restart after a reset', () => {
      installFakeClock(fixedNow);
      const callbacks = renderTimer();
      setTarget('2026-06-01', '10:01');
      clickStart();
      clickReset();
      clickStart();
      expect(callbacks.handleTimerStart).toHaveBeenCalledTimes(2);
      expect(display()).toEqual(['0', '00', '01', '00']);
      advance(60_000);
      expect(callbacks.handleElapsedTimer).toHaveBeenCalledTimes(1);
      expect(callbacks.handleTimerReset).toHaveBeenCalledTimes(1);
    });
  });
});
