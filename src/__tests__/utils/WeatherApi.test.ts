import { describe, expect, test } from '@jest/globals';
import { weatherResponse } from '../../testUtils/fetchMock';
import { isWeatherData } from '../../utils/WeatherApi';

describe('isWeatherData', () => {
  test('a valid OpenWeatherMap response is weather data', () => {
    expect(isWeatherData(weatherResponse())).toBe(true);
  });

  test('only truthy `weather` and `main` are required', () => {
    expect(isWeatherData({ weather: [], main: {} })).toBe(true);
    expect(isWeatherData({ weather: 1, main: 'x' })).toBe(true);
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['0', 0],
    ['1', 1],
    ['NaN', Number.NaN],
    ['empty string', ''],
    ['string', 'weather'],
    ['true', true],
    ['false', false],
    ['symbol', Symbol('weather')],
    ['bigint', BigInt(1)],
    ['function', () => ({ weather: [], main: {} })],
  ])('%s is not weather data', (label, value) => {
    expect(isWeatherData(value)).toBe(false);
  });

  test.each([
    ['empty array', []],
    ['array of responses', [weatherResponse()]],
  ])('%s is not weather data', (label, value) => {
    expect(isWeatherData(value)).toBe(false);
  });

  test.each([
    ['{ cod, message }', { cod: 401, message: 'Invalid API key.' }],
    ['{ cod } without a message', { cod: '404' }],
    ['empty object', {}],
  ])('API error object %s is not weather data', (label, value) => {
    expect(isWeatherData(value)).toBe(false);
  });

  const { weather: _weather, ...withoutWeather } = weatherResponse();
  const { main: _main, ...withoutMain } = weatherResponse();

  test.each([
    ['missing weather', withoutWeather],
    ['missing main', withoutMain],
    ['weather: null', { ...weatherResponse(), weather: null }],
    ['weather: undefined', { ...weatherResponse(), weather: undefined }],
    ['weather: 0', { ...weatherResponse(), weather: 0 }],
    ['weather: empty string', { ...weatherResponse(), weather: '' }],
    ['weather: false', { ...weatherResponse(), weather: false }],
    ['main: null', { ...weatherResponse(), main: null }],
    ['main: 0', { ...weatherResponse(), main: 0 }],
    ['main: empty string', { ...weatherResponse(), main: '' }],
    ['main: false', { ...weatherResponse(), main: false }],
    ['main: NaN', { ...weatherResponse(), main: Number.NaN }],
  ])('%s is not weather data', (label, value) => {
    expect(isWeatherData(value)).toBe(false);
  });

  test('properties inherited from the prototype count (like `obj.weather` did)', () => {
    const inherited = Object.create({ weather: [], main: {} }) as object;
    expect(isWeatherData(inherited)).toBe(true);
  });
});
