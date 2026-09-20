import type { AIProvider, AISettings, AIProviderResult, ProviderMessage, AIStreamChunk, AIErrorCode } from '../logic/aiTypes';
import { PROVIDER_UNAVAILABLE_MESSAGE, studentSafeErrorMessage } from '../logic/aiTypes';

/**
 * Factory for providers that speak the OpenAI-style `/chat/completions` REST API
 * (Cerebras, Mistral, OpenRouter, OpenAI, xAI, and Z.ai all do).
 *
 * Two transport modes:
 * - `proxyPath` (every provider currently registered — Cerebras, Mistral, OpenRouter,
 *   OpenAI, xAI, Z.ai): request goes through our own serverless function, which holds the
 *   real vendor API key server-side (a non-VITE_ env var) and is never sent to or bundled
 *   into the browser. **Use this for any real vendor secret, always** — see the security
 *   note in `AI_PROVIDER_GUIDE.md` for why a vendor's docs describing browser usage as
 *   "supported" is not the same as it being safe to ship that secret in a `VITE_*` var.
 * - `direct`: request goes straight from the browser to `baseUrl` with `apiKey` attached.
 *   **Not currently used by any registered provider.** This mode is only appropriate for a
 *   genuine user-entered key (typed into Settings, stored in that user's own browser only,
 *   never a site-wide secret baked into the build) — it must never be fed a real vendor
 *   secret via `import.meta.env`/a `VITE_*` var, since Vite inlines those into the public
 *   bundle for every visitor to read. (OpenRouter used `direct` mode with exactly that
 *   mistake until it was corrected on 2026-08-17 — see `AI_PROVIDER_GUIDE.md`.)
 *
 * `enabled` (proxy mode) / `isConfigured` (direct mode, derived from `apiKey`) exist purely
 * so the UI knows whether to show the provider as available.
 */
export type OpenAICompatibleConfig =
  | {
      id: string;
      name: string;
      mode: 'proxy';
      enabled: boolean;
      /** Path to our own serverless proxy for this provider, e.g. '/api/ai/cerebras'. */
      proxyPath: string;
      defaultModel: string;
      maxContextTokens: number;
      streaming?: boolean;
      vision?: boolean;
      /** Phase 1.7: exact image MIME types this provider's configured model actually accepts,
       *  per that vendor's own current docs \u2014 required whenever `vision` is true (see
       *  AIProviderCapabilities.supportedImageMimeTypes's doc comment for why this can't just
       *  default to "everything"). Ignored when `vision` is falsy/omitted. */
      visionMimeTypes?: string[];
      /** Env var name shown in "not configured" messages, e.g. 'CEREBRAS_API_KEY'. */
      envVarName: string;
    }
  | {
      id: string;
      name: string;
      mode: 'direct';
      /** Must come from user-entered state (e.g. settings.apiKey), never import.meta.env/VITE_*. */
      apiKey: string | undefined;
      /** Base URL without a trailing slash, e.g. 'https://api.example.com/v1'. */
      baseUrl: string;
      defaultModel: string;
      maxContextTokens: number;
      streaming?: boolean;
      vision?: boolean;
      visionMimeTypes?: string[];
      /** Env var name shown in "not configured" messages. */
      envVarName: string;
    };

/** Builds the OpenAI-style `content` value for a single message: a plain string when there's
 *  no image data (the common case, and required by some OpenAI-compatible backends that reject
 *  an array `content` outright), or a `[{type:'text'},{type:'image_url'},...]` array per
 *  OpenAI's vision request format when the message carries images AND this provider is
 *  configured as vision-capable. If images are present but the provider is NOT vision-capable,
 *  the images are never sent (they'd be silently ignored or rejected by the API anyway) \u2014
 *  instead a short plain-text note is appended so the model doesn't just answer as if nothing
 *  was attached, and downstream response-completeness logic still gets a normal string reply.
 *  This is a defensive fallback only: routing (providerRegistry.getRoutedFallbackChain with
 *  requireVision) is what's actually supposed to keep image-bearing requests away from
 *  non-vision providers \u2014 and, Phase 1.7, unsupported *formats* \u2014 in the first place.
 *
 *  Phase 1.7: `visionMimeTypes`, when given, is this same defensive check extended to actual
 *  per-image format \u2014 a data URL whose MIME type isn't in the list is treated exactly like
 *  the "no vision support at all" case (dropped, replaced with an honest text note) rather
 *  than being sent and silently rejected/mishandled by the vendor. This is why xAI (jpg/jpeg +
 *  png only, no WebP per docs.x.ai) can never end up being asked to look at a WebP upload even
 *  if a routing bug ever let one through. */
