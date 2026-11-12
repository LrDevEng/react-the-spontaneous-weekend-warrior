import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import LegacyCountDownCard from '../../__legacy__/components/CountDownCard';
import LegacyCountDownTimer from '../../__legacy__/components/CountDownTimer';
import LegacyDateTimePicker from '../../__legacy__/components/DateTimePicker';
import LegacyDestinationForm from '../../__legacy__/components/DestinationForm';
import LegacyMap from '../../__legacy__/components/Map';
import LegacyWeather from '../../__legacy__/components/Weather';
import LiveCountDownCard from '../../components/CountDownCard';
import LiveCountDownTimer from '../../components/CountDownTimer';
import LiveDateTimePicker from '../../components/DateTimePicker';
import LiveDestinationForm from '../../components/DestinationForm';
import LiveMap from '../../components/Map';
import LiveWeather from '../../components/Weather';
import {
  type Checkpoint,
  runScenario,
  type ScenarioContext,
  type ScenarioOptions,
} from '../../testUtils/b2b';
import { weatherResponse, weatherUrlParams } from '../../testUtils/fetchMock';
import { advance, flushPromises, jumpClock } from '../../testUtils/time';
import { parseSecondsToTfs } from '../../utils/Parsers';

// Back-to-back: every scenario runs against the frozen legacy component
// (src/__legacy__) and the live component with identical props, events,
// fake time and mocked fetch; the recorded traces (HTML at each checkpoint,
// callback calls, fetch URLs, abort state, setView calls, alerts) must match.

jest.mock('react-leaflet');

async function compare(
  scenario: (
    variant: 'legacy' | 'live',
  ) => (ctx: ScenarioContext) => Promise<void> | void,
  options?: ScenarioOptions,
) {
  const legacy = await runScenario(scenario('legacy'), options);
  const live = await runScenario(scenario('live'), options);
  expect(live).toEqual(legacy);
  return legacy;
}

function labels(trace: Checkpoint[]) {
  return trace.map((checkpoint) => checkpoint.label);
}

type Tfs = { days: string; hours: string; minutes: string; seconds: string };

describe('B2B: CountDownCard', () => {
  test('renders identically for idle, zero, short and long times', async () => {
    const secondsValues = [
      -1, 0, 1, 59, 60, 3599, 3600, 86_399, 86_400, 987_654,
    ];
    const trace = await compare((variant) => (ctx) => {
      const element = (time: Tfs): ReactElement =>
        variant === 'legacy' ? (
          <LegacyCountDownCard time={time} />
        ) : (
          <LiveCountDownCard time={time} />
        );
      const { container, rerender } = render(element(parseSecondsToTfs(-1)));
      ctx.setContainer(container);
      for (const seconds of secondsValues) {
        rerender(element(parseSecondsToTfs(seconds)));
        ctx.checkpoint(`seconds=${seconds}`);
      }
    });
    expect(trace).toHaveLength(secondsValues.length);
    expect(trace[0]?.html).toContain('<td>-</td>');
  });
});

describe('B2B: DateTimePicker', () => {
  test('renders identically and forwards the same callback values', async () => {
    const trace = await compare((variant) => (ctx) => {
      const setDate = (value: unknown) => ctx.record('setDate', value);
      const setTime = (value: unknown) => ctx.record('setTime', value);
      const element = (date: string, time: string, disabled: boolean) =>
        variant === 'legacy' ? (
          <LegacyDateTimePicker
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            disabled={disabled}
          />
        ) : (
          <LiveDateTimePicker
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            disabled={disabled}
          />
        );
      const { container, rerender } = render(
        element('2026-06-01', '10:00', false),
      );
      ctx.setContainer(container);
      ctx.checkpoint('initial');
      fireEvent.change(screen.getByDisplayValue('2026-06-01'), {
        target: { value: '2026-07-15' },
      });
      ctx.checkpoint('date changed (controlled, props unchanged)');
      fireEvent.change(screen.getByDisplayValue('10:00'), {
        target: { value: '18:30' },
      });
      ctx.checkpoint('time changed');
      rerender(element('2026-07-15', '18:30', false));
      ctx.checkpoint('new props');
      rerender(element('2026-07-15', '18:30', true));
      ctx.checkpoint('disabled');
    });
    expect(trace.flatMap((checkpoint) => checkpoint.events)).toEqual([
      ['setDate', '2026-07-15'],
      ['setTime', '18:30'],
    ]);
  });
});

