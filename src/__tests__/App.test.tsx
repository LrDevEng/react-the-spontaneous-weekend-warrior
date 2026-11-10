import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { computeDestinationPoint, getDistance } from 'geolib';
import App from '../App';
import {
  type FetchCall,
  installFetchMock,
  weatherResponse,
  weatherUrlParams,
} from '../testUtils/fetchMock';
import { leafletMock } from '../testUtils/leafletMock';
import { mockMathRandom } from '../testUtils/random';
import { advance, flushPromises, installFakeClock } from '../testUtils/time';

// Uses src/__mocks__/react-leaflet.tsx
jest.mock('react-leaflet');

const start = { lat: 48.223415757807906, lng: 16.390110631145077 };
const startUrl =
  'https://api.openweathermap.org/data/2.5/weather?lat=48.223415757807906&lon=16.390110631145077&appid=test-api-key';

function expectedDestination(distanceKm: number, bearing: number) {
  const point = computeDestinationPoint(
    { latitude: start.lat, longitude: start.lng },
    distanceKm * 1000,
    bearing,
  );
  return { lat: point.latitude, lng: point.longitude };
}

function distanceFromStartKm(point: { lat: number; lng: number }) {
  return (
    getDistance(
      { latitude: start.lat, longitude: start.lng },
      { latitude: point.lat, longitude: point.lng },
      0.01,
    ) / 1000
  );
}

let fetchCalls: FetchCall[];

beforeEach(() => {
  leafletMock.reset();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  installFakeClock();
  fetchCalls = installFetchMock((url) => {
    const { lat } = weatherUrlParams(url);
    return weatherResponse({
      name: lat === String(start.lat) ? 'Vienna' : 'Somewhere',
    });
  }).calls;
});

const minInput = () =>
  screen.getByRole('spinbutton', { name: /minimum distance/i });
const maxInput = () =>
  screen.getByRole('spinbutton', { name: /maximum distance/i });
const dateInput = () => screen.getByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
const timeInput = () => screen.getByDisplayValue(/^\d{2}:\d{2}$/);

