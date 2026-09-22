import { formatMs, formatElapsedMs } from "../utils/time";

interface TimerDisplayProps {
  /** Milliseconds remaining until the next beep (interval countdown). */
  remainingMs: number;
  /** Total elapsed session time in ms, counting up like a stopwatch. */
  elapsedMs: number;
  isPulsing: boolean;
  isRunning: boolean;
}

export function TimerDisplay({ remainingMs, elapsedMs, isPulsing, isRunning }: TimerDisplayProps) {
  return (
    <div className="timer-panels">
      <div className="timer-panel">
        <span className="timer-panel__label">Stopwatch</span>
        <div
          className={`timer-display timer-display--stopwatch ${
            isRunning ? "timer-display--running" : ""
          }`}
          role="timer"
          aria-live="off"
        >
          {formatElapsedMs(elapsedMs)}
        </div>
      </div>

      <div className="timer-panel">
        <span className="timer-panel__label">Next beep in</span>
        <div
          className={`timer-display timer-display--interval ${
            isPulsing ? "timer-display--pulse" : ""
          } ${isRunning ? "timer-display--running" : ""}`}
          role="timer"
          aria-live="off"
        >
          {formatMs(remainingMs)}
        </div>
      </div>
    </div>
  );
}
