import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LegacyApp from '../../__legacy__/App';
import LiveApp from '../../App';
import { runScenario, type ScenarioContext } from '../../testUtils/b2b';
import { weatherResponse, weatherUrlParams } from '../../testUtils/fetchMock';
import { advance, flushPromises } from '../../testUtils/time';

// Back-to-back: the whole app (legacy vs live) driven through the same user
// flow with fake time, seeded Math.random and a deterministic weather API.

jest.mock('react-leaflet');

function weatherHandler(url: string) {
  const { lat } = weatherUrlParams(url);
  if (lat?.startsWith('48.2234')) {
    return weatherResponse({ name: 'Vienna' });
  }
  // Deterministic per-location data (or an API error for some locations)
  const latitude = Number(lat);
  if (Math.floor(latitude * 1000) % 5 === 0) {
    return { cod: 500, message: 'Internal error' };
  }
  return weatherResponse({
    name: `Place ${latitude.toFixed(3)}`,
    temp: 250 + (Math.abs(latitude * 1000) % 50),
    feelsLike: 249 + (Math.abs(latitude * 100) % 50),
    humidity: Math.floor(Math.abs(latitude * 10_000) % 100),
  });
}

// "HH:MM" of the (fake) clock `minutes` from now, truncated to the minute
function minutesAhead(minutes: number) {
  const target = new Date(Date.now() + minutes * 60_000);
  return `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
}

function scenario(variant: 'legacy' | 'live') {
  return async (ctx: ScenarioContext) => {
    const { container } = render(
      variant === 'legacy' ? <LegacyApp /> : <LiveApp />,
    );
    ctx.setContainer(container);
    const min = () => screen.getByRole('spinbutton', { name: /minimum/i });
    const max = () => screen.getByRole('spinbutton', { name: /maximum/i });
    const date = () => screen.getByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
    const time = () => screen.getByDisplayValue(/^\d{2}:\d{2}$/);
    const click = (name: string) =>
      userEvent.click(screen.getByRole('button', { name }));

    ctx.checkpoint('mounted');
    await flushPromises();
    ctx.checkpoint('initial weather loaded');

    click('Start Countdown');
    ctx.checkpoint('start now (alert)');

    // Countdown 1: default distances (10..50 km)
    fireEvent.change(time(), { target: { value: '10:02' } });
    click('Start Countdown');
    ctx.checkpoint('started 1');
    advance(1000);
    ctx.checkpoint('started 1 +1s');
    advance(119_000);
    await flushPromises();
    ctx.checkpoint('elapsed 1');

    // Countdown 2: custom distances, reset before it elapses
    fireEvent.change(min(), { target: { value: '100' } });
    fireEvent.change(max(), { target: { value: '200' } });
    fireEvent.change(time(), { target: { value: '10:10' } });
    ctx.checkpoint('form changed');
    click('Start Countdown');
    advance(30_000);
    ctx.checkpoint('running 2');
    click('Reset');
    await flushPromises();
    ctx.checkpoint('reset 2');

    // Countdowns 3..8: clamping variants, each elapses
    const variants: [string, string][] = [
      ['100', '200'],
      ['40', '10'],
      ['-5', '3'],
      ['', ''],
      ['2.5', '7.5'],
      ['abc', '30'],
    ];
    for (const [minValue, maxValue] of variants) {
      fireEvent.change(min(), { target: { value: minValue } });
      fireEvent.change(max(), { target: { value: maxValue } });
      fireEvent.change(date(), { target: { value: '2026-06-01' } });
      fireEvent.change(time(), { target: { value: minutesAhead(3) } });
      click('Start Countdown');
      ctx.checkpoint(`started min=${minValue} max=${maxValue}`);
      advance(3 * 60_000);
      await flushPromises();
      ctx.checkpoint(`elapsed min=${minValue} max=${maxValue}`);
    }

    // Final: start and reset to return to the start location
    fireEvent.change(time(), { target: { value: '11:00' } });
    click('Start Countdown');
    advance(3000);
    click('Reset');
    await flushPromises();
    ctx.checkpoint('final reset');
  };
}

describe('B2B: App', () => {
  test.each([1, 2, 3])(
    'full user flow produces identical traces (random seed %p)',
    async (seed) => {
      const options = { fetchHandler: weatherHandler, randomSeed: seed };
      const legacy = await runScenario(scenario('legacy'), options);
      const live = await runScenario(scenario('live'), options);

      expect(live).toEqual(legacy);

      // Sanity checks so the comparison is not vacuous
      expect(legacy.length).toBeGreaterThan(15);
      const urls = legacy.flatMap((checkpoint) => checkpoint.fetchUrls);
      // start, destination 1, reset 2 (back to start), 6 destinations, final reset
      expect(urls).toHaveLength(10);
      expect(
        new Set(urls.map((url) => weatherUrlParams(url).lat)).size,
      ).toBeGreaterThan(5);
      expect(legacy.flatMap((checkpoint) => checkpoint.alerts)).toHaveLength(1);
      expect(
        legacy.find((checkpoint) => checkpoint.label === 'elapsed 1')?.html,
      ).toContain('Your Destination');
      expect(legacy.at(-1)?.html).toContain('The Social Hub');
    },
  );
});
