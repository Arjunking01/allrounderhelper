/** Synthesized alarm tones using the Web Audio API — no external audio files needed. */

export interface AlarmSound {
  id: string;
  label: string;
}

export const ALARM_SOUNDS: AlarmSound[] = [
  { id: 'classic-beep', label: 'Classic Beep' },
  { id: 'double-chime', label: 'Double Chime' },
  { id: 'soft-bell', label: 'Soft Bell' },
  { id: 'digital-alert', label: 'Digital Alert' },
  { id: 'marimba', label: 'Marimba' },
  { id: 'triangle-ping', label: 'Triangle Ping' },
  { id: 'alarm-buzz', label: 'Alarm Buzz' },
  { id: 'gentle-hum', label: 'Gentle Hum' },
];

// A fresh AudioContext per alarm firing was never closed, leaking one context per
// pomodoro completion — and since the alarm is often triggered by a setInterval
// callback rather than a fresh click, a browser could hand back a *suspended*
// context with no resume() call, so the alarm silently produced no sound. Reusing
// one context (same pattern as focusSoundscape.ts) and resuming it before each
// play avoids both problems.
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

function playTones(ctx: AudioContext, soundId: string, v: number) {
  const now = ctx.currentTime;
  switch (soundId) {
    case 'double-chime':
      tone(ctx, now, 880, 0.35, v);
      tone(ctx, now + 0.25, 1108, 0.4, v);
      break;
    case 'soft-bell':
      tone(ctx, now, 988, 0.9, v * 0.8, 'sine');
      tone(ctx, now, 1976, 0.6, v * 0.3, 'sine');
      break;
    case 'digital-alert':
      tone(ctx, now, 1200, 0.12, v, 'square');
      tone(ctx, now + 0.16, 1200, 0.12, v, 'square');
      tone(ctx, now + 0.32, 1200, 0.12, v, 'square');
      break;
    case 'marimba':
      tone(ctx, now, 523, 0.3, v, 'triangle');
      tone(ctx, now + 0.15, 659, 0.3, v, 'triangle');
      tone(ctx, now + 0.3, 784, 0.4, v, 'triangle');
      break;
    case 'triangle-ping':
      tone(ctx, now, 1568, 0.5, v * 0.7, 'triangle');
      break;
    case 'alarm-buzz':
      tone(ctx, now, 440, 0.2, v, 'sawtooth');
      tone(ctx, now + 0.22, 440, 0.2, v, 'sawtooth');
      tone(ctx, now + 0.44, 440, 0.2, v, 'sawtooth');
      break;
    case 'gentle-hum':
      tone(ctx, now, 330, 1.1, v * 0.6, 'sine');
      break;
    case 'classic-beep':
    default:
      tone(ctx, now, 880, 0.5, v);
      break;
  }
}

/** Plays a built-in alarm sound at the given volume (0–1). */
export function playAlarmSound(soundId: string, volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const v = Math.max(0, Math.min(1, volume)) * 0.3;

    if (ctx.state === 'suspended') {
      // A context created outside a direct click (e.g. by the timer firing when a
      // session ends) can come back suspended under a browser's autoplay policy.
      // resume() is a no-op if it's already running.
      void ctx.resume().then(() => playTones(ctx, soundId, v));
    } else {
      playTones(ctx, soundId, v);
    }
  } catch {
    // Audio unavailable — fail silently.
  }
}

/** @deprecated use playAlarmSound instead */
export function playBeep() {
  playAlarmSound('classic-beep');
}

/**
 * Creates (and resumes, if suspended) the shared AudioContext without playing anything.
 * Call this from an actual user-gesture handler — Start, Resume, "Enable sound" — so that a
 * later completion tone fired from a setInterval/visibilitychange callback (which is not
 * itself a user gesture) plays on a context the browser already considers unlocked, instead
 * of silently creating-and-suspending a brand new one at that point. A no-op, safe to call
 * unconditionally and repeatedly; getAudioContext() reuses the same singleton.
 */
export function primeAlarmAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    // Audio unavailable — fail silently, same as playAlarmSound.
  }
}
