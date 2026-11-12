import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react';
import LegacyWeather from '../../__legacy__/components/Weather';
import LiveWeather from '../../components/Weather';
import { runScenario } from '../../testUtils/b2b';
import { flushPromises } from '../../testUtils/time';
import { isWeatherData } from '../../utils/WeatherApi';

// Back-to-back for the isWeatherData type guard. In the legacy code the check
// is inline in Weather.js (`!weather.weather || !weather.main`), so the guard
// is compared through what the legacy component renders: for every response
// body (a) legacy and live Weather render identical HTML, and (b) the legacy
// component renders the weather table exactly when isWeatherData(body) is true.
//
// Bodies on which the legacy component crashed (null / undefined body, or
// truthy `weather` + `main` without weather[0].description) are excluded here;
// the live behavior for those is pinned in
// src/__tests__/components/Weather.divergences.test.tsx.

jest.mock('react-leaflet');

const absent = Symbol('absent');

const weatherValues: unknown[] = [
  absent,
  undefined,
  null,
  0,
  '',
  false,
  Number.NaN,
  [{ description: 'clear sky' }],
  [{ description: 'light rain' }, { description: 'mist' }],
];

const mainValues: unknown[] = [
  absent,
  undefined,
  null,
  0,
  '',
  false,
  { temp: 280.15, feels_like: 278.4, humidity: 63 },
  {},
];

const messageValues: unknown[] = [
  absent,
  '',
  'Invalid API key.',
  0,
  'city not found',
];

function buildBody(weather: unknown, main: unknown, message: unknown) {
  const body: Record<string, unknown> = { cod: 200, name: 'Somewhere' };
  if (weather !== absent) body.weather = weather;
  if (main !== absent) body.main = main;
  if (message !== absent) body.message = message;
  return body;
}

const bodies: unknown[] = [
  // Non-object JSON bodies (null is excluded, see above)
  0,
  1,
  '',
  'text',
  true,
  false,
  [],
  [{ weather: [{ description: 'x' }], main: {} }],
  {},
  { cod: 401, message: 'Invalid API key.' },
  { cod: '404' },
  ...weatherValues.flatMap((weather) =>
    mainValues.flatMap((main) =>
      messageValues.map((message) => buildBody(weather, main, message)),
    ),
  ),
];

const center = { lat: 48.2, lng: 16.4 };

describe('B2B: isWeatherData (via the rendered Weather component)', () => {
  test('legacy and live render identically and the guard matches the legacy inline check', async () => {
    const run = (variant: 'legacy' | 'live') =>
      runScenario(async (ctx) => {
        // `main: {}` renders NaN temperatures, which React warns about
        // (identically for legacy and live)
        jest.spyOn(console, 'error').mockImplementation(() => {});
        for (const [index, body] of bodies.entries()) {
          const { container, unmount } = render(
            variant === 'legacy' ? (
              <LegacyWeather center={center} />
            ) : (
              <LiveWeather center={center} />
            ),
          );
          ctx.setContainer(container);
          ctx.fetchCalls[index]?.respond(body);
          await flushPromises();
          ctx.checkpoint(`body ${index}`);
          unmount();
        }
      });

    const legacy = await run('legacy');
    const live = await run('live');

    expect(live).toEqual(legacy);
    expect(legacy).toHaveLength(bodies.length);

    const legacyShowsTable = legacy.map((checkpoint) =>
      checkpoint.html.includes('<table>'),
    );
    expect(legacyShowsTable).toEqual(bodies.map((body) => isWeatherData(body)));

    // Both outcomes are represented in the corpus
    expect(legacyShowsTable.filter(Boolean)).toHaveLength(20);
    expect(legacyShowsTable.filter((shown) => !shown).length).toBeGreaterThan(
      100,
    );
  });
});
