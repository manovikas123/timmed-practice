# Timed Practice

Three small, self-contained, independent tools for timed practice sessions
(e.g. martial arts rounds, workout intervals, meditation bells):

- **Stopwatch** — counts up from 0. No beep, no repeating interval. Just
  elapsed time until you press Stop.
- **Timer** — a repeating interval timer. Set a duration, hit Start, and it
  beeps every time the interval elapses, indefinitely, until you press Stop.
- **Practice Session** — a full session with a total length (e.g. 30 min)
  and its own repeating beep (e.g. every 10 sec) during that time. When the
  whole session ends, the regular beeping stops and you get 5 beeps in a
  row as a distinct "session complete" signal.

Each tab is fully independent: its own state, its own hook, its own UI.
Switching tabs doesn't stop or reset whatever is running on another tab —
e.g. a Timer left running keeps beeping in the background if you check the
Stopwatch tab.

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

This repo is already connected to Vercel with its **Root Directory** set to
this `timmed-practice` folder. Pushing to `main` triggers a new deployment
automatically — build command `npm run build`, output directory `dist`, no
environment variables needed.

## How the timers stay accurate

Every clock (Stopwatch, Timer, and both clocks inside Practice Session) is
timestamp-based rather than a naive `setInterval` decrement: each tick
computes `targetTime - Date.now()` instead of subtracting 1 from a counter,
so there's no cumulative drift. When an interval elapses, its target time
is advanced by exactly one full interval duration (not "now + duration",
which would itself drift), so beep cadence stays aligned over long
sessions — even if the browser throttles timers in a backgrounded tab, the
next tick catches up correctly rather than firing a burst of beeps.

## Sound

Every beep — including the Practice Session's 5-beep finish signal — is
synthesized live with the Web Audio API (`src/utils/beep.ts`). No audio
files, no network requests. The `AudioContext` is created/resumed inside
each tab's Start button handler to satisfy browser autoplay restrictions.

## Known limitations

- **Background tab audio**: some mobile browsers suspend JavaScript timers
  and audio contexts aggressively when a tab is backgrounded or the screen
  is locked. Displayed times are always logically correct when you return
  to the tab, but you may miss hearing beeps that "should have" played
  while inactive. For reliable audio, keep the tab foregrounded (or the
  screen on) during a session.
- No background/service-worker timer, by design — closing the tab or
  navigating away stops whatever is running (this is a pure client-side
  app with no backend).
