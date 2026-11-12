import { jest } from '@jest/globals';
import { cleanup } from '@testing-library/react';
import {
  type FetchCall,
  type FetchHandler,
  installFetchMock,
} from './fetchMock';
import { leafletMock, type SetViewCall } from './leafletMock';
import { mockMathRandom } from './random';
import { fixedNow, installFakeClock } from './time';

// Harness for back-to-back (B2B) tests: the same scenario is run once against
// the frozen legacy code (src/__legacy__) and once against the live code, each
// time from an identical, fully mocked starting point (fake clock, seeded
// Math.random, mocked fetch / alert / react-leaflet). Every checkpoint records
// the rendered HTML plus everything observable that happened since the previous
// checkpoint, so the two traces can be compared with toEqual.

export type Checkpoint = {
  label: string;
  html: string;
  /** callback invocations recorded via ctx.record(), in order */
  events: unknown[];
  /** URLs passed to fetch since the previous checkpoint */
  fetchUrls: string[];
  /** aborted state of every fetch signal so far */
  fetchAborted: boolean[];
  setViewCalls: SetViewCall[];
  alerts: unknown[][];
  /** Date.now() at the checkpoint */
  now: number;
};

export type ScenarioContext = {
  checkpoint: (label: string) => void;
  record: (...event: unknown[]) => void;
  setContainer: (container: HTMLElement) => void;
  fetchCalls: FetchCall[];
};

export type ScenarioOptions = {
  fetchHandler?: FetchHandler;
  randomSeed?: number;
  now?: Date;
};

export async function runScenario(
  scenario: (ctx: ScenarioContext) => Promise<void> | void,
  { fetchHandler, randomSeed = 12345, now = fixedNow }: ScenarioOptions = {},
) {
  cleanup();
  jest.restoreAllMocks();
  jest.useRealTimers();
  leafletMock.reset();

  installFakeClock(now);
  mockMathRandom([], randomSeed);
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  // Logged errors are not part of the compared behavior
  jest.spyOn(console, 'log').mockImplementation(() => {});
  const { calls } = installFetchMock(fetchHandler);

  const checkpoints: Checkpoint[] = [];
  let events: unknown[] = [];
  let fetchIndex = 0;
  let setViewIndex = 0;
  let alertIndex = 0;
  let container: HTMLElement | undefined;

  const ctx: ScenarioContext = {
    fetchCalls: calls,
    record(...event) {
      events.push(event);
    },
    setContainer(element) {
      container = element;
    },
    checkpoint(label) {
      checkpoints.push({
        label,
        html: container?.innerHTML ?? '',
        events,
        fetchUrls: calls.slice(fetchIndex).map((call) => call.url),
        fetchAborted: calls.map((call) => call.signal?.aborted ?? false),
        setViewCalls: leafletMock.setViewCalls.slice(setViewIndex),
        alerts: alertSpy.mock.calls.slice(alertIndex),
        now: Date.now(),
      });
      events = [];
      fetchIndex = calls.length;
      setViewIndex = leafletMock.setViewCalls.length;
      alertIndex = alertSpy.mock.calls.length;
    },
  };

  try {
    await scenario(ctx);
  } finally {
    cleanup();
    jest.restoreAllMocks();
    jest.useRealTimers();
  }

  return checkpoints;
}
