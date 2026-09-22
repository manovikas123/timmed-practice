import { useCallback, useEffect, useRef, useState } from "react";

export type StopwatchStatus = "idle" | "running" | "paused";

interface UseStopwatchResult {
  status: StopwatchStatus;
  elapsedMs: number;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

const TICK_MS = 100;

/**
 * A plain count-up stopwatch. No beeps, no repeating interval — just
 * elapsed time from the moment Start is pressed until Stop is pressed.
 * Uses timestamp-based math (not a naive incrementing counter) so it
 * doesn't drift even if the tab is backgrounded/throttled.
 */
export function useStopwatch(): UseStopwatchResult {
  const [status, setStatus] = useState<StopwatchStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const statusRef = useRef<StopwatchStatus>("idle");
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});

  // elapsedBaseRef banks whole ms from prior running segments (before the
  // most recent pause); segmentStartRef is when the current running
  // segment began. Total elapsed = base + (now - segmentStart).
  const elapsedBaseRef = useRef(0);
  const segmentStartRef = useRef(0);

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
    setElapsedMs(elapsedBaseRef.current + (now - segmentStartRef.current));
    const delay = Math.max(0, TICK_MS - (Date.now() - now));
    rafRef.current = window.setTimeout(() => tickRef.current(), delay);
  }, []);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const start = useCallback(() => {
    if (statusRef.current === "running") return; // guard against double-start
    clearLoop();
    elapsedBaseRef.current = 0;
    segmentStartRef.current = Date.now();
    setElapsedMs(0);
    setStatus("running");
    statusRef.current = "running";
    rafRef.current = window.setTimeout(tick, TICK_MS);
  }, [clearLoop, tick]);

  const stop = useCallback(() => {
    clearLoop();
    elapsedBaseRef.current = 0;
    segmentStartRef.current = 0;
    setElapsedMs(0);
    setStatus("idle");
    statusRef.current = "idle";
  }, [clearLoop]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    clearLoop();
    elapsedBaseRef.current += Date.now() - segmentStartRef.current;
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

  return { status, elapsedMs, start, stop, pause, resume };
}
