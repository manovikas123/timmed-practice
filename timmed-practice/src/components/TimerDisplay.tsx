import { formatMs } from "../utils/time";

interface TimerDisplayProps {
  remainingMs: number;
  isPulsing: boolean;
  isRunning: boolean;
}

export function TimerDisplay({ remainingMs, isPulsing, isRunning }: TimerDisplayProps) {
  return (
    <div
      className={`timer-display ${isPulsing ? "timer-display--pulse" : ""} ${
        isRunning ? "timer-display--running" : ""
      }`}
      role="timer"
      aria-live="off"
    >
      {formatMs(remainingMs)}
    </div>
  );
}