function toOpenAIContent(m: { role: string; content: string; images?: string[] }, supportsVision: boolean, visionMimeTypes?: string[]): string | Array<Record<string, unknown>> {
  if (!m.images?.length) return m.content;
  if (!supportsVision) {
    const note = `[${m.images.length} image(s) were attached to this message, but the current model cannot view images. Answer based on the text only, and let the user know the image(s) could not be analyzed.]`;
    return m.content ? `${m.content}\n\n${note}` : note;
  }
  const usable: string[] = [];
  let unsupportedCount = 0;
  for (const dataUrl of m.images) {
    const mimeMatch = /^data:([^;]+);base64,/.exec(dataUrl);
    const mime = mimeMatch?.[1]?.toLowerCase();
    if (visionMimeTypes && (!mime || !visionMimeTypes.includes(mime))) unsupportedCount += 1;
    else usable.push(dataUrl);
  }
  const parts: Array<Record<string, unknown>> = [];
  let text = m.content;
  if (unsupportedCount > 0) {
    const note = `[${unsupportedCount} image(s) attached to this message are in a format this model doesn't support and were not analyzed.]`;
    text = text ? `${text}\n\n${note}` : note;
  }
  if (text) parts.push({ type: 'text', text });
  for (const dataUrl of usable) parts.push({ type: 'image_url', image_url: { url: dataUrl } });
  if (parts.length === 0) parts.push({ type: 'text', text: '' });
  return parts;
}

/** Maps an OpenAI-style `finish_reason` ("stop" | "length" | "content_filter" | "tool_calls" |
 *  null | undefined) to this app's AIProviderResult finishReason.
 *
 *  Phase 1.7 audit of every documented value, for every OpenAI-compatible provider this app
 *  actually registers (Cerebras, Mistral, OpenRouter, OpenAI, xAI, Z.ai) — none of these are
 *  asked to call tools, so 'tool_calls' is not expected in practice, but is still handled
 *  explicitly rather than falling through to a silent 'stop':
 *  - 'length': genuinely truncated by max_tokens — the one case that must trigger
 *    AiAssistantPage's auto-continue loop (keyed on this exact value). Kept as-is.
 *  - 'stop': genuinely complete. Kept as-is.
 *  - 'content_filter': the provider is not going to produce more tokens for this request —
 *    this is a completed (if refused) turn, not a length-truncated one, so 'stop' is the
 *    honest mapping (auto-continue must NOT fire — there is nothing to "continue", retrying
 *    would just hit the same filter again).
 *  - 'tool_calls' / null / undefined / any other value this app hasn't seen a real provider
 *    return: NOT assumed complete-with-confidence. Every provider registered here already
 *    guards content emptiness one level up (`if (!text) return {..error: 'unknown'..}`), so an
 *    empty tool-call-shaped response already surfaces as an honest error rather than a blank
 *    "complete" answer — but if content-with-no-recognized-reason ever happens, mapping to
 *    'stop' here (not 'length', which would wrongly trigger auto-continue on content the
 *    provider never intended to keep generating) is still the safer of the two known values.
 *    Not over-engineered into a fourth internal state for this class of provider: unlike
 *    Cloudflare's response shape (see CloudflareProvider.ts), an OpenAI-compatible endpoint
 *    HAS a completion field in its contract — it just might report a value this app doesn't
 *    special-case yet — so 'unknown' (reserved for "the wire format has no signal at all") is
 *    not the right label for "an unrecognized value that a signal-having field DID return". */
function mapFinishReason(reason: unknown): 'stop' | 'length' {
  return reason === 'length' ? 'length' : 'stop';
}

