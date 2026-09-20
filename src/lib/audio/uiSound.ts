/**
 * Global UI sound effects — synthesized with the Web Audio API, no external
 * audio files. Deliberately separate from the Pomodoro alarm system
 * (pomodoroSound.ts) and the Focus Mode soundscape system (focusSoundscape.ts):
 * each owns its own AudioContext and settings, so a change to one can never
 * affect the others. This module is only for short, occasional feedback tones
 * (e.g. a success toast) — never for looping/background audio.
 */

export type UiSoundKind = 'success' | 'error';

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new AudioCtx();
  }
  return sharedCtx;
}

function tone(ctx: AudioContext, startAt: number, freq: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

function playTones(ctx: AudioContext, kind: UiSoundKind, v: number) {
  const now = ctx.currentTime;
  if (kind === 'error') {
    tone(ctx, now, 340, 0.18, v, 'sine');
    tone(ctx, now + 0.1, 260, 0.22, v * 0.9, 'sine');
  } else {
    tone(ctx, now, 880, 0.14, v, 'sine');
    tone(ctx, now + 0.08, 1320, 0.18, v * 0.8, 'sine');
  }
}

/**
 * Plays a short built-in UI feedback tone at the given volume (0–1). Callers
 * are expected to check the user's global sound-effects preference before
 * calling this — it does not read the preferences store itself, to keep this
 * module free of store dependencies.
 */
export function playUiSound(kind: UiSoundKind, volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const v = Math.max(0, Math.min(1, volume)) * 0.25;

    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => playTones(ctx, kind, v));
    } else {
      playTones(ctx, kind, v);
    }
  } catch {
    // Audio unavailable — fail silently.
  }
}
