interface IntervalFormProps {
  minutes: number;
  seconds: number;
  onMinutesChange: (value: number) => void;
  onSecondsChange: (value: number) => void;
  disabled: boolean;
  error: string | null;
}

const PRESETS: { label: string; minutes: number; seconds: number }[] = [
  { label: "10s", minutes: 0, seconds: 10 },
  { label: "15s", minutes: 0, seconds: 15 },
  { label: "30s", minutes: 0, seconds: 30 },
  { label: "45s", minutes: 0, seconds: 45 },
  { label: "1:00", minutes: 1, seconds: 0 },
  { label: "1:30", minutes: 1, seconds: 30 },
  { label: "2:00", minutes: 2, seconds: 0 },
  { label: "5:00", minutes: 5, seconds: 0 },
];

export function IntervalForm({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  disabled,
  error,
}: IntervalFormProps) {
  return (
    <div className="interval-form">
      <div className="interval-form__fields">
        <label className="interval-form__field">
          <span>Minutes</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={minutes}
            disabled={disabled}
            onChange={(e) => onMinutesChange(Number(e.target.value))}
            aria-label="Minutes"
          />
        </label>
        <span className="interval-form__colon" aria-hidden="true">
          :
        </span>
        <label className="interval-form__field">
          <span>Seconds</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            value={seconds}
            disabled={disabled}
            onChange={(e) => onSecondsChange(Number(e.target.value))}
            aria-label="Seconds"
          />
        </label>
      </div>

      {error && (
        <p className="interval-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="interval-form__presets" role="group" aria-label="Preset intervals">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="preset-chip"
            disabled={disabled}
            onClick={() => {
              onMinutesChange(preset.minutes);
              onSecondsChange(preset.seconds);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