describe('B2B: DestinationForm', () => {
  test('renders identically and forwards the same callback values', async () => {
    const trace = await compare((variant) => (ctx) => {
      const setMinDist = (value: unknown) => ctx.record('setMinDist', value);
      const setMaxDist = (value: unknown) => ctx.record('setMaxDist', value);
      const element = (minDist: string, maxDist: string, disabled: boolean) =>
        variant === 'legacy' ? (
          <LegacyDestinationForm
            minDist={minDist}
            setMinDist={setMinDist}
            maxDist={maxDist}
            setMaxDist={setMaxDist}
            disabled={disabled}
          />
        ) : (
          <LiveDestinationForm
            minDist={minDist}
            setMinDist={setMinDist}
            maxDist={maxDist}
            setMaxDist={setMaxDist}
            disabled={disabled}
          />
        );
      const { container, rerender } = render(element('10', '50', false));
      ctx.setContainer(container);
      ctx.checkpoint('initial');
      const min = screen.getByRole('spinbutton', { name: /minimum/i });
      const max = screen.getByRole('spinbutton', { name: /maximum/i });
      fireEvent.change(min, { target: { value: '25' } });
      fireEvent.change(max, { target: { value: '120' } });
      fireEvent.change(min, { target: { value: '' } });
      fireEvent.change(max, { target: { value: '-3' } });
      ctx.checkpoint('changes');
      rerender(element('25', '120', false));
      ctx.checkpoint('new props');
      rerender(element('', '', true));
      ctx.checkpoint('empty + disabled');
    });
    expect(trace[1]?.events).toEqual([
      ['setMinDist', '25'],
      ['setMaxDist', '120'],
      ['setMinDist', ''],
      ['setMaxDist', '-3'],
    ]);
  });
});

// "HH:MM" and the timestamp of the minute boundary `minutes` after the fake clock
function nextMinute(minutes: number) {
  const target = new Date(Date.now());
  target.setSeconds(0, 0);
  target.setMinutes(target.getMinutes() + minutes);
  return {
    time: `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`,
    timestamp: target.getTime(),
  };
}

describe('B2B: CountDownTimer', () => {
  test.each([
    { label: 'whole second', now: new Date(2026, 5, 1, 10, 0, 0, 0) },
    // sub-second offsets make Math.ceil/round/floor differences visible
    { label: 'sub-second', now: new Date(2026, 5, 1, 10, 0, 0, 600) },
  ])(
    'identical display and callbacks through start / tick / throttle / reset / elapse ($label start time)',
    async ({ now }) => {
      const trace = await compare(
        (variant) => (ctx) => {
          const handleElapsedTimer = () => ctx.record('handleElapsedTimer');
          const handleTimerStart = () => ctx.record('handleTimerStart');
          const handleTimerReset = () => ctx.record('handleTimerReset');
          const { container } = render(
            variant === 'legacy' ? (
              <LegacyCountDownTimer
                handleElapsedTimer={handleElapsedTimer}
                handleTimerStart={handleTimerStart}
                handleTimerReset={handleTimerReset}
              />
            ) : (
              <LiveCountDownTimer
                handleElapsedTimer={handleElapsedTimer}
                handleTimerStart={handleTimerStart}
                handleTimerReset={handleTimerReset}
              />
            ),
          );
          ctx.setContainer(container);
          const input = (type: string) => {
            const element = container.querySelector(`input[type="${type}"]`);
            if (!element) throw new Error(`no ${type} input`);
            return element;
          };
          const date = () => input('date');
          const time = () => input('time');
          const click = (name: string) =>
            userEvent.click(screen.getByRole('button', { name }));

          ctx.checkpoint('initial');
          click('Start Countdown');
          ctx.checkpoint('start with target = now (alert)');
          fireEvent.change(time(), { target: { value: '09:30' } });
          click('Start Countdown');
          ctx.checkpoint('start with past target (alert)');

          fireEvent.change(date(), { target: { value: '2026-06-02' } });
          fireEvent.change(time(), { target: { value: '12:34' } });
          ctx.checkpoint('target changed');
          click('Start Countdown');
          ctx.checkpoint('started (1 day 2:34:00)');
          advance(1000);
          ctx.checkpoint('+1s');
          advance(59_000);
          ctx.checkpoint('+1min');
          jumpClock(3 * 60 * 60 * 1000);
          advance(1000);
          ctx.checkpoint('clock jumped 3h (throttled tab)');
          jumpClock(1300);
          advance(1000);
          ctx.checkpoint('clock jumped 1.3s');
          click('Reset');
          ctx.checkpoint('reset');
          advance(5000);
          ctx.checkpoint('after reset, time passes');

          fireEvent.change(date(), { target: { value: '2026-06-01' } });
          fireEvent.change(time(), { target: { value: '13:05' } });
          click('Start Countdown');
          ctx.checkpoint('restarted');
          for (let i = 0; i < 4; i++) {
            advance(997);
            ctx.checkpoint(`tick ${i}`);
          }
          // 13:01:10 now, ends at 13:05:00
          advance(3 * 60 * 1000 + 49_000);
          ctx.checkpoint('1s before elapse');
          advance(1000);
          ctx.checkpoint('elapsed');
          advance(10_000);
          ctx.checkpoint('after elapse');
          fireEvent.change(time(), { target: { value: '' } });
          click('Start Countdown');
          ctx.checkpoint('empty time (alert)');

          // Start threshold: a target 999 ms ahead is rejected, 1000 ms ahead starts
          const boundary = nextMinute(2);
          fireEvent.change(time(), { target: { value: boundary.time } });
          jumpClock(boundary.timestamp - Date.now() - 999);
          click('Start Countdown');
          ctx.checkpoint('999 ms ahead (alert)');
          jumpClock(-1);
          click('Start Countdown');
          ctx.checkpoint('1000 ms ahead (starts)');
          advance(1000);
          ctx.checkpoint('elapsed after 1 s');
        },
        { now },
      );

      const events = trace.flatMap((checkpoint) => checkpoint.events);
      expect(events).toEqual([
        ['handleTimerStart'],
        ['handleTimerReset'],
        ['handleTimerStart'],
        ['handleElapsedTimer'],
        ['handleTimerStart'],
        ['handleElapsedTimer'],
      ]);
      expect(trace.flatMap((checkpoint) => checkpoint.alerts)).toHaveLength(4);
      expect(labels(trace)).toContain('elapsed');
    },
  );
});

