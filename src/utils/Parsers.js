const secondsPerDay = 60 * 60 * 24;
const secondsPerHour = 60 * 60;
const secondsPerMinute = 60;

// Function to parse seconds to time format string DDDDD:HH:MM:SS
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
