# Timed Practice

A small, self-contained repeating interval timer for practice sessions
(e.g. martial arts rounds, workout intervals, meditation bells). Set a
duration, hit **Start**, and a beep sounds every time the interval elapses —
indefinitely, until you press **Stop**.

## Features

- Repeating interval timer (not a one-shot countdown) — beeps and restarts
  automatically until stopped
- Minutes + seconds input, plus quick presets (10s, 15s, 30s, 45s, 1:00,
  1:30, 2:00, 5:00)
- Beep synthesized in-browser with the Web Audio API — no audio files, no
  network requests
- Timestamp-based countdown so long sessions don't drift, even if the tab
  is backgrounded/throttled
- Pause/Resume, live "next beep in" and "completed intervals" counters
- Responsive, keyboard-friendly, works on desktop and mobile

## Tech stack

- React 19 + TypeScript
- Vite
- Plain CSS (no UI framework)
- No backend, no database, no external APIs

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Building for production

```bash
npm run build
npm run preview   # optional: serve the production build locally
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, click **New Project** and import the repo.
3. Vercel auto-detects the Vite framework (a `vercel.json` is included as
   well). Build command: `npm run build`. Output directory: `dist`.
4. Deploy — no environment variables or backend services are required.

## How the timer stays accurate

Instead of decrementing a counter every second (`setInterval` drift), the
timer computes a `targetTime = Date.now() + durationMs` and, on every
~100ms tick, derives the remaining time as `targetTime - Date.now()`. When
remaining time reaches zero, the target time is advanced by exactly one
full interval duration (not "now + duration", which would itself drift),
so the beep cadence stays aligned over long sessions. If the browser
throttles timers while the tab is backgrounded, the same math catches up
correctly the next time it runs rather than firing a burst of beeps.

## Known limitations

- **Background tab audio**: some mobile browsers suspend JavaScript
  timers and audio contexts aggressively when a tab is backgrounded or the
  screen is locked. The countdown will always be logically correct when
  you return to the tab, but you may miss hearing beeps that "should have"
  played while the tab was inactive. For reliable audio, keep the tab in
  the foreground (or the screen on) during a practice session.
- Closing the tab or navigating away stops the timer; there is no
  background/service-worker timer, by design (this is a pure client-side
  app with no backend).
