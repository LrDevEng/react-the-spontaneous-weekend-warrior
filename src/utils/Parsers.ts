import type { CountDownTime, DateTimeInput } from '../types';

const secondsPerDay = 60 * 60 * 24;
const secondsPerHour = 60 * 60;
const secondsPerMinute = 60;

// Function to parse seconds to time format string {day: <DD..>, hours: <HH>, minutes: <MM>, seconds: <SS>}
// NOTE: only meant for whole, non-negative seconds and -1 (idle countdown,
// every field becomes '-1'). Other negative inputs give mixed results (floor of
// negatives, -0 printed as '00', e.g. -60 -> '-1', '-1', '-1', '00') and
// fractional seconds are kept in the seconds field (61.5 -> seconds '1.5');
// this is the current behavior and kept as is.
export function parseSecondsToTfs(sec: number): CountDownTime {
  const days = Math.floor(sec / secondsPerDay);
  const hours = Math.floor((sec % secondsPerDay) / secondsPerHour);
  const minutes = Math.floor(
    ((sec % secondsPerDay) % secondsPerHour) / secondsPerMinute,
  );
  const seconds = ((sec % secondsPerDay) % secondsPerHour) % secondsPerMinute;

  return {
    days: days.toString(),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
}

// Function to parse date to time format string {date: <YYYY-MM-DD>, time: <HH:MM>}
export function parseDateToTfs(date: Date): DateTimeInput {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return {
    date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
  };
}

export function kelvinToCelcius(kelvin: number): number {
  return kelvin - 273.15;
}
