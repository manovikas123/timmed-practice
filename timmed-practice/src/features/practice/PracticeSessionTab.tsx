import { useState } from "react";
import { BigTimeDisplay } from "../../components/BigTimeDisplay";
import { DurationInput } from "../../components/DurationInput";
import { formatMs, formatSecondsFriendly } from "../../utils/time";
import { usePracticeSession } from "./usePracticeSession";

const SESSION_PRESETS = [
  { label: "10 min", minutes: 10, seconds: 0 },
  { label: "20 min", minutes: 20, seconds: 0 },
  { label: "30 min", minutes: 30, seconds: 0 },
  { label: "45 min", minutes: 45, seconds: 0 },
  { label: "1 hr", minutes: 60, seconds: 0 },
];

const SUB_INTERVAL_PRESETS = [
  { label: "5s", minutes: 0, seconds: 5 },
  { label: "10s", minutes: 0, seconds: 10 },
  { label: "15s", minutes: 0, seconds: 15 },
  { label: "30s", minutes: 0, seconds: 30 },
  { label: "1:00", minutes: 1, seconds: 0 },
];

function validateDuration(minutes: number, seconds: number): string | null {
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return "Please enter valid numbers.";
  if (minutes < 0 || seconds < 0) return "Values cannot be negative.";
  if (seconds > 59) return "Seconds must be between 0 and 59.";
  if (minutes === 0 && seconds === 0) return "Duration must be greater than 0.";
  return null;
}

export function PracticeSessionTab() {
  const [sessionMinutes, setSessionMinutes] = useState(30);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [subMinutes, setSubMinutes] = useState(0);
  const [subSeconds, setSubSeconds] = useState(10);

  const {
    status,
    remainingTotalMs,
    remainingSubMs,
    completedSubIntervals,
    start,
    stop,
    pause,
    resume,
  } = usePracticeSession();

  const sessionDurationMs = (sessionMinutes * 60 + sessionSeconds) * 1000;
  const subIntervalMs = (subMinutes * 60 + subSeconds) * 1000;

  const isEditable = status === "idle" || status === "finished";

  const sessionError = isEditable ? validateDuration(sessionMinutes, sessionSeconds) : null;
  const subError = isEditable ? validateDuration(subMinutes, subSeconds) : null;
  const rangeError =
    isEditable && !sessionError && !subError && subIntervalMs > sessionDurationMs
      ? "Beep interval can't be longer than the session length."
      : null;
  const error = sessionError || subError || rangeError;

  const handleStart = () => {
    if (error) return;
    start(sessionDurationMs, subIntervalMs);
  };

  const handlePauseResume = () => {
    if (status === "running") pause();
    else if (status === "paused") resume();
  };

  const nextBeepSeconds = Math.ceil(remainingSubMs / 1000);

  return (
    <section className="tab-panel" aria-label="Practice Session">
      <p className="tab-panel__blurb">
        A full practice session with its own repeating beep. When the session ends, you get 5
        beeps in a row.
      </p>

      <DurationInput
        idPrefix="session-length"
        legend="Session length"
        minutes={sessionMinutes}
        seconds={sessionSeconds}
        onMinutesChange={setSessionMinutes}
        onSecondsChange={setSessionSeconds}
        disabled={!isEditable}
        error={sessionError}
        presets={SESSION_PRESETS}
      />

      <DurationInput
        idPrefix="session-beep"
        legend="Beep every"
        minutes={subMinutes}
        seconds={subSeconds}
        onMinutesChange={setSubMinutes}
        onSecondsChange={setSubSeconds}
        disabled={!isEditable}
        error={subError ?? rangeError}
        presets={SUB_INTERVAL_PRESETS}
      />

      <BigTimeDisplay
        value={formatMs(status === "idle" ? sessionDurationMs : remainingTotalMs)}
        isRunning={status === "running"}
        label="Time remaining in practice session"
      />

      {(status === "running" || status === "paused") && (
        <p className="sub-interval-line">
          Next beep in <strong>{nextBeepSeconds}s</strong>
        </p>
      )}

      {status === "finished" && (
        <p className="session-complete" role="status">
          🔔 Session complete!
        </p>
      )}

      <div className="controls">
        {status === "idle" || status === "finished" ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleStart}
            disabled={!!error}
          >
            Start
          </button>
        ) : (
          <>
            <button type="button" className="btn btn--secondary" onClick={handlePauseResume}>
              {status === "running" ? "Pause" : "Resume"}
            </button>
            <button type="button" className="btn btn--danger" onClick={stop}>
              Stop
            </button>
          </>
        )}
      </div>

      <dl className="stats">
        <div className="stats__row">
          <dt>Session length</dt>
          <dd>{formatSecondsFriendly(sessionMinutes * 60 + sessionSeconds)}</dd>
        </div>
        <div className="stats__row">
          <dt>Beep every</dt>
          <dd>{formatSecondsFriendly(subMinutes * 60 + subSeconds)}</dd>
        </div>
        <div className="stats__row">
          <dt>Beeps so far</dt>
          <dd>{completedSubIntervals}</dd>
        </div>
      </dl>
    </section>
  );
}
