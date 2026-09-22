import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep, unlockAudio } from "../utils/beep";

export type TimerStatus = "idle" | "running" | "paused";

interface UseIntervalTimerResult {
  status: TimerStatus;
  /** Milliseconds remaining in the current cycle. */
  remainingMs: number;
  /** Number of full intervals completed (beeps fired) since Start. */
  completedIntervals: number;
  /** Start (or restart) the repeating timer with the given duration. */
  start: (durationMs: number) => void;
  /** Stop the timer entirely and reset to idle. */
  stop: () => void;
  /** Pause without losing the remaining time in the current cycle. */
  pause: () => void;
  /** Resume a paused timer from where it left off. */
  resume: () => void;
}

// How often we re-render the displayed countdown. The *actual* remaining
// time is always derived from timestamps, so this only affects display
// smoothness, not accuracy.
const TICK_MS = 100;

/**
 * A repeating interval timer driven by timestamps rather than a naive
 * `setInterval` decrement. This avoids cumulative drift: every tick we
 * recompute "how much time is left" from `targetTime - Date.now()`
 * instead of subtracting 1 from a counter.
 *
 * When the remaining time reaches zero, we play a beep, roll the target
 * time forward by exactly one interval duration (not "duration from now",
 * which would itself drift), and continue. Because we always add whole
 * multiples of the interval to the *original* start time's cadence, long
 * running sessions stay aligned to the interval boundaries.
 */
export function useIntervalTimer(): UseIntervalTimerResult {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingMs, setRemainingMs] = useState(0);
  const [completedIntervals, setCompletedIntervals] = useState(0);

  const durationRef = useRef(0); // selected interval length, ms
  const targetTimeRef = useRef(0); // timestamp (ms) when current cycle ends
  const pausedRemainingRef = useRef(0); // remaining ms snapshot while paused
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const statusRef = useRef<TimerStatus>("idle");
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

    const now = Date.now();
    let remaining = targetTimeRef.current - now;

    if (remaining <= 0) {
      // One or more intervals have elapsed (e.g. tab was throttled in the
      // background). Fire a beep for each boundary crossed and advance
      // the target time in whole multiples of the duration so the
      // cadence never drifts, then fire one visual/audio beep for the
      // catch-up (avoids a burst of rapid beeps after backgrounding).
      const duration = durationRef.current;
      let crossed = 0;
      while (remaining <= 0 && duration > 0) {
        targetTimeRef.current += duration;
        remaining = targetTimeRef.current - now;
        crossed += 1;
      }
      if (crossed > 0) {
        playBeep();
        setCompletedIntervals((c) => c + crossed);
      }
    }

    setRemainingMs(Math.max(0, remaining));

    // Schedule next tick, self-correcting for how long this tick took.
    const elapsed = Date.now() - now;
    const delay = Math.max(0, TICK_MS - elapsed);
    rafRef.current = window.setTimeout(() => tickRef.current(), delay);
  }, []);

  // Keep a stable ref to the latest `tick` so the recursive scheduling
  // above never closes over a stale/self-referential binding.
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const start = useCallback(
    (durationMs: number) => {
      if (durationMs <= 0) return;
      // Guard against double-starts creating two loops.
      if (statusRef.current === "running") return;

      clearLoop();
      void unlockAudio();

      durationRef.current = durationMs;
      targetTimeRef.current = Date.now() + durationMs;
      setRemainingMs(durationMs);
      setCompletedIntervals(0);
      lastTickRef.current = Date.now();
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
    setRemainingMs(0);
    setCompletedIntervals(0);
    pausedRemainingRef.current = 0;
  }, [clearLoop]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    clearLoop();
    pausedRemainingRef.current = Math.max(0, targetTimeRef.current - Date.now());
    setStatus("paused");
    statusRef.current = "paused";
  }, [clearLoop]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    void unlockAudio();
    targetTimeRef.current = Date.now() + pausedRemainingRef.current;
    setStatus("running");
    statusRef.current = "running";
    rafRef.current = window.setTimeout(tick, TICK_MS);
  }, [tick]);

  // Recalculate immediately when the tab becomes visible again, so the
  // displayed time snaps to correct rather than waiting for the next tick.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && statusRef.current === "running") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [tick]);

  useEffect(() => {
    return () => clearLoop();
  }, [clearLoop]);

  return { status, remainingMs, completedIntervals, start, stop, pause, resume };
}
