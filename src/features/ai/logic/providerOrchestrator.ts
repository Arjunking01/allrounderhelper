import type { AISettings, ProviderMessage, AIProviderResult, AIStreamChunk, AIErrorCode } from './aiTypes';
import { getFallbackChain, getRoutedFallbackChain } from './providerRegistry';
import { classifyTask, type TaskCategory } from './taskClassification';
import { recordProviderSuccess, recordProviderFailure } from './providerHealth';

const DEFAULT_TIMEOUT_MS = 30_000;

/** Errors worth retrying — transient/network-shaped, not user-actionable configuration problems. */
const RETRYABLE: AIErrorCode[] = ['network', 'timeout', 'provider_unavailable', 'rate_limited'];

function withTimeout(outerSignal: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onOuterAbort = () => controller.abort();
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    else outerSignal.addEventListener('abort', onOuterAbort);
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      outerSignal?.removeEventListener('abort', onOuterAbort);
    },
  };
}

export interface OrchestratedResult {
  result: AIProviderResult;
  providerId: string;
  providerName: string;
  /** Set when the request succeeded on a different provider than the one the user has selected. */
  switchedFrom?: string;
  /** The task category routing classified this request as \u2014 undefined when no routing context was given (static chain used). */
  routedCategory?: TaskCategory;
}

/** Optional context that lets sendWithFailover route via the task classifier instead of the
 *  static FALLBACK_ORDER. Omit entirely to keep the old task-agnostic behavior (e.g. for a
 *  future "disable smart routing" setting, or any caller that doesn't have message text handy). */
export interface RoutingContext {
  /** The latest user message text, used for task classification. */
  userText: string;
  hasDocumentAttachment?: boolean;
  /** True when the message being sent carries image attachments with real, ready data
   *  (see attachmentsWithImages) \u2014 restricts routing to vision-capable configured
   *  providers only, so an image request can never silently land on a text-only model. */
  hasImageAttachment?: boolean;
  /** Phase 1.7: the actual MIME type(s) of the image data being sent (see
   *  attachmentTypes.collectImageMimeTypes) \u2014 narrows routing further than
   *  `hasImageAttachment` alone: a provider must support vision AND these exact formats (see
   *  providerRegistry.getRoutedFallbackChain's supportsImageFormats). Omit to fall back to the
   *  old "any vision provider" behavior. */
  imageMimeTypes?: string[];
}

/**
 * Sends a message through the best eligible provider for the request (task-routed when
 * `routing` is given, otherwise the static configured order), with a timeout and one retry for
 * transient failures, then automatic failover through the rest of the chain if a provider still
 * can't produce a response. Never silently fails: the caller always gets back which provider
 * ultimately answered (or the last error) so the UI can inform the user. Provider health
 * (recent failures) is recorded as requests complete, and feeds back into future routing scores.
 */
export async function sendWithFailover(
  messages: ProviderMessage[],
  settings: AISettings,
  onChunk?: (chunk: AIStreamChunk) => void,
  outerSignal?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  routing?: RoutingContext
): Promise<OrchestratedResult> {
  const classification = routing ? classifyTask(routing.userText, routing.hasDocumentAttachment) : undefined;
  const chain = classification
    ? getRoutedFallbackChain(settings, classification.category, Boolean(routing?.hasImageAttachment), routing?.imageMimeTypes)
    : getFallbackChain(settings);
  const originalId = chain[0]?.id;
  let lastResult: AIProviderResult = { content: '', finishReason: 'error', error: { code: 'not_configured', message: 'No AI provider is available.' } };
  let lastProviderId = originalId ?? 'none';

  for (const provider of chain) {
    if (outerSignal?.aborted) return { result: { content: '', finishReason: 'cancelled' }, providerId: provider.id, providerName: provider.name };

    const maxAttempts = 2; // one retry on transient errors, same provider
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Signal to the consumer that any previously buffered streamed text from an earlier,
      // now-abandoned attempt (retry or prior provider in the chain) should be discarded —
      // otherwise a partial stream followed by a retry/failover would show duplicated text.
      onChunk?.({ delta: '', done: false, reset: true });

      const { signal, cleanup } = withTimeout(outerSignal, timeoutMs);
      let result: AIProviderResult;
      try {
        result = await provider.sendMessage(messages, settings, onChunk, signal);
      } catch (err) {
        // Defensive fallback: every provider today catches its own errors and resolves with
        // an error result, but if one ever threw instead, an uncaught rejection here would
        // propagate out of sendWithFailover, skip the isThinking/isGenerating reset in
        // AiAssistantPage, and leave the flame stuck on indefinitely. Converting to a normal
        // error result keeps this codepath identical to a provider-reported failure — same
        // retry/failover handling below, same guaranteed state reset in the caller.
        result =
          err instanceof DOMException && err.name === 'AbortError'
            ? { content: '', finishReason: 'cancelled' }
            : { content: '', finishReason: 'error', error: { code: 'unknown', message: `${provider.name} failed unexpectedly.` } };
      } finally {
        cleanup();
      }

      if (result.finishReason === 'cancelled') {
        if (outerSignal?.aborted) return { result, providerId: provider.id, providerName: provider.name };
        // Timed out (our own controller aborted, not the caller) — treat as a timeout error and consider retry/failover.
        result = { content: result.content, finishReason: 'error', error: { code: 'timeout', message: `${provider.name} timed out.` } };
      }

      if (result.finishReason !== 'error') {
        recordProviderSuccess(provider.id);
        return {
          result,
          providerId: provider.id,
          providerName: provider.name,
          switchedFrom: provider.id !== originalId ? originalId : undefined,
          routedCategory: classification?.category,
        };
      }

      lastResult = result;
      lastProviderId = provider.id;
      if (result.error) recordProviderFailure(provider.id, result.error.code);
      const retryable = result.error ? RETRYABLE.includes(result.error.code) : false;
      if (!retryable || attempt === maxAttempts) break; // give up on this provider, move to next in chain
    }
  }

  const provider = chain.find((p) => p.id === lastProviderId);
  return { result: lastResult, providerId: lastProviderId, providerName: provider?.name ?? lastProviderId, routedCategory: classification?.category };
}