function mapStatusToCode(status: number): AIErrorCode {
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 413) return 'context_overflow';
  if (status === 503) return 'not_configured';
  if (status === 504) return 'timeout';
  if (status === 502 || status >= 500) return 'provider_unavailable';
  return 'unknown';
}

export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): AIProvider {
  const supportsStreaming = cfg.streaming ?? true;
  const isEnabled = cfg.mode === 'proxy' ? cfg.enabled : Boolean(cfg.apiKey);

  return {
    id: cfg.id,
    name: cfg.name,
    capabilities: {
      streaming: supportsStreaming,
      vision: cfg.vision ?? false,
      maxContextTokens: cfg.maxContextTokens,
      supportedImageMimeTypes: cfg.vision ? cfg.visionMimeTypes : undefined,
    },
    isConfigured: () => isEnabled,

    async sendMessage(messages: ProviderMessage[], settings: AISettings, onChunk?: (c: AIStreamChunk) => void, signal?: AbortSignal): Promise<AIProviderResult> {
      if (!isEnabled) {
        return { content: '', finishReason: 'error', error: { code: 'not_configured', message: PROVIDER_UNAVAILABLE_MESSAGE } };
      }

      const model = settings.model || cfg.defaultModel;
      const useStream = supportsStreaming && settings.streaming && Boolean(onChunk);

      const supportsVision = cfg.vision ?? false;

      const body = {
        model,
        messages: messages.map((m) => ({ role: m.role, content: toOpenAIContent(m, supportsVision, cfg.visionMimeTypes) })),
        temperature: settings.temperature,
        top_p: settings.topP,
        max_tokens: settings.maxTokens,
        stream: useStream,
      };

      const url = cfg.mode === 'proxy' ? cfg.proxyPath : `${cfg.baseUrl}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cfg.mode === 'direct') headers.Authorization = `Bearer ${cfg.apiKey}`;

      let response: Response;
      try {
        response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return { content: '', finishReason: 'cancelled' };
        return { content: '', finishReason: 'error', error: { code: 'network', message: `Could not reach ${cfg.name} — check your connection.` } };
      }

      if (!response.ok) {
        const code = mapStatusToCode(response.status);
        let message = `${cfg.name} returned an error (HTTP ${response.status}).`;
        try {
          const errJson = await response.json();
          message = errJson?.error?.message ?? message;
        } catch {
          // ignore parse failure, use default message
        }
        return { content: '', finishReason: 'error', error: { code, message: studentSafeErrorMessage(code, message, response.status), status: response.status } };
      }

      if (!useStream) {
        const json = await response.json();
        const text = json?.choices?.[0]?.message?.content ?? '';
        if (!text) return { content: '', finishReason: 'error', error: { code: 'unknown', message: `${cfg.name} returned an empty response.` } };
        return { content: text, finishReason: mapFinishReason(json?.choices?.[0]?.finish_reason) };
      }

      // Streaming: OpenAI-style SSE — "data: {...}\n\n", terminated by "data: [DONE]".
      const reader = response.body?.getReader();
      if (!reader) return { content: '', finishReason: 'error', error: { code: 'unknown', message: 'Streaming is not supported in this environment.' } };

      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';
      // Set once a chunk actually carries a finish_reason (usually the last chunk for this
      // choice, sometimes paired with an empty delta) — defaults to 'stop' only because that's
      // this function's own honest fallback when a provider never sends the field at all, not
      // because completion should be assumed.
      let sawFinishReason: unknown;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const chunkJson = JSON.parse(jsonStr);
              const delta = chunkJson?.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                full += delta;
                onChunk?.({ delta, done: false });
              }
              const reason = chunkJson?.choices?.[0]?.finish_reason;
              if (reason != null) sawFinishReason = reason;
            } catch {
              // ignore malformed SSE chunk, keep reading
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return { content: full, finishReason: 'cancelled' };
        return { content: full, finishReason: full ? 'stop' : 'error', error: full ? undefined : { code: 'timeout', message: 'The stream was interrupted.' } };
      }

      onChunk?.({ delta: '', done: true });
      if (!full) return { content: '', finishReason: 'error', error: { code: 'unknown', message: `${cfg.name} returned an empty response.` } };
      return { content: full, finishReason: mapFinishReason(sawFinishReason) };
    },
  };
}