const vienna = { lat: 48.223415757807906, lng: 16.390110631145077 };
const graz = { lat: 47.0707, lng: 15.4395 };
const linz = { lat: 48.3069, lng: 14.2858 };
const salzburg = { lat: 47.8095, lng: 13.055 };

describe('B2B: Weather', () => {
  test('identical loading / success / API error / network error / abort behavior', async () => {
    const trace = await compare((variant) => async (ctx) => {
      const element = (center: { lat: number; lng: number }) =>
        variant === 'legacy' ? (
          <LegacyWeather center={center} />
        ) : (
          <LiveWeather center={center} />
        );
      const { container, rerender, unmount } = render(element(vienna));
      ctx.setContainer(container);
      ctx.checkpoint('loading vienna');
      ctx.fetchCalls[0]?.respond(
        weatherResponse({ name: 'Vienna', temp: 263.1, feelsLike: 300 }),
      );
      await flushPromises();
      ctx.checkpoint('vienna loaded');

      rerender(element(graz));
      ctx.checkpoint('loading graz');
      rerender(element(linz));
      await flushPromises();
      ctx.checkpoint('graz aborted, loading linz');
      ctx.fetchCalls[1]?.respond(weatherResponse({ name: 'Graz' }));
      ctx.fetchCalls[2]?.respond({ cod: 401, message: 'Invalid API key.' });
      await flushPromises();
      ctx.checkpoint('linz API error');

      rerender(element(salzburg));
      ctx.fetchCalls[3]?.fail(new TypeError('Failed to fetch'));
      await flushPromises();
      ctx.checkpoint('salzburg network error');

      rerender(element({ ...salzburg }));
      ctx.fetchCalls[4]?.respond({ cod: '404' });
      await flushPromises();
      ctx.checkpoint('equal center object, error without message');

      rerender(element(vienna));
      ctx.fetchCalls[5]?.respond(
        weatherResponse({ name: 'Wien', description: 'clear sky' }),
      );
      await flushPromises();
      ctx.checkpoint('vienna again');

      rerender(element(graz));
      unmount();
      await flushPromises();
      ctx.checkpoint('unmounted while loading');
    });

    const urls = trace.flatMap((checkpoint) => checkpoint.fetchUrls);
    expect(urls).toHaveLength(7);
    expect(urls.map((url) => weatherUrlParams(url).appid)).toEqual(
      Array(7).fill('test-api-key'),
    );
    expect(trace.at(-1)?.fetchAborted).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(trace[1]?.html).toContain('Current weather in Vienna');
    expect(trace[3]?.html).toContain('Loading ...');
  });
});

describe('B2B: Map', () => {
  test('identical markup and setView calls for center / zoom / align / popup changes', async () => {
    const trace = await compare((variant) => (ctx) => {
      const element = (
        center: { lat: number; lng: number },
        zoom: number,
        popUp: string,
        align: boolean,
      ) =>
        variant === 'legacy' ? (
          <LegacyMap center={center} zoom={zoom} popUp={popUp} align={align} />
        ) : (
          <LiveMap center={center} zoom={zoom} popUp={popUp} align={align} />
        );
      const { container, rerender } = render(
        element(vienna, 13, 'The Social Hub', false),
      );
      ctx.setContainer(container);
      ctx.checkpoint('initial');
      rerender(element(vienna, 13, 'The Social Hub', true));
      ctx.checkpoint('align true');
      rerender(element(graz, 13, 'Your Destination', false));
      ctx.checkpoint('new center + popup + align false');
      rerender(element(graz, 10, 'Your Destination', false));
      ctx.checkpoint('zoom');
      rerender(element(graz, 10, 'Somewhere else', false));
      ctx.checkpoint('popup only');
      rerender(element({ ...graz }, 10, 'Somewhere else', false));
      ctx.checkpoint('equal center object');
      rerender(element(vienna, 13, 'The Social Hub', false));
      ctx.checkpoint('back to start');
    });
    expect(trace.flatMap((checkpoint) => checkpoint.setViewCalls)).toEqual([
      { mapId: 1, center: vienna, zoom: 13 },
      { mapId: 1, center: graz, zoom: 13 },
      { mapId: 1, center: graz, zoom: 10 },
      { mapId: 1, center: graz, zoom: 10 },
      { mapId: 1, center: vienna, zoom: 13 },
    ]);
    expect(trace[0]?.html).toContain('The Social Hub');
  });
});
