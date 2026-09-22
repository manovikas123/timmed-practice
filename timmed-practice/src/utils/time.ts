/** Formats milliseconds as M:SS or MM:SS (minutes not zero-padded to 2 unless >= 10). */
export function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Formats a whole-second duration as a friendly "Xs" / "Mm Ss" string. */
export function formatSecondsFriendly(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} sec`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes}m ${seconds}s`;
}
