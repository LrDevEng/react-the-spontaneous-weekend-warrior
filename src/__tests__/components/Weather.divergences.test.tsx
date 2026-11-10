import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Weather from '../../components/Weather';
import { installFetchMock, weatherResponse } from '../../testUtils/fetchMock';
import { flushPromises } from '../../testUtils/time';

// INTENTIONAL DIVERGENCES FROM LEGACY (pre-TypeScript) BEHAVIOR.
// These pin the behavior of the TypeScript Weather component for inputs on
// which the JavaScript version crashed or behaved differently. They are
// deliberately NOT back-to-back tests: legacy and live differ here by design.

const vienna = { lat: 48.223415757807906, lng: 16.390110631145077 };
const graz = { lat: 47.0707, lng: 15.4395 };

function rows() {
  return screen
    .getAllByRole('row')
    .map((row) =>
      Array.from(row.children).map((cellElement) => cellElement.textContent),
    );
}

let consoleLogSpy: jest.Spied<typeof console.log>;

beforeEach(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe('Weather: intentional divergences from legacy', () => {
  // Legacy crashed with a TypeError on `weather.weather[0].description`
  test('(a) a response with `weather: []` renders the table with an empty description cell', async () => {
    installFetchMock(() => ({ ...weatherResponse(), weather: [] }));
    render(<Weather center={vienna} />);
    await flushPromises();
    expect(rows()).toEqual([
      ['Current weather in Vienna'],
      ['Latitude', String(vienna.lat)],
      ['Longitude', String(vienna.lng)],
      ['Weather', ''],
      ['Temperature °C', '15'],
      ['Feels like °C', '14.4'],
      ['Humidity %', '81'],
    ]);
  });

  // Legacy crashed reading `error.name` in the catch handler (unhandled
  // rejection) and stayed on "Loading ..." forever
  test.each([
    ['null', null],
    ['undefined', undefined],
  ])(
    '(b) fetch rejecting with %s shows "Weather unavailable: unknown error"',
    async (label, reason) => {
      const { fetchMock } = installFetchMock();
      fetchMock.mockImplementation(() => Promise.reject(reason));
      const { container } = render(<Weather center={vienna} />);
      await flushPromises();
      expect(container).toHaveTextContent(
        /^Weather unavailable: unknown error$/,
      );
      expect(container.firstElementChild).toHaveClass('weather');
      expect(consoleLogSpy).toHaveBeenCalledWith(reason);
    },
  );

  // NOTE: possible bug: same mechanism as an Error with an empty message in
  // legacy: without an error message the component falls through to the last
  // weather response, so the previous location's weather is shown together
  // with the new coordinates
  test('(b) fetch rejecting with null after a successful load shows the previous weather with the new coordinates', async () => {
    const { fetchMock } = installFetchMock(() =>
      weatherResponse({ name: 'Vienna' }),
    );
    const { rerender } = render(<Weather center={vienna} />);
    await flushPromises();
    // Deliberately not an Error: that is the case under test
    const reason: unknown = null;
    fetchMock.mockImplementation(() => Promise.reject(reason));
    rerender(<Weather center={graz} />);
    await flushPromises();
    expect(rows().slice(0, 3)).toEqual([
      ['Current weather in Vienna'],
      ['Latitude', String(graz.lat)],
      ['Longitude', String(graz.lng)],
    ]);
  });

  // Not reported by the port, found in review. Legacy crashed on
  // `null.weather` while rendering
  test('(c) a JSON body of `null` shows "Weather unavailable: unknown error"', async () => {
    // Responded manually: a handler returning undefined/null means "pending"
    const { calls } = installFetchMock();
    const { container } = render(<Weather center={vienna} />);
    calls[0]?.respond(null);
    await flushPromises();
    expect(container).toHaveTextContent(/^Weather unavailable: unknown error$/);
  });

  // Not reported by the port, found in review. Legacy crashed on
  // `weather.weather[0].description` (undefined[0] is not an error, but
  // `.description` of undefined is)
  test('(d) a truthy non-array `weather` field renders an empty description cell', async () => {
    installFetchMock(() => ({ ...weatherResponse(), weather: {} }));
    render(<Weather center={vienna} />);
    await flushPromises();
    expect(rows()[3]).toEqual(['Weather', '']);
  });

  // Not reported by the port, found in review. Not a crash in legacy: legacy
  // rendered the non-string message ("Weather unavailable: 42"); the port only
  // uses string messages and falls back to "unknown error"
  test('(e) a rejection whose message is not a string shows "unknown error"', async () => {
    const { fetchMock } = installFetchMock();
    fetchMock.mockImplementation(() =>
      Promise.reject(Object.assign(new Error('x'), { message: 42 })),
    );
    const { container } = render(<Weather center={vienna} />);
    await flushPromises();
    expect(container).toHaveTextContent(/^Weather unavailable: unknown error$/);
  });
});
