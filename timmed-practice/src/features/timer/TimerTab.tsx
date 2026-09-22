import { useEffect, useRef, useState } from "react";
import { BigTimeDisplay } from "../../components/BigTimeDisplay";
import { DurationInput } from "../../components/DurationInput";
import { formatMs, formatSecondsFriendly } from "../../utils/time";
import { useIntervalTimer } from "./useIntervalTimer";

const PRESETS = [
  { label: "10s", minutes: 0, seconds: 10 },
  { label: "15s", minutes: 0, seconds: 15 },
  { label: "30s", minutes: 0, seconds: 30 },
  { label: "45s", minutes: 0, seconds: 45 },
  { label: "1:00", minutes: 1, seconds: 0 },
  { label: "1:30", minutes: 1, seconds: 30 },
  { label: "2:00", minutes: 2, seconds: 0 },
  { label: "5:00", minutes: 5, seconds: 0 },
];

function validateDuration(minutes: number, seconds: number): string | null {
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return "Please enter valid numbers.";
  if (minutes < 0 || seconds < 0) return "Values cannot be negative.";
  if (seconds > 59) return "Seconds must be between 0 and 59.";
  if (minutes === 0 && seconds === 0) return "Duration must be greater than 0.";
  return null;
}

export function TimerTab() {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [isPulsing, setIsPulsing] = useState(false);

  const { status, remainingMs, completedIntervals, start, stop, pause, resume } =
    useIntervalTimer();

  const durationMs = (minutes * 60 + seconds) * 1000;
  const isIdle = status === "idle";
  const error = isIdle ? validateDuration(minutes, seconds) : null;

  const prevCompletedRef = useRef(0);
  useEffect(() => {
    if (completedIntervals > prevCompletedRef.current) {
      setIsPulsing(true);
      const t = window.setTimeout(() => setIsPulsing(false), 400);
      prevCompletedRef.current = completedIntervals;
      return () => window.clearTimeout(t);
    }
    prevCompletedRef.current = completedIntervals;
  }, [completedIntervals]);

  const handleStart = () => {
    if (validateDuration(minutes, seconds)) return;
    start(durationMs);
  };

  const handlePauseResume = () => {
    if (status === "running") pause();
    else if (status === "paused") resume();
  };

  const nextBeepSeconds = Math.ceil(remainingMs / 1000);

  return (
    <section className="tab-panel" aria-label="Timer">
      <p className="tab-panel__blurb">Repeats and beeps every interval until you press Stop.</p>

      <DurationInput
        idPrefix="timer"
        legend="Interval"
        minutes={minutes}
        seconds={seconds}
        onMinutesChange={setMinutes}
        onSecondsChange={setSeconds}
        disabled={!isIdle}
        error={error}
        presets={PRESETS}
      />

      <BigTimeDisplay
        value={formatMs(isIdle ? durationMs : remainingMs)}
        isPulsing={isPulsing}
        isRunning={status === "running"}
        label="Time remaining in current interval"
      />

      <div className="controls">
        {isIdle ? (
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
          <dt>Interval</dt>
          <dd>{formatSecondsFriendly(minutes * 60 + seconds)}</dd>
        </div>
        <div className="stats__row">
          <dt>Next beep in</dt>
          <dd>{isIdle ? "—" : `${nextBeepSeconds}s`}</dd>
        </div>
        <div className="stats__row">
          <dt>Completed</dt>
          <dd>{completedIntervals}</dd>
        </div>
      </dl>
    </section>
  );
}
