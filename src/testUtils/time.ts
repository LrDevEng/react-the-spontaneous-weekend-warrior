import { jest } from '@jest/globals';
import { act } from '@testing-library/react';

// Local-time fixture: 1 June 2026, 10:00:00.000 (no DST change nearby, so the
// tests behave the same in every time zone)
export const fixedNow = new Date(2026, 5, 1, 10, 0, 0, 0);

// Jest "modern" fake timers also fake Date / Date.now, so the countdown's
// `endTime - Date.now()` and its setInterval advance together.
export function installFakeClock(now: Date = fixedNow) {
  jest.useFakeTimers({ now });
}

// Advances fake timers (and the fake clock) inside act()
export function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

// Moves the fake clock without firing timers (e.g. a throttled background tab)
export function jumpClock(ms: number) {
  jest.setSystemTime(Date.now() + ms);
}

// Lets pending promise callbacks (mocked fetch -> res.json() -> setState) run
// inside act(). Works with fake timers because it only awaits microtasks.
export async function flushPromises() {
  await act(async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  });
}