function countdownDisplay() {
  const table = screen
    .getByRole('columnheader', { name: 'Days' })
    .closest('table');
  if (!table) throw new Error('countdown table not found');
  return within(table)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

function weatherRows() {
  const table = screen
    .getByRole('columnheader', { name: /^Current weather in/ })
    .closest('table');
  if (!table) throw new Error('weather table not found');
  return within(table)
    .getAllByRole('row')
    .map((row) =>
      Array.from(row.children).map((cellElement) => cellElement.textContent),
    );
}

function markerPosition() {
  return screen.getByTestId('marker').getAttribute('data-position');
}

function popupText() {
  return screen.getByTestId('popup').textContent;
}

function setDistances(min: string, max: string) {
  fireEvent.change(minInput(), { target: { value: min } });
  fireEvent.change(maxInput(), { target: { value: max } });
}

function startCountdown(time: string) {
  fireEvent.change(timeInput(), { target: { value: time } });
  userEvent.click(screen.getByRole('button', { name: 'Start Countdown' }));
}

// Runs a countdown of `minutes` and lets it elapse, returns the marker position
async function runCountdown(minutes: number) {
  const target = new Date(Date.now() + minutes * 60_000);
  const time = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
  startCountdown(time);
  advance(minutes * 60_000);
  await flushPromises();
}

function parsePosition(position: string | null) {
  const [lat, lng] = (position ?? '').split(',').map(Number);
  return { lat: lat ?? Number.NaN, lng: lng ?? Number.NaN };
}

describe('App', () => {
  test('initial render: title, idle countdown, default distances, map and weather at The Social Hub', async () => {
    render(<App />);
    await flushPromises();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'The Spontaneous Weekend Warrior',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 5,
        name: /^Choose a date, time and distance for your next adventure/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Freepik' })).toHaveAttribute(
      'href',
      'https://www.freepik.com/',
    );

    expect(countdownDisplay()).toEqual(['-', '--', '--', '--']);
    expect(dateInput()).toHaveValue('2026-06-01');
    expect(timeInput()).toHaveValue('10:00');
    expect(minInput()).toHaveValue(10);
    expect(maxInput()).toHaveValue(50);
    expect(minInput()).toBeEnabled();

    expect(markerPosition()).toBe(`${start.lat},${start.lng}`);
    expect(popupText()).toBe('The Social Hub');
    expect(leafletMock.maps).toHaveLength(1);
    expect(leafletMock.maps[0]?.initialCenter).toEqual(start);
    expect(leafletMock.maps[0]?.initialZoom).toBe(13);

    expect(fetchCalls.map((call) => call.url)).toEqual([startUrl]);
    expect(weatherRows()[0]).toEqual(['Current weather in Vienna']);
    expect(weatherRows()[1]).toEqual(['Latitude', String(start.lat)]);
  });

  test('end-to-end: set distances and time, start, elapse -> random destination within [min, max] on map and weather; reset returns to start', async () => {
    // 1st draw: distance (20 + 0.5 * 10 = 25 km), 2nd draw: bearing (0.25 * 360 = 90°)
    mockMathRandom([0.5, 0.25]);
    render(<App />);
    await flushPromises();

    setDistances('20', '30');
    expect(minInput()).toHaveValue(20);
    expect(maxInput()).toHaveValue(30);

    startCountdown('10:01');
    expect(countdownDisplay()).toEqual(['0', '00', '01', '00']);
    // Form lock while running
    expect(minInput()).toBeDisabled();
    expect(maxInput()).toBeDisabled();
    expect(dateInput()).toBeDisabled();
    expect(timeInput()).toBeDisabled();
    // Map re-aligned on start (align prop), nothing else changes yet
    expect(leafletMock.setViewCalls).toEqual([
      { mapId: 1, center: start, zoom: 13 },
    ]);
    expect(fetchCalls).toHaveLength(1);
    expect(popupText()).toBe('The Social Hub');

    advance(30_000);
    expect(countdownDisplay()).toEqual(['0', '00', '00', '30']);
    expect(markerPosition()).toBe(`${start.lat},${start.lng}`);

    advance(30_000);
    await flushPromises();
    const destination = expectedDestination(25, 90);

    // Countdown is idle again and the form is unlocked
    expect(countdownDisplay()).toEqual(['-', '--', '--', '--']);
    expect(minInput()).toBeEnabled();
    expect(dateInput()).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Start Countdown' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();

    // Map
    expect(markerPosition()).toBe(`${destination.lat},${destination.lng}`);
    expect(popupText()).toBe('Your Destination');
    expect(leafletMock.setViewCalls.at(-1)).toEqual({
      mapId: 1,
      center: destination,
      zoom: 13,
    });
    expect(leafletMock.maps).toHaveLength(1);
    const distance = distanceFromStartKm(destination);
    expect(distance).toBeGreaterThanOrEqual(20);
    expect(distance).toBeLessThanOrEqual(30 * 1.002);

    // Weather
    expect(fetchCalls).toHaveLength(2);
    expect(weatherUrlParams(fetchCalls[1]?.url ?? '')).toEqual({
      origin: 'https://api.openweathermap.org',
      pathname: '/data/2.5/weather',
      lat: String(destination.lat),
      lon: String(destination.lng),
      appid: 'test-api-key',
    });
    expect(weatherRows()).toEqual([
      ['Current weather in Somewhere'],
      ['Latitude', String(destination.lat)],
      ['Longitude', String(destination.lng)],
      ['Weather', 'LIGHT RAIN'],
      ['Temperature °C', '15'],
      ['Feels like °C', '14.4'],
      ['Humidity %', '81'],
    ]);

    // NOTE: possible bug: after the countdown elapsed there is no Reset button,
    // the only way back to the start location is to start and reset a new countdown
    startCountdown('10:05');
    // Starting keeps the previous destination
    expect(markerPosition()).toBe(`${destination.lat},${destination.lng}`);
    advance(10_000);
    userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await flushPromises();

    expect(countdownDisplay()).toEqual(['-', '--', '--', '--']);
    expect(minInput()).toBeEnabled();
    expect(markerPosition()).toBe(`${start.lat},${start.lng}`);
    expect(popupText()).toBe('The Social Hub');
    expect(leafletMock.setViewCalls.at(-1)).toEqual({
      mapId: 1,
      center: start,
      zoom: 13,
    });
    expect(fetchCalls.map((call) => call.url).at(-1)).toBe(startUrl);
    expect(fetchCalls).toHaveLength(3);
    expect(weatherRows()[0]).toEqual(['Current weather in Vienna']);
  });

  test('default distances (10..50 km) are used when the inputs are untouched', async () => {
    mockMathRandom([1, 0]);
    render(<App />);
    await runCountdown(1);
    expect(parsePosition(markerPosition())).toEqual(expectedDestination(50, 0));
  });

  test('reset before the countdown elapses never picks a destination', async () => {
    const random = mockMathRandom([0.5, 0.5]);
    render(<App />);
    await flushPromises();
    startCountdown('10:01');
    advance(20_000);
    userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await flushPromises();
    advance(5 * 60_000);
    await flushPromises();
    expect(random).not.toHaveBeenCalled();
    expect(markerPosition()).toBe(`${start.lat},${start.lng}`);
    expect(popupText()).toBe('The Social Hub');
    // The center did not change (same start coordinates object): no refetch
    expect(fetchCalls).toHaveLength(1);
    // setView on start and on reset (align toggles)
    expect(leafletMock.setViewCalls).toEqual([
      { mapId: 1, center: start, zoom: 13 },
      { mapId: 1, center: start, zoom: 13 },
    ]);
  });

  test('every destination is computed from the fixed start, not from the previous destination', async () => {
    mockMathRandom([0.5, 0.25, 0.5, 0.25]);
    render(<App />);
    await runCountdown(1);
    const first = markerPosition();
    await runCountdown(1);
    expect(markerPosition()).toBe(first);
    expect(parsePosition(first)).toEqual(expectedDestination(30, 90));
    // A new center object each time -> refetch even for an equal destination
    expect(fetchCalls).toHaveLength(3);
  });

  describe('distance clamping (inputs hold strings)', () => {
    test('negative minimum is treated as 0', async () => {
      mockMathRandom([0.5, 0]);
      render(<App />);
      setDistances('-5', '3');
      await runCountdown(1);
      expect(parsePosition(markerPosition())).toEqual(
        expectedDestination(1.5, 0),
      );
    });

    test('maximum smaller than minimum is raised to the minimum', async () => {
      mockMathRandom([0.9, 0.5]);
      render(<App />);
      setDistances('40', '10');
      await runCountdown(1);
      const destination = parsePosition(markerPosition());
      expect(destination).toEqual(expectedDestination(40, 180));
    });

    test('empty inputs are treated as 0 (destination = start)', async () => {
      mockMathRandom([0.7, 0.3]);
      render(<App />);
      setDistances('', '');
      await runCountdown(1);
      const destination = parsePosition(markerPosition());
      expect(destination).toEqual(expectedDestination(0, 0.3 * 360));
      expect(destination.lat).toBeCloseTo(start.lat, 10);
      expect(destination.lng).toBeCloseTo(start.lng, 10);
      expect(popupText()).toBe('Your Destination');
    });

    test('decimal inputs are used as is', async () => {
      mockMathRandom([0.5, 0.75]);
      render(<App />);
      setDistances('2.5', '7.5');
      await runCountdown(1);
      expect(parsePosition(markerPosition())).toEqual(
        expectedDestination(5, 270),
      );
    });
  });

  test('starting with a time in the past alerts and keeps everything unchanged', async () => {
    render(<App />);
    await flushPromises();
    startCountdown('09:59');
    expect(window.alert).toHaveBeenCalledTimes(1);
    expect(minInput()).toBeEnabled();
    expect(leafletMock.setViewCalls).toEqual([]);
    expect(fetchCalls).toHaveLength(1);
  });
});
