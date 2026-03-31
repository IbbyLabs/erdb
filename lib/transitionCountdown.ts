export const formatCountdownToMidnight = (nowMs: number) => {
  const nextMidnight = new Date(nowMs);
  nextMidnight.setHours(24, 0, 0, 0);
  const remainingMs = Math.max(0, nextMidnight.getTime() - nowMs);
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0 && minutes <= 0) {
    return 'less than 1m';
  }

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};
