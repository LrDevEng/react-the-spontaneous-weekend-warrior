import { describe, expect, test } from '@jest/globals';
import {
  kelvinToCelcius,
  parseDateToTfs,
  parseSecondsToTfs,
} from '../../utils/Parsers';

const minute = 60;
const hour = 60 * minute;
const day = 24 * hour;

describe('parseSecondsToTfs', () => {
  test('0 seconds', () => {
    expect(parseSecondsToTfs(0)).toEqual({
      days: '0',
      hours: '00',
      minutes: '00',
      seconds: '00',
    });
  });

  test.each([
    [1, { days: '0', hours: '00', minutes: '00', seconds: '01' }],
    [9, { days: '0', hours: '00', minutes: '00', seconds: '09' }],
    [59, { days: '0', hours: '00', minutes: '00', seconds: '59' }],
    [60, { days: '0', hours: '00', minutes: '01', seconds: '00' }],
    [61, { days: '0', hours: '00', minutes: '01', seconds: '01' }],
    [3599, { days: '0', hours: '00', minutes: '59', seconds: '59' }],
    [3600, { days: '0', hours: '01', minutes: '00', seconds: '00' }],
    [36_000, { days: '0', hours: '10', minutes: '00', seconds: '00' }],
    [86_399, { days: '0', hours: '23', minutes: '59', seconds: '59' }],
    [86_400, { days: '1', hours: '00', minutes: '00', seconds: '00' }],
    [
      2 * day + 3 * hour + 4 * minute + 5,
      { days: '2', hours: '03', minutes: '04', seconds: '05' },
    ],
    // Days are not padded and not capped
    [
      123 * day + 23 * hour + 59 * minute + 59,
      { days: '123', hours: '23', minutes: '59', seconds: '59' },
    ],
    [
      1_000_000_000,
      { days: '11574', hours: '01', minutes: '46', seconds: '40' },
    ],
  ])('%p seconds', (input, expected) => {
    expect(parseSecondsToTfs(input)).toEqual(expected);
  });

  test('all fields are strings', () => {
    const result = parseSecondsToTfs(day + hour + minute + 1);
    expect(Object.keys(result).sort()).toEqual([
      'days',
      'hours',
      'minutes',
      'seconds',
    ]);
    for (const value of Object.values(result)) {
      expect(typeof value).toBe('string');
    }
  });

  // -1 is the "no countdown running" value used by CountDownTimer;
  // CountDownCard detects it via `time.seconds < 0`
  test('-1 (idle value of the countdown)', () => {
    expect(parseSecondsToTfs(-1)).toEqual({
      days: '-1',
      hours: '-1',
      minutes: '-1',
      seconds: '-1',
    });
  });

  // NOTE: possible bug: negative inputs other than -1 produce mixed results
  // (floor of negatives, '-0' printed as '00'); only -1 is used by the app
  test('other negative values (current behavior)', () => {
    expect(parseSecondsToTfs(-60)).toEqual({
      days: '-1',
      hours: '-1',
      minutes: '-1',
      seconds: '00',
    });
    expect(parseSecondsToTfs(-3661)).toEqual({
      days: '-1',
      hours: '-2',
      minutes: '-2',
      seconds: '-1',
    });
  });

  test('fractional seconds are kept in the seconds field', () => {
    expect(parseSecondsToTfs(61.5)).toEqual({
      days: '0',
      hours: '00',
      minutes: '01',
      seconds: '1.5',
    });
  });

  test('NaN', () => {
    expect(parseSecondsToTfs(Number.NaN)).toEqual({
      days: 'NaN',
      hours: 'NaN',
      minutes: 'NaN',
      seconds: 'NaN',
    });
  });

  test('round-trip: fields add back up to the input', () => {
    for (let sec = 0; sec < 3 * day; sec += 977) {
      const { days, hours, minutes, seconds } = parseSecondsToTfs(sec);
      expect(
        Number(days) * day +
          Number(hours) * hour +
          Number(minutes) * minute +
          Number(seconds),
      ).toBe(sec);
      expect(Number(hours)).toBeLessThan(24);
      expect(Number(minutes)).toBeLessThan(60);
      expect(Number(seconds)).toBeLessThan(60);
    }
  });
});

describe('parseDateToTfs', () => {
  test('pads month, day, hours and minutes (local time)', () => {
    expect(parseDateToTfs(new Date(2026, 0, 5, 3, 7, 9))).toEqual({
      date: '2026-01-05',
      time: '03:07',
    });
  });

  test('two-digit values are unchanged', () => {
    expect(parseDateToTfs(new Date(2026, 11, 31, 23, 59, 59, 999))).toEqual({
      date: '2026-12-31',
      time: '23:59',
    });
  });

  test('midnight', () => {
    expect(parseDateToTfs(new Date(2026, 5, 1, 0, 0, 0))).toEqual({
      date: '2026-06-01',
      time: '00:00',
    });
  });

  test('seconds and milliseconds are dropped (truncated, not rounded)', () => {
    expect(parseDateToTfs(new Date(2026, 5, 1, 10, 0, 59, 999))).toEqual({
      date: '2026-06-01',
      time: '10:00',
    });
  });

  test('leap day', () => {
    expect(parseDateToTfs(new Date(2028, 1, 29, 12, 30))).toEqual({
      date: '2028-02-29',
      time: '12:30',
    });
  });

  test('round-trip with the "<date>T<time>:00" string used by CountDownTimer', () => {
    const original = new Date(2026, 6, 14, 18, 45, 0, 0);
    const { date, time } = parseDateToTfs(original);
    expect(new Date(`${date}T${time}:00`).getTime()).toBe(original.getTime());
  });

  test('round-trip together with parseSecondsToTfs', () => {
    const start = new Date(2026, 5, 1, 10, 0, 0, 0);
    const target = new Date(2026, 5, 3, 12, 34, 0, 0);
    const { date, time } = parseDateToTfs(target);
    const diffSeconds =
      (new Date(`${date}T${time}:00`).getTime() - start.getTime()) / 1000;
    expect(parseSecondsToTfs(diffSeconds)).toEqual({
      days: '2',
      hours: '02',
      minutes: '34',
      seconds: '00',
    });
  });
});

describe('kelvinToCelcius', () => {
  test.each([
    [273.15, 0],
    [0, -273.15],
    [373.15, 373.15 - 273.15],
    [300, 300 - 273.15],
    [-10, -283.15],
  ])('%p K', (kelvin, celsius) => {
    expect(kelvinToCelcius(kelvin)).toBe(celsius);
  });

  test('plain subtraction (no rounding)', () => {
    expect(kelvinToCelcius(300)).toBe(26.850000000000023);
  });
});
