import { describe, expect, test } from '@jest/globals';
import App from '../App';
import CountDownCard from '../components/CountDownCard';
import CountDownTimer from '../components/CountDownTimer';
import DateTimePicker from '../components/DateTimePicker';
import DestinationForm from '../components/DestinationForm';
import Map from '../components/Map';
import Weather from '../components/Weather';
import type { Coordinates, CountDownTime, WeatherData } from '../types';
import { computeRandomDestination } from '../utils/GeoData';
import {
  kelvinToCelcius,
  parseDateToTfs,
  parseSecondsToTfs,
} from '../utils/Parsers';
import { isWeatherData } from '../utils/WeatherApi';

// Compile-time contract, checked by `pnpm exec tsc --noEmit` (which includes
// the test files). Every `@ts-expect-error` line must be a type error: if a
// component or function becomes loosely typed again (props or parameters
// `any`), the directive is unused and tsc fails. The functions below are
// never called at runtime.

const c: Coordinates = { lat: 48.2, lng: 16.4 };
const noop = () => {};
const time: CountDownTime = {
  days: '0',
  hours: '00',
  minutes: '00',
  seconds: '00',
};

const pickerProps = {
  date: '2026-06-01',
  setDate: noop,
  time: '10:00',
  setTime: noop,
  disabled: false,
};

const formProps = {
  minDist: '10',
  setMinDist: noop,
  maxDist: 50,
  setMaxDist: noop,
  disabled: false,
};

function componentChecks() {
  return [
    // Valid usage compiles
    <App key="app" />,
    <Map key="m" center={c} zoom={13} popUp="a" align={false} />,
    <Weather key="w" center={c} />,
    <CountDownCard key="c" time={time} />,
    // @ts-expect-error Map requires `center`
    <Map key="m1" zoom={13} popUp="a" align={false} />,
    // @ts-expect-error Map `center` must be coordinates
    <Map key="m2" center="x" zoom={13} popUp="a" align={false} />,
    // @ts-expect-error Map `zoom` must be a number
    <Map key="m3" center={c} zoom="13" popUp="a" align={false} />,
    // @ts-expect-error Weather `center` must be coordinates
    <Weather key="w1" center="x" />,
    // @ts-expect-error Weather `center` needs `lng`
    <Weather key="w2" center={{ lat: 1 }} />,
    // @ts-expect-error Weather has no other props
    <Weather key="w3" center={c} unknownProp />,
    // @ts-expect-error App takes no props
    <App key="a1" unknownProp />,
    // @ts-expect-error CountDownCard `time` fields are strings
    <CountDownCard key="c1" time={{ ...time, seconds: -1 }} />,
    // @ts-expect-error CountDownTimer requires its callbacks
    <CountDownTimer key="t1" handleTimerStart={noop} />,
    // @ts-expect-error DateTimePicker `disabled` must be a boolean
    <DateTimePicker key="d1" {...pickerProps} disabled="yes" />,
    // @ts-expect-error DestinationForm `setMinDist` must be a function
    <DestinationForm key="f1" {...formProps} setMinDist="x" />,
  ];
}

function functionChecks(value: unknown) {
  // Valid usage and return types
  const destination: Coordinates = computeRandomDestination(c, 50, 10);
  const tfs: CountDownTime = parseSecondsToTfs(60);
  const input: { date: string; time: string } = parseDateToTfs(new Date());
  const celsius: number = kelvinToCelcius(300);

  // @ts-expect-error string distances are rejected
  computeRandomDestination(c, '50', '10');
  // @ts-expect-error the start must be coordinates
  computeRandomDestination({ lat: 1 }, 50, 10);
  // @ts-expect-error the result has no `latitude`
  const wrongField: unknown = computeRandomDestination(c, 50, 10).latitude;
  // @ts-expect-error seconds must be a number
  parseSecondsToTfs('60');
  // @ts-expect-error a Date is required
  parseDateToTfs('2026-06-01');
  // @ts-expect-error kelvin must be a number
  kelvinToCelcius('300');

  // isWeatherData narrows unknown to WeatherData
  // @ts-expect-error not narrowed yet
  const notNarrowed: unknown = value.main;
  if (isWeatherData(value)) {
    const data: WeatherData = value;
    const humidity: number = value.main.humidity;
    return [data, humidity, destination, tfs, input, celsius, wrongField];
  }
  return [notNarrowed];
}

describe('type-level contract', () => {
  test('compile-time checks exist (enforced by tsc, not at runtime)', () => {
    expect(typeof componentChecks).toBe('function');
    expect(typeof functionChecks).toBe('function');
  });
});
