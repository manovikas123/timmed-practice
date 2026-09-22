interface Preset {
  label: string;
  minutes: number;
  seconds: number;
}

interface DurationInputProps {
  legend: string;
  minutes: number;
  seconds: number;
  onMinutesChange: (value: number) => void;
  onSecondsChange: (value: number) => void;
  disabled: boolean;
  error?: string | null;
  presets?: Preset[];
  idPrefix: string;
}

export function DurationInput({
  legend,
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  disabled,
  error,
  presets,
  idPrefix,
}: DurationInputProps) {
  return (
    <div className="duration-input">
      <p className="duration-input__legend">{legend}</p>
      <div className="duration-input__fields">
        <label className="duration-input__field" htmlFor={`${idPrefix}-minutes`}>
          <span>Minutes</span>
          <input
            id={`${idPrefix}-minutes`}
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            value={minutes}
            disabled={disabled}
            onChange={(e) => onMinutesChange(Number(e.target.value))}
          />
        </label>
        <span className="duration-input__colon" aria-hidden="true">
          :
        </span>
        <label className="duration-input__field" htmlFor={`${idPrefix}-seconds`}>
          <span>Seconds</span>
          <input
            id={`${idPrefix}-seconds`}
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            value={seconds}
            disabled={disabled}
            onChange={(e) => onSecondsChange(Number(e.target.value))}
          />
        </label>
      </div>

      {error && (
        <p className="duration-input__error" role="alert">
          {error}
        </p>
      )}

      {presets && presets.length > 0 && (
        <div className="duration-input__presets" role="group" aria-label={`${legend} presets`}>
          {presets.map((preset) => (
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
      )}
    </div>
  );
}
