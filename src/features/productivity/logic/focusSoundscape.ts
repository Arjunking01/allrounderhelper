/**
 * Synthesized ambient soundscapes for Focus Mode, generated live with the Web
 * Audio API (no external audio files). Only offers sounds that can genuinely
 * be produced this way — filtered noise — rather than faking a music track.
 */

export type SoundscapeId = 'none' | 'white-noise' | 'rain';

export const SOUNDSCAPES: { id: SoundscapeId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'white-noise', label: 'White noise' },
  { id: 'rain', label: 'Gentle rain' },
];

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
  }
  return ctx;
}

function makeNoiseBuffer(context: AudioContext): AudioBuffer {
  const bufferSize = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Starts looping the given soundscape. Call stopSoundscape() first if one is already playing. */
export function playSoundscape(id: SoundscapeId, volume: number = 0.3) {
  stopSoundscape();
  if (id === 'none') return;

  try {
    const context = getContext();
    const buffer = makeNoiseBuffer(context);
    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    gainNode = context.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, volume)) * 0.25;

    if (id === 'rain') {
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.6;
      source.connect(filter);
      filter.connect(gainNode);
    } else {
      source.connect(gainNode);
    }

    gainNode.connect(context.destination);
    source.start();
  } catch {
    // Audio unavailable — fail silently.
  }
}

export function setSoundscapeVolume(volume: number) {
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, volume)) * 0.25;
}

export function stopSoundscape() {
  try {
    source?.stop();
  } catch {
    // Already stopped.
  }
  source = null;
  gainNode = null;
}
