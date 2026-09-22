interface BigTimeDisplayProps {
  /** Pre-formatted time string, e.g. "00:24" or "1:02:03". */
  value: string;
  isPulsing?: boolean;
  isRunning?: boolean;
  label?: string;
}

export function BigTimeDisplay({ value, isPulsing, isRunning, label }: BigTimeDisplayProps) {
  return (
    <div
      className={`timer-display ${isPulsing ? "timer-display--pulse" : ""} ${
        isRunning ? "timer-display--running" : ""
      }`}
      role="timer"
      aria-live="off"
      aria-label={label}
    >
      {value}
    </div>
  );
}
