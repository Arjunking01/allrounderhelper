/**
 * Lightweight, session-scoped provider health tracking.
 *
 * Not persisted (no localStorage) \u2014 it exists purely to stop the router from repeatedly
 * preferring a provider that just failed, for the rest of the current browser session.
 * Resets on page reload, which is fine: a fresh session should give every configured
 * provider a clean chance rather than carrying stale failure state indefinitely.
 */

import type { AIErrorCode } from './aiTypes';

interface HealthEntry {
  consecutiveFailures: number;
  lastFailureAt: number | null;
  lastFailureCode: AIErrorCode | null;
}

const health = new Map<string, HealthEntry>();

/** Failure penalty subtracted from a provider's routing score per consecutive recent failure, capped. */
const PENALTY_PER_FAILURE = 4;
const MAX_PENALTY = 12;
/** A failure older than this no longer counts against the provider \u2014 transient issues shouldn't cause a permanent demotion. */
const FAILURE_DECAY_MS = 5 * 60 * 1000; // 5 minutes

function getEntry(providerId: string): HealthEntry {
  let entry = health.get(providerId);
  if (!entry) {
    entry = { consecutiveFailures: 0, lastFailureAt: null, lastFailureCode: null };
    health.set(providerId, entry);
  }
  return entry;
}

export function recordProviderSuccess(providerId: string) {
  health.set(providerId, { consecutiveFailures: 0, lastFailureAt: null, lastFailureCode: null });
}

export function recordProviderFailure(providerId: string, code: AIErrorCode) {
  const entry = getEntry(providerId);
  entry.consecutiveFailures += 1;
  entry.lastFailureAt = Date.now();
  entry.lastFailureCode = code;
}

/** Returns a non-negative routing penalty (0 = fully healthy) for use by the routing policy. */
export function getHealthPenalty(providerId: string): number {
  const entry = health.get(providerId);
  if (!entry || !entry.lastFailureAt) return 0;
  const age = Date.now() - entry.lastFailureAt;
  if (age > FAILURE_DECAY_MS) return 0;
  return Math.min(entry.consecutiveFailures * PENALTY_PER_FAILURE, MAX_PENALTY);
}

/** Exposed for the provider status UI (AiStatusPanel) to show "recently failing" state honestly. */
export function getProviderHealthSnapshot(providerId: string): Readonly<HealthEntry> {
  return getEntry(providerId);
}
