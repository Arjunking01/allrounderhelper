/**
 * Intelligent provider routing policy.
 *
 * USER REQUEST -> TaskClassification (taskClassification.ts) -> RoutingPolicy (this file)
 * -> ordered list of eligible provider ids -> providerRegistry hands that to the orchestrator,
 * which sends to the first and automatically fails over through the rest.
 *
 * This file only decides *ordering* among providers that are already configured/enabled \u2014
 * eligibility (isConfigured) is still owned by each provider adapter and providerRegistry.
 * Routing never bypasses that: an unconfigured provider is never scored or returned here.
 */

import type { AISettings } from './aiTypes';
import type { TaskCategory } from './taskClassification';
import { getCapabilityProfile, getCategoryWeights, type ProviderSuitability } from './providerCapabilities';
import { getHealthPenalty } from './providerHealth';

export interface ProviderScore {
  providerId: string;
  score: number;
  breakdown: {
    capabilityMatch: number;
    deprioritizePenalty: number;
    healthPenalty: number;
  };
}

export interface RoutingDecision {
  category: TaskCategory;
  order: ProviderScore[];
}

function scoreCapability(suitability: ProviderSuitability, weights: Partial<Record<keyof ProviderSuitability, number>>): number {
  let total = 0;
  for (const key of Object.keys(weights) as (keyof ProviderSuitability)[]) {
    const weight = weights[key] ?? 0;
    total += (suitability[key] ?? 0) * weight;
  }
  return total;
}

/**
 * Scores and orders a set of already-eligible (configured/enabled) provider ids for a given
 * task category. Callers pass the specific candidate ids (e.g. from getFallbackChain's existing
 * "configured" filtering) so this function never needs to know about env vars or settings shape
 * beyond what's given \u2014 it's a pure scoring function over ids.
 */
export function rankProvidersForTask(candidateIds: string[], category: TaskCategory): RoutingDecision {
  const weights = getCategoryWeights(category);

  const scored: ProviderScore[] = candidateIds.map((providerId) => {
    const profile = getCapabilityProfile(providerId);
    const capabilityMatch = profile ? scoreCapability(profile.suitability, weights) : 0;
    const deprioritizePenalty = profile?.deprioritizePenalty ?? 0;
    const healthPenalty = getHealthPenalty(providerId);
    const score = capabilityMatch * 10 - deprioritizePenalty - healthPenalty;
    return { providerId, score, breakdown: { capabilityMatch, deprioritizePenalty, healthPenalty } };
  });

  // Stable-ish sort: higher score first; ties keep candidateIds's original relative order
  // (Array.prototype.sort is stable per spec in all supported engines here).
  scored.sort((a, b) => b.score - a.score);

  return { category, order: scored };
}

/**
 * Convenience wrapper: given the full ordered fallback chain the registry would otherwise use,
 * re-rank it for a specific task while respecting a couple of hard rules:
 *  - if the user has explicitly selected a provider (settings.activeProviderId !== 'none'),
 *    that provider always stays first \u2014 routing only reorders the *rest* of the chain. This
 *    keeps "pick a provider in Settings" a real user override rather than something routing
 *    can silently ignore.
 *  - providers not present in candidateIds (unconfigured) are never introduced.
 */
export function routeProviderOrder(candidateIds: string[], category: TaskCategory, settings: AISettings): string[] {
  const explicitChoice = settings.activeProviderId !== 'none' ? settings.activeProviderId : undefined;
  const rest = candidateIds.filter((id) => id !== explicitChoice);
  const ranked = rankProvidersForTask(rest, category).order.map((s) => s.providerId);
  return explicitChoice && candidateIds.includes(explicitChoice) ? [explicitChoice, ...ranked] : ranked;
}
