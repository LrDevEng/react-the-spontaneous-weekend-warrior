import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Weather from '../../components/Weather';
import { installFetchMock, weatherResponse } from '../../testUtils/fetchMock';
import { flushPromises } from '../../testUtils/time';

const vienna = { lat: 48.223415757807906, lng: 16.390110631145077 };
const graz = { lat: 47.0707, lng: 15.4395 };

function weatherUrl(center: { lat: number; lng: number }) {
  return `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=test-api-key`;
}

// Table rows as [label, value] pairs
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

describe('Weather', () => {
  test('shows "Loading ..." until the response arrives', () => {
    installFetchMock();
    const { container } = render(<Weather center={vienna} />);
    expect(container).toHaveTextContent(/^Loading \.\.\.$/);
    expect(screen.queryByRole('table')).toBeNull();
  });

  test('fetches the current weather for the center with the API key from REACT_APP_OPEN_WEATHER_MAP_API_KEY', async () => {
    const { fetchMock, calls } = installFetchMock(() => weatherResponse());
    render(<Weather center={vienna} />);
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls[0]?.url).toBe(weatherUrl(vienna));
    expect(calls[0]?.url).toBe(
      'https://api.openweathermap.org/data/2.5/weather?lat=48.223415757807906&lon=16.390110631145077&appid=test-api-key',
    );
    expect(calls[0]?.signal).toBeInstanceOf(AbortSignal);
  });

  test('renders the weather table with Celsius values rounded to one decimal', async () => {
    installFetchMock(() =>
      weatherResponse({
        name: 'Vienna',
        description: 'light rain',
        temp: 288.15,
        feelsLike: 287.5,
        humidity: 81,
      }),
    );
    const { container } = render(<Weather center={vienna} />);
    await flushPromises();
    expect(container.firstElementChild).toHaveClass('weather');
    expect(rows()).toEqual([
      ['Current weather in Vienna'],
      ['Latitude', '48.223415757807906'],
      ['Longitude', '16.390110631145077'],
      ['Weather', 'LIGHT RAIN'],
      ['Temperature °C', '15'],
      ['Feels like °C', '14.4'],
      ['Humidity %', '81'],
    ]);
    expect(
      screen.getByRole('columnheader', { name: 'Current weather in Vienna' }),
    ).toHaveAttribute('colspan', '2');
  });

  test.each([
    [300, '26.9'],
    [273.15, '0'],
    // -9.95 °C and -10.05 °C: Math.round rounds halves towards +Infinity
    [263.2, '-9.9'],
    [263.1, '-10'],
    [310.2, '37.1'],
    [0, '-273.1'],
  ])('temperature %p K is shown as %p °C', async (kelvin, celsius) => {
    installFetchMock(() =>
      weatherResponse({ temp: kelvin, feelsLike: kelvin }),
    );
    render(<Weather center={vienna} />);
    await flushPromises();
    expect(rows()[4]).toEqual(['Temperature °C', celsius]);
    expect(rows()[5]).toEqual(['Feels like °C', celsius]);
  });

  describe('API error responses ({ cod, message } instead of weather data)', () => {
    test('shows the API error message', async () => {
      installFetchMock(() => ({
        cod: 401,
        message:
          'Invalid API key. Please see https://openweathermap.org/faq#error401 for more info.',
      }));
      const { container } = render(<Weather center={vienna} />);
      await flushPromises();
      expect(container).toHaveTextContent(
        'Weather unavailable: Invalid API key. Please see https://openweathermap.org/faq#error401 for more info.',
      );
      expect(container.firstElementChild).toHaveClass('weather');
      expect(screen.queryByRole('table')).toBeNull();
    });

    test('falls back to "unknown error" without a message', async () => {
      installFetchMock(() => ({ cod: '404' }));
      const { container } = render(<Weather center={vienna} />);
      await flushPromises();
      expect(container).toHaveTextContent(
        /^Weather unavailable: unknown error$/,
      );
    });

    test('treats a response without `main` as an error', async () => {
      const { main: _main, ...withoutMain } = weatherResponse();
      installFetchMock(() => ({ ...withoutMain, message: 'partial' }));
      const { container } = render(<Weather center={vienna} />);
      await flushPromises();
      expect(container).toHaveTextContent(/^Weather unavailable: partial$/);
    });

    test('treats a response without `weather` as an error', async () => {
      const { weather: _weather, ...withoutWeather } = weatherResponse();
      installFetchMock(() => withoutWeather);
      const { container } = render(<Weather center={vienna} />);
      await flushPromises();
      expect(container).toHaveTextContent(
        /^Weather unavailable: unknown error$/,
      );
    });
  });

  test('network failure shows the error message and logs the error', async () => {
    const error = new TypeError('Failed to fetch');
    installFetchMock(() => error);
    const { container } = render(<Weather center={vienna} />);
    await flushPromises();
    expect(container).toHaveTextContent(
      /^Weather unavailable: Failed to fetch$/,
    );
    expect(container.firstElementChild).toHaveClass('weather');
    expect(consoleLogSpy).toHaveBeenCalledWith(error);
  });

  describe('center changes', () => {
    test('refetches for the new center, shows "Loading ..." meanwhile, and aborts the previous request', async () => {
      const { calls } = installFetchMock();
      const { container, rerender } = render(<Weather center={vienna} />);
      expect(calls).toHaveLength(1);
      const firstSignal = calls[0]?.signal;
      expect(firstSignal?.aborted).toBe(false);

      rerender(<Weather center={graz} />);
      expect(calls).toHaveLength(2);
      expect(calls[1]?.url).toBe(weatherUrl(graz));
      expect(firstSignal?.aborted).toBe(true);
      expect(calls[1]?.signal?.aborted).toBe(false);
      await flushPromises();
      // The aborted request is ignored: no error message, still loading
      expect(container).toHaveTextContent(/^Loading \.\.\.$/);
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // A late response for the old center can no longer be delivered
      calls[0]?.respond(weatherResponse({ name: 'Vienna' }));
      calls[1]?.respond(weatherResponse({ name: 'Graz' }));
      await flushPromises();
      expect(rows()[0]).toEqual(['Current weather in Graz']);
      expect(rows()[1]).toEqual(['Latitude', '47.0707']);
      expect(rows()[2]).toEqual(['Longitude', '15.4395']);
    });

    test('shows "Loading ..." again after a successful load', async () => {
      installFetchMock((url) =>
        weatherResponse({ name: url.includes('lat=47') ? 'Graz' : 'Vienna' }),
      );
      const { container, rerender } = render(<Weather center={vienna} />);
      await flushPromises();
      expect(rows()[0]).toEqual(['Current weather in Vienna']);
      rerender(<Weather center={graz} />);
      expect(container).toHaveTextContent(/^Loading \.\.\.$/);
      await flushPromises();
      expect(rows()[0]).toEqual(['Current weather in Graz']);
    });

    // NOTE: possible bug: an error with an empty message is falsy, so the
    // component falls through to the previous (still valid) weather response
    // and shows the old location's weather with the new coordinates
    test('a network error with an empty message after a successful load shows the previous weather', async () => {
      installFetchMock((url) =>
        url.includes('lat=47')
          ? new Error('')
          : weatherResponse({ name: 'Vienna' }),
      );
      const { rerender } = render(<Weather center={vienna} />);
      await flushPromises();
      rerender(<Weather center={graz} />);
      await flushPromises();
      expect(rows().slice(0, 3)).toEqual([
        ['Current weather in Vienna'],
        ['Latitude', '47.0707'],
        ['Longitude', '15.4395'],
      ]);
    });

    test('recovers from a network error on the next center', async () => {
      installFetchMock((url) =>
        url.includes('lat=47')
          ? weatherResponse({ name: 'Graz' })
          : new TypeError('Failed to fetch'),
      );
      const { container, rerender } = render(<Weather center={vienna} />);
      await flushPromises();
      expect(container).toHaveTextContent('Weather unavailable');
      rerender(<Weather center={graz} />);
      await flushPromises();
      expect(rows()[0]).toEqual(['Current weather in Graz']);
    });

    test('re-rendering with the same center object does not refetch', async () => {
      const { calls } = installFetchMock(() => weatherResponse());
      const { rerender } = render(<Weather center={vienna} />);
      await flushPromises();
      rerender(<Weather center={vienna} />);
      await flushPromises();
      expect(calls).toHaveLength(1);
    });

    // Current behavior: the effect depends on the center object identity,
    // so an equal but new object triggers a new request
    test('a new center object with equal coordinates refetches', async () => {
      const { calls } = installFetchMock(() => weatherResponse());
      const { rerender } = render(<Weather center={vienna} />);
      await flushPromises();
      rerender(<Weather center={{ ...vienna }} />);
      await flushPromises();
      expect(calls.map((call) => call.url)).toEqual([
        weatherUrl(vienna),
        weatherUrl(vienna),
      ]);
    });
  });

  test('unmounting aborts the pending request', async () => {
    const { calls } = installFetchMock();
    const { unmount } = render(<Weather center={vienna} />);
    unmount();
    expect(calls[0]?.signal?.aborted).toBe(true);
    await flushPromises();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
