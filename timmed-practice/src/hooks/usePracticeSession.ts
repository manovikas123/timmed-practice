import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep, playBeepSequence, unlockAudio } from "../utils/beep";

export type SessionStatus = "idle" | "running" | "paused" | "finished";

interface UsePracticeSessionResult {
  status: SessionStatus;
  /** Milliseconds remaining in the whole session (counts down to 0). */
  remainingSessionMs: number;
  /** Milliseconds remaining until the next interval beep. */
  remainingIntervalMs: number;
  /** Number of interval beeps fired so far. */
  completedIntervals: number;
  /** Start a session of `totalMs` that beeps every `intervalMs`. */
  start: (totalMs: number, intervalMs: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

const TICK_MS = 100;
/** Number of beeps played back-to-back when the session finishes. */
const FINISH_BEEPS = 5;

/**
 * A bounded practice session: it runs for a fixed total duration and beeps
 * once every interval along the way. When the total duration elapses, it
 * plays a run of five beeps to signal the end and stops.
 *
 * Both the session countdown and the interval cadence are timestamp-driven
 * so neither drifts, and background-tab throttling is caught up on the next
 * tick / visibility change.
 */
export function usePracticeSession(): UsePracticeSessionResult {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [remainingSessionMs, setRemainingSessionMs] = useState(0);
  const [remainingIntervalMs, setRemainingIntervalMs] = useState(0);
  const [completedIntervals, setCompletedIntervals] = useState(0);

  const intervalMsRef = useRef(0);
  const intervalTargetRef = useRef(0); // timestamp next beep is due
  const sessionEndRef = useRef(0); // timestamp session ends
  const pausedIntervalRef = useRef(0);
  const pausedSessionRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<SessionStatus>("idle");
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearLoop = useCallback(() => {
    if (rafRef.current !== null) {
      window.clearTimeout(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearLoop();
    setRemainingSessionMs(0);
    setRemainingIntervalMs(0);
    setStatus("finished");
    statusRef.current = "finished";
    playBeepSequence(FINISH_BEEPS);
  }, [clearLoop]);

  const tick = useCallback(() => {
    if (statusRef.current !== "running") return;

    const now = Date.now();
    const sessionRemaining = sessionEndRef.current - now;

    if (sessionRemaining <= 0) {
      finish();
      return;
    }

    let intervalRemaining = intervalTargetRef.current - now;
    if (intervalRemaining <= 0) {
      const duration = intervalMsRef.current;
      let crossed = 0;
      while (intervalRemaining <= 0 && duration > 0) {
        intervalTargetRef.current += duration;
        intervalRemaining = intervalTargetRef.current - now;
        crossed += 1;
      }
      if (crossed > 0) {
        playBeep();
        setCompletedIntervals((c) => c + crossed);
      }
    }

    setRemainingSessionMs(Math.max(0, sessionRemaining));
    // Never show an interval countdown longer than the session has left.
    setRemainingIntervalMs(Math.max(0, Math.min(intervalRemaining, sessionRemaining)));

    const spent = Date.now() - now;
    const delay = Math.max(0, TICK_MS - spent);
    rafRef.current = window.setTimeout(() => tickRef.current(), delay);
  }, [finish]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const start = useCallback(
    (totalMs: number, intervalMs: number) => {
      if (totalMs <= 0 || intervalMs <= 0) return;
      if (statusRef.current === "running") return;

      clearLoop();
      void unlockAudio();

      const now = Date.now();
      intervalMsRef.current = intervalMs;
      intervalTargetRef.current = now + intervalMs;
      sessionEndRef.current = now + totalMs;
      setRemainingIntervalMs(intervalMs);
      setRemainingSessionMs(totalMs);
      setCompletedIntervals(0);
      setStatus("running");
      statusRef.current = "running";

      rafRef.current = window.setTimeout(tick, TICK_MS);
    },
    [clearLoop, tick]
  );

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    clearLoop();
    const now = Date.now();
    pausedIntervalRef.current = Math.max(0, intervalTargetRef.current - now);
    pausedSessionRef.current = Math.max(0, sessionEndRef.current - now);
    setStatus("paused");
    statusRef.current = "paused";
  }, [clearLoop]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    void unlockAudio();
    const now = Date.now();
    intervalTargetRef.current = now + pausedIntervalRef.current;
    sessionEndRef.current = now + pausedSessionRef.current;
    setStatus("running");
    statusRef.current = "running";
    rafRef.current = window.setTimeout(tick, TICK_MS);
  }, [tick]);

  const stop = useCallback(() => {
    clearLoop();
    setStatus("idle");
    statusRef.current = "idle";
    setRemainingSessionMs(0);
    setRemainingIntervalMs(0);
    setCompletedIntervals(0);
  }, [clearLoop]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && statusRef.current === "running") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [tick]);

  useEffect(() => () => clearLoop(), [clearLoop]);

  return {
    status,
    remainingSessionMs,
    remainingIntervalMs,
    completedIntervals,
    start,
    stop,
    pause,
    resume,
  };
}
