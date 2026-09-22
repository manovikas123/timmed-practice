import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep, playBeepSequence, unlockAudio } from "../../utils/beep";

export type SessionStatus = "idle" | "running" | "paused" | "finished";

interface UsePracticeSessionResult {
  status: SessionStatus;
  /** Milliseconds left in the whole practice session. */
  remainingTotalMs: number;
  /** Milliseconds left in the current sub-interval (the "every 10 sec" beep). */
  remainingSubMs: number;
  /** How many sub-interval beeps have fired so far. */
  completedSubIntervals: number;
  /** Start a session: total session length and the repeating sub-interval length, both in ms. */
  start: (totalDurationMs: number, subIntervalMs: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

const TICK_MS = 100;

/**
 * A practice session = a total duration (e.g. 30 minutes) during which a
 * single beep repeats on a shorter sub-interval (e.g. every 10 seconds),
 * the same way `useIntervalTimer` does. When the *total* session time
 * runs out, the sub-interval beeping stops and a distinct 5-beep signal
 * plays once to mark the end of the whole session.
 *
 * Both clocks are timestamp-based (targetTime - now), so neither drifts
 * over a long session even if the tab is throttled in the background.
 */
export function usePracticeSession(): UsePracticeSessionResult {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [remainingTotalMs, setRemainingTotalMs] = useState(0);
  const [remainingSubMs, setRemainingSubMs] = useState(0);
  const [completedSubIntervals, setCompletedSubIntervals] = useState(0);

  const statusRef = useRef<SessionStatus>("idle");
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});

  const totalDurationRef = useRef(0);
  const subDurationRef = useRef(0);
  const totalTargetRef = useRef(0); // timestamp when the whole session ends
  const subTargetRef = useRef(0); // timestamp when the next sub-interval beep fires

  const pausedTotalRemainingRef = useRef(0);
  const pausedSubRemainingRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearLoop = useCallback(() => {
    if (rafRef.current !== null) {
      window.clearTimeout(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (statusRef.current !== "running") return;

    const now = Date.now();
    const totalRemaining = totalTargetRef.current - now;

    if (totalRemaining <= 0) {
      // Whole session is over: stop sub-interval beeping and fire the
      // distinct end-of-session signal exactly once.
      clearLoop();
      playBeepSequence(5);
      setRemainingTotalMs(0);
      setRemainingSubMs(0);
      setStatus("finished");
      statusRef.current = "finished";
      return;
    }

    let subRemaining = subTargetRef.current - now;
    const subDuration = subDurationRef.current;
    let crossed = 0;
    while (subRemaining <= 0 && subDuration > 0) {
      subTargetRef.current += subDuration;
      subRemaining = subTargetRef.current - now;
      crossed += 1;
    }
    if (crossed > 0) {
      playBeep();
      setCompletedSubIntervals((c) => c + crossed);
    }

    setRemainingTotalMs(totalRemaining);
    setRemainingSubMs(Math.max(0, subRemaining));

    const delay = Math.max(0, TICK_MS - (Date.now() - now));
    rafRef.current = window.setTimeout(() => tickRef.current(), delay);
  }, [clearLoop]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const start = useCallback(
    (totalDurationMs: number, subIntervalMs: number) => {
      if (totalDurationMs <= 0 || subIntervalMs <= 0) return;
      if (statusRef.current === "running") return; // guard against double-start

      clearLoop();
      void unlockAudio();

      const now = Date.now();
      totalDurationRef.current = totalDurationMs;
      subDurationRef.current = subIntervalMs;
      totalTargetRef.current = now + totalDurationMs;
      subTargetRef.current = now + subIntervalMs;

      setRemainingTotalMs(totalDurationMs);
      setRemainingSubMs(subIntervalMs);
      setCompletedSubIntervals(0);
      setStatus("running");
      statusRef.current = "running";

      rafRef.current = window.setTimeout(tick, TICK_MS);
    },
    [clearLoop, tick]
  );

  const stop = useCallback(() => {
    clearLoop();
    setStatus("idle");
    statusRef.current = "idle";
    setRemainingTotalMs(0);
    setRemainingSubMs(0);
    setCompletedSubIntervals(0);
    pausedTotalRemainingRef.current = 0;
    pausedSubRemainingRef.current = 0;
  }, [clearLoop]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    clearLoop();
    const now = Date.now();
    pausedTotalRemainingRef.current = Math.max(0, totalTargetRef.current - now);
    pausedSubRemainingRef.current = Math.max(0, subTargetRef.current - now);
    setStatus("paused");
    statusRef.current = "paused";
  }, [clearLoop]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    void unlockAudio();
    const now = Date.now();
    totalTargetRef.current = now + pausedTotalRemainingRef.current;
    subTargetRef.current = now + pausedSubRemainingRef.current;
    setStatus("running");
    statusRef.current = "running";
    rafRef.current = window.setTimeout(tick, TICK_MS);
  }, [tick]);

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
    remainingTotalMs,
    remainingSubMs,
    completedSubIntervals,
    start,
    stop,
    pause,
    resume,
  };
}
