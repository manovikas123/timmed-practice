import { BigTimeDisplay } from "../../components/BigTimeDisplay";
import { formatElapsedMs } from "../../utils/time";
import { useStopwatch } from "./useStopwatch";

export function StopwatchTab() {
  const { status, elapsedMs, start, stop, pause, resume } = useStopwatch();
  const isIdle = status === "idle";

  const handlePauseResume = () => {
    if (status === "running") pause();
    else if (status === "paused") resume();
  };

  return (
    <section className="tab-panel" aria-label="Stopwatch">
      <p className="tab-panel__blurb">Counts up from zero. No beep — just elapsed time.</p>

      <BigTimeDisplay
        value={formatElapsedMs(elapsedMs)}
        isRunning={status === "running"}
        label="Stopwatch elapsed time"
      />

      <div className="controls">
        {isIdle ? (
          <button type="button" className="btn btn--primary" onClick={start}>
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
          <dt>Status</dt>
          <dd>{status === "idle" ? "Not started" : status === "running" ? "Running" : "Paused"}</dd>
        </div>
      </dl>
    </section>
  );
}
