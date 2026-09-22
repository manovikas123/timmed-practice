/**
 * Beep generation using the Web Audio API.
 *
 * We deliberately avoid any external audio file: the beep is synthesized
 * on the fly with an oscillator + gain envelope. This keeps the app
 * self-contained and avoids any network dependency for audio assets.
 */

let audioContext: AudioContext | null = null;

/**
 * Returns a singleton AudioContext, creating it lazily.
 *
 * IMPORTANT: This must only be *created* as a direct result of a user
 * gesture (e.g. clicking "Start"), otherwise browsers will block audio
 * output due to autoplay restrictions. Calling this from a click handler
 * satisfies that requirement.
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioContext = new AudioContextCtor();
  }
  return audioContext;
}

/**
 * Resumes the AudioContext if it has been suspended (which happens on
 * some browsers by default, or after a period of inactivity). Should be
 * called from within a user-gesture handler (e.g. the Start button click).
 */
export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

/**
 * Plays a short, clear beep tone.
 *
 * Uses a sine oscillator with a quick attack/decay envelope so the beep
 * sounds clean and doesn't click at the start/end.
 */
export function playBeep(): void {
  const ctx = getAudioContext();

  // If the context is suspended (e.g. tab was backgrounded and the
  // browser suspended audio), try to resume it. This is best-effort;
  // some browsers will not allow this without a fresh user gesture.
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const duration = 0.18; // seconds

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now); // A5 - clear, pleasant beep

  // Envelope: quick fade in, sustain, quick fade out to avoid clicks.
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.35, now + 0.01);
  gainNode.gain.setValueAtTime(0.35, now + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);

  // Clean up nodes after they've finished playing.
  oscillator.onended = () => {
    oscillator.disconnect();
    gainNode.disconnect();
  };
}

/**
 * Plays a short burst of `count` beeps spaced `gapMs` apart. Used for the
 * "practice session finished" signal, which is intentionally distinct
 * from the single interval beep so it's unmistakable when the whole
 * session (not just one sub-interval) has ended.
 */
export function playBeepSequence(count: number, gapMs = 350): void {
  for (let i = 0; i < count; i++) {
    setTimeout(() => playBeep(), i * gapMs);
  }
}
