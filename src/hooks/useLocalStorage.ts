import { useEffect, useRef, useState } from 'react';

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return initialValue;
    const parsed = JSON.parse(item) as T;
    const expectArray = Array.isArray(initialValue);
    if (expectArray !== Array.isArray(parsed)) return initialValue;
    if (!expectArray && typeof initialValue === 'object' && initialValue !== null) {
      if (typeof parsed !== 'object' || parsed === null) return initialValue;
    } else if (typeof parsed !== typeof initialValue) {
      return initialValue;
    }
    return parsed;
  } catch {
    return initialValue;
  }
}

/**
 * Persists state to localStorage under `key`, keeping it in sync automatically.
 * Safe for SSR and gracefully falls back to in-memory state if storage is unavailable
 * (e.g. private browsing modes that throw on write).
 *
 * `serializeForStorage`, if given, transforms `value` right before it's written to disk —
 * the in-memory `value` returned to the caller is never touched by it. This exists for data
 * that's fine to keep in memory/React state but too large or too ephemeral to persist verbatim
 * (e.g. AI chat attachments: a base64 image data URL is real, sendable data worth keeping in
 * memory for the running session, but persisting every attached image's full bytes into
 * localStorage risks blowing the ~5-10MB quota and silently failing to save the WHOLE stored
 * value, not just the oversized part — see useConversations.ts for the concrete use). Omit it
 * and behavior is identical to before this parameter existed.
 *
 * Returns a third element, `persistError`, that is true whenever the most recent write
 * threw (quota exceeded, private-mode restriction, storage disabled, etc). The in-memory
 * `value` is never lost when this happens — only the write to disk failed — but callers
 * that show their own "Saved" confirmation should check this so they don't tell the
 * student their work is safely persisted when it actually only lives in this tab.
 */
export function useLocalStorage<T>(key: string, initialValue: T, serializeForStorage?: (value: T) => T) {
  const [value, setValue] = useState<T>(() => readValue(key, initialValue));
  const [persistError, setPersistError] = useState(false);
  const isFirstRender = useRef(true);
  const serializeRef = useRef(serializeForStorage);
  serializeRef.current = serializeForStorage;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      const toStore = serializeRef.current ? serializeRef.current(value) : value;
      window.localStorage.setItem(key, JSON.stringify(toStore));
      setPersistError(false);
    } catch {
      // Storage unavailable (private mode, quota exceeded) — keep the in-memory state so
      // nothing typed this session is lost, but surface the failure to the caller.
      setPersistError(true);
    }
  }, [key, value]);

  return [value, setValue, persistError] as const;
}
