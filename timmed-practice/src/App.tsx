import { useEffect, useRef, useState } from "react";
import { IntervalForm } from "./components/IntervalForm";
import { TimerDisplay } from "./components/TimerDisplay";
import { useIntervalTimer } from "./hooks/useIntervalTimer";
import { formatSecondsFriendly } from "./utils/time";
import "./App.css";

function validateDuration(minutes: number, seconds: number): string | null {
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return "Please enter valid numbers.";
  }
  if (minutes < 0 || seconds < 0) {
    return "Values cannot be negative.";
  }
  if (seconds > 59) {
    return "Seconds must be between 0 and 59.";
  }
  if (minutes === 0 && seconds === 0) {
    return "Duration must be greater than 0.";
  }
  return null;
}

function App() {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [isPulsing, setIsPulsing] = useState(false);

  const { status, remainingMs, completedIntervals, elapsedMs, start, stop, pause, resume } =
    useIntervalTimer();

  const durationMs = (minutes * 60 + seconds) * 1000;
  const error = status === "idle" ? validateDuration(minutes, seconds) : null;

  const prevCompletedRef = useRef(0);

  // Trigger a brief visual pulse whenever a beep fires (completedIntervals
  // increments), giving a visible cue alongside the sound.
  useEffect(() => {
    if (completedIntervals > prevCompletedRef.current) {
      setIsPulsing(true);
      const timeout = window.setTimeout(() => setIsPulsing(false), 400);
      prevCompletedRef.current = completedIntervals;
      return () => window.clearTimeout(timeout);
    }
    prevCompletedRef.current = completedIntervals;
  }, [completedIntervals]);

  const handleStart = () => {
    const validationError = validateDuration(minutes, seconds);
    if (validationError) return;
    start(durationMs);
  };

  const handleStop = () => {
    stop();
  };

  const handlePauseResume = () => {
    if (status === "running") {
      pause();
    } else if (status === "paused") {
      resume();
    }
  };

  const isIdle = status === "idle";

  return (
    <div className="app">
      <main className="card">
        <header className="card__header">
          <h1>Timed Practice</h1>
          <p className="subtitle">Repeating interval timer</p>
        </header>

        <IntervalForm
          minutes={minutes}
          seconds={seconds}
          onMinutesChange={setMinutes}
          onSecondsChange={setSeconds}
          disabled={!isIdle}
          error={error}
        />

        <TimerDisplay
          remainingMs={isIdle ? durationMs : remainingMs}
          elapsedMs={elapsedMs}
          isPulsing={isPulsing}
          isRunning={status === "running"}
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
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handlePauseResume}
              >
                {status === "running" ? "Pause" : "Resume"}
              </button>
              <button type="button" className="btn btn--danger" onClick={handleStop}>
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
            <dt>Completed intervals</dt>
            <dd>{completedIntervals}</dd>
          </div>
        </dl>

        {status === "running" && (
          <p className="hint" aria-live="polite">
            Keep this tab open for reliable audio in the background.
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
