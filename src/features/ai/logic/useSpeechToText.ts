import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Thin wrapper around the browser-native Web Speech API (SpeechRecognition).
 *
 * This is a REAL browser capability, not a provider integration — no network call this
 * project controls, no API key, nothing to proxy. It's genuinely unsupported in some
 * browsers (notably Firefox desktop as of this writing), so `isSupported` must be checked
 * before showing any voice UI — never assume availability.
 *
 * Deliberately minimal: single-utterance dictation appended to the composer, not a
 * continuous voice-chat mode. That's a much larger, riskier feature (turn-taking,
 * interruption, TTS playback) and isn't what "voice input" in the settings toggle has
 * ever meant in this codebase (see aiTypes.ts `voiceEnabled` — was previously a
 * placeholder with no implementation at all).
 */

type RecognitionState = 'idle' | 'listening' | 'error';

// Minimal shape of the API this hook actually uses — the DOM lib doesn't ship types for
// SpeechRecognition in all TS configs, and pulling in a whole ambient-types package for
// three fields isn't worth the dependency.
interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => MinimalSpeechRecognition)
    | undefined;
  return ctor ?? null;
}

export function useSpeechToText(onResult: (transcript: string) => void) {
  const [state, setState] = useState<RecognitionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const isSupported = getRecognitionCtor() !== null;

  useEffect(() => {
    // Stop and release on unmount so a lingering mic permission indicator doesn't outlive
    // the page — recognition.stop() is safe to call even if it was never started.
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setState('error');
      setErrorMessage('Voice input isn\u2019t supported in this browser.');
      return;
    }
    setErrorMessage(null);
    const recognition = new Ctor();
    recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: unknown) => {
      // SpeechRecognitionEvent shape: event.results[last][0].transcript
      const e = event as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
      const last = e.results[e.results.length - 1];
      const transcript = last?.[0]?.transcript?.trim();
      if (transcript) onResult(transcript);
    };
    recognition.onerror = (event: { error: string }) => {
      setState('error');
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access was denied.',
        'no-speech': 'No speech was detected.',
        'audio-capture': 'No microphone was found.',
        network: 'A network error interrupted voice input.',
      };
      setErrorMessage(messages[event.error] ?? 'Voice input failed.');
    };
    recognition.onend = () => {
      setState((prev) => (prev === 'error' ? prev : 'idle'));
    };

    recognitionRef.current = recognition;
    setState('listening');
    try {
      recognition.start();
    } catch {
      // start() throws if called while already running — treat as a no-op failure rather
      // than crashing the composer.
      setState('error');
      setErrorMessage('Voice input failed to start.');
    }
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setState('idle');
  }, []);

  return { isSupported, state, errorMessage, start, stop };
}
