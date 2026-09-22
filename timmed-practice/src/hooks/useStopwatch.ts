import { useCallback, useEffect, useRef, useState } from "react";

export type StopwatchStatus = "idle" | "running" | "paused";

interface UseStopwatchResult {
  status: StopwatchStatus;
  /** Elapsed time in milliseconds, counting up from 0. */
  elapsedMs: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

const TICK_MS = 100;

/**
 * A plain count-up stopwatch. No sound, no intervals — it simply measures
 * elapsed time from Start until Reset, honoring Pause/Resume. Time is
 * derived from timestamps (not a decrementing counter) so it never drifts.
 */
export function useStopwatch(): UseStopwatchResult {
  const [status, setStatus] = useState<StopwatchStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const baseRef = useRef(0); // banked ms from previous running segments
  const segmentStartRef = useRef(0); // timestamp current segment began
  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<StopwatchStatus>("idle");
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

  const tick = useCallback(() => {
    if (statusRef.current !== "running") return;
    setElapsedMs(baseRef.current + (Date.now() - segmentStartRef.current));
    rafRef.current = window.setTimeout(() => tickRef.current(), TICK_MS);
  }, []);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const start = useCallback(() => {
    if (statusRef.current === "running") return;
    clearLoop();
    baseRef.current = 0;
    segmentStartRef.current = Date.now();
    setElapsedMs(0);
    setStatus("running");
    statusRef.current = "running";
    rafRef.current = window.setTimeout(tick, TICK_MS);
  }, [clearLoop, tick]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    clearLoop();
    baseRef.current += Date.now() - segmentStartRef.current;
    setElapsedMs(baseRef.current);
    setStatus("paused");
    statusRef.current = "paused";
  }, [clearLoop]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    segmentStartRef.current = Date.now();
    setStatus("running");
    statusRef.current = "running";
    rafRef.current = window.setTimeout(tick, TICK_MS);
  }, [tick]);

  const reset = useCallback(() => {
    clearLoop();
    baseRef.current = 0;
    segmentStartRef.current = 0;
    setElapsedMs(0);
    setStatus("idle");
    statusRef.current = "idle";
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

  return { status, elapsedMs, start, pause, resume, reset };
}
