const secondsPerDay = 60 * 60 * 24;
const secondsPerHour = 60 * 60;
const secondsPerMinute = 60;

// Function to parse seconds to time format string
export function parseSecondsToTfs(sec) {
  sec = Number(sec);

  const days = Math.floor(sec / secondsPerDay);
  const hours = Math.floor((sec % secondsPerDay) / secondsPerHour);
  const minutes = Math.floor(
    ((sec % secondsPerDay) % secondsPerHour) / secondsPerMinute,
  );
  const seconds = ((sec % secondsPerDay) % secondsPerHour) % secondsPerMinute;

  return [
    days.toString(),
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ];
}

// Function to parse date to time format string [<YYYY-MM-DD>,<HH:MM>]
export function parseDateToTfs(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return [
    `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
  ];
}
