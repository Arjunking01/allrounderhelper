import { useCallback, useEffect, useState } from 'react';
import { localStorageService } from '@/services/localStorageService';

const STORAGE_KEY = 'ar-ai-daily-usage';
export const DAILY_MESSAGE_LIMIT = 18;

interface UsageRecord {
  date: string; // YYYY-MM-DD, local
  count: number;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function msUntilNextMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5); // +5s safety margin
  return next.getTime() - now.getTime();
}

function readUsage(): UsageRecord {
  const record = localStorageService.get<UsageRecord>(STORAGE_KEY, { date: todayKey(), count: 0 });
  // Roll over automatically once local date changes — no stale counts carried into a new day.
  if (record.date !== todayKey()) return { date: todayKey(), count: 0 };
  return record;
}

/**
 * Enforces a per-browser daily cap on outgoing AI messages. Counts increment client-side,
 * which is sufficient to curb accidental runaway usage from normal use of this app's own UI
 * and give users a clear signal — it is NOT a security/cost boundary. The server-side
 * proxies in api/ai/*.ts hold the real, spendable provider keys and don't check this counter
 * (they have no way to: it lives in this browser's localStorage), so a request sent directly
 * to one of those endpoints, bypassing this app's UI entirely, is not limited by this count.
 * See api/_shared.ts for the body-size guard those endpoints do enforce, and
 * PROJECT_BACKLOG.md for why true per-caller rate limiting belongs at the deployment layer
 * rather than here.
 */
export function useDailyMessageLimit() {
  const [usage, setUsage] = useState<UsageRecord>(readUsage);

  // Resync at local midnight so a tab left open overnight doesn't keep showing yesterday's
  // "limit reached" state — canSend() already reads fresh from storage, this just keeps the
  // displayed remaining count / banner in sync without requiring the user to send a message first.
  useEffect(() => {
    const timer = setTimeout(() => setUsage(readUsage()), msUntilNextMidnight());
    return () => clearTimeout(timer);
  }, [usage.date]);

  const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - usage.count);
  const limitReached = usage.count >= DAILY_MESSAGE_LIMIT;

  const recordMessage = useCallback(() => {
    setUsage((prev) => {
      const fresh = prev.date === todayKey() ? prev : { date: todayKey(), count: 0 };
      const next = { date: fresh.date, count: fresh.count + 1 };
      localStorageService.set(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const canSend = useCallback(() => {
    const current = readUsage();
    return current.count < DAILY_MESSAGE_LIMIT;
  }, []);

  return { remaining, limitReached, used: usage.count, limit: DAILY_MESSAGE_LIMIT, recordMessage, canSend };
}
