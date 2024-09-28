const secondsPerDay = 60 * 60 * 24;
const secondsPerHour = 60 * 60;
const secondsPerMinute = 60;

// Function to parse seconds to time format string {day: <DD..>, hours: <HH>, minutes: <MM>, seconds: <SS>}
export function parseSecondsToTfs(sec) {
  sec = Number(sec);

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
export function parseDateToTfs(date) {
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

export function kelvinToCelcius(kelvin) {
  return kelvin - 273.15;
}
