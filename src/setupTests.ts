// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { afterEach, beforeAll, jest } from '@jest/globals';
import { act } from '@testing-library/react';

// Deterministic OpenWeatherMap API key for the tests (CRA does not load
// .env.local in the test environment). Set here, before any test file imports
// the Weather component, because the component may read it at module load.
process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY = 'test-api-key';

// @testing-library/react 13 still calls ReactDOMTestUtils.act, which React
// 18.3 flags as deprecated on every render. Hide only that known warning.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('`ReactDOMTestUtils.act` is deprecated')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// React's development build calls Math.random() once, lazily, the first time an
// async act() flushes work (to look up Node's setImmediate). Trigger that before
// any test mocks Math.random, so mocked random sequences are consumed only by
// app code and tests do not depend on their execution order.
beforeAll(async () => {
  await act(async () => {});
});

afterEach(() => {
  // CRA enables `resetMocks`, which resets spies to return undefined but does
  // not restore the original implementation (e.g. Math.random, console.log)
  jest.restoreAllMocks();
  jest.useRealTimers();
});
