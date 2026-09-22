interface BigDisplayProps {
  label: string;
  value: string;
  isPulsing?: boolean;
  isRunning?: boolean;
}

/** A single labeled time readout used across the tabs. */
export function BigDisplay({ label, value, isPulsing = false, isRunning = false }: BigDisplayProps) {
  return (
    <div className="timer-panel">
      <span className="timer-panel__label">{label}</span>
      <div
        className={`timer-display ${isPulsing ? "timer-display--pulse" : ""} ${
          isRunning ? "timer-display--running" : ""
        }`}
        role="timer"
        aria-live="off"
      >
        {value}
      </div>
    </div>
  );
}
