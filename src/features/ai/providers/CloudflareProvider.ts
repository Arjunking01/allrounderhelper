import type { AIProvider, AISettings, AIProviderResult, ProviderMessage, AIErrorCode } from '../logic/aiTypes';
import { PROVIDER_UNAVAILABLE_MESSAGE, studentSafeErrorMessage } from '../logic/aiTypes';

// Real credentials (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN) live server-side only,
// read by api/ai/cloudflare.ts. This flag is a non-secret boolean the deployer sets
// alongside them, following this project's established VITE_<VENDOR>_ENABLED convention.
// Not among the env vars already configured in Vercel as of this session — needs adding
// for this provider to appear as available even though the credentials are set.
const ENABLED = (import.meta.env.VITE_CLOUDFLARE_ENABLED as string | undefined) === '1';

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct';
// Re-checked against developers.cloudflare.com as of Aug 2026: this model id is still
// documented and functional. Cloudflare's own changelog now recommends newer models
// (Llama 4, gpt-oss) for new integrations, but hasn't deprecated this one — left as-is
// rather than swapping to an unverified newer default without a live request to confirm
// the response shape is unchanged. Worth a deliberate upgrade in a future session.

function mapStatusToCode(status: number): AIErrorCode {
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 413) return 'context_overflow';
  if (status === 503) return 'not_configured';
  if (status === 504) return 'timeout';
  if (status === 502 || status >= 500) return 'provider_unavailable';
  return 'unknown';
}

export const cloudflareProvider: AIProvider = {
  id: 'cloudflare',
  name: 'Cloudflare Workers AI',
  // Streaming is deliberately declared false: Cloudflare Workers AI does support SSE
  // streaming for many models, but the exact chunk framing wasn't independently verified
  // against a live request in this session (no network access to Cloudflare's API from
  // this environment). Declaring only what's verified — non-streaming request/response —
  // rather than guessing at streaming behavior and potentially parsing it wrong.
  capabilities: { streaming: false, vision: false, maxContextTokens: 8_000 },
  isConfigured: () => ENABLED,

  async sendMessage(messages: ProviderMessage[], settings: AISettings, onChunk, signal?: AbortSignal): Promise<AIProviderResult> {
    if (!ENABLED) {
      return { content: '', finishReason: 'error', error: { code: 'not_configured', message: PROVIDER_UNAVAILABLE_MESSAGE } };
    }

    const model = settings.model || DEFAULT_MODEL;

    let response: Response;
    try {
      response = await fetch('/api/ai/cloudflare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: messages.map((m) => ({ role: m.role, content: m.content })) }),
        signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return { content: '', finishReason: 'cancelled' };
      return { content: '', finishReason: 'error', error: { code: 'network', message: 'Could not reach Cloudflare Workers AI — check your connection.' } };
    }

    if (!response.ok) {
      const code = mapStatusToCode(response.status);
      let message = `Cloudflare Workers AI returned an error (HTTP ${response.status}).`;
      try {
        const errJson = await response.json();
        message = errJson?.error?.message ?? errJson?.errors?.[0]?.message ?? message;
      } catch {
        // ignore parse failure, use default message
      }
      return { content: '', finishReason: 'error', error: { code, message: studentSafeErrorMessage(code, message, response.status), status: response.status } };
    }

    const resultJson = await response.json();
    if (resultJson?.success === false) {
      // Raw `errors[0].message` is provider-authored text — never shown to students (see studentSafeErrorMessage).
      return { content: '', finishReason: 'error', error: { code: 'unknown', message: 'Cloudflare Workers AI reported a failure.' } };
    }
    const text: string = resultJson?.result?.response ?? '';
    if (!text) return { content: '', finishReason: 'error', error: { code: 'unknown', message: 'Cloudflare Workers AI returned an empty response.' } };

    // Not a real stream (see capabilities.streaming above) — deliver the whole response
    // as a single chunk so callers that always attach an onChunk handler still work.
    onChunk?.({ delta: text, done: true });

    // PHASE 1.7 — re-audited this endpoint's actual response shape (the plain "Execute AI
    // model" REST endpoint — see api/ai/cloudflare.ts's header comment for why this proxy
    // deliberately does NOT use the newer OpenAI-compatible /ai/v1/chat/completions surface,
    // which does return finish_reason). This endpoint's response is just
    // `{ result: { response: string }, success: boolean }` — there is no finish_reason,
    // truncation flag, or token-usage field anywhere in it for this model family. Previously
    // this unconditionally returned 'stop', which is a claim this app cannot actually back up:
    // a response that was silently cut off at whatever token budget Cloudflare applied
    // internally would look identical to a genuinely complete one from here, and would never
    // trigger AiAssistantPage's auto-continue loop (keyed on 'length') the way it would for
    // every other provider. 'unknown' is the honest mapping — distinct from both 'stop'
    // (verified complete) and 'length' (verified truncated, safe to auto-continue): it tells
    // AiAssistantPage "a response came back, but this app genuinely cannot say whether it's the
    // whole answer" so the UI can add a small honest caveat instead of either silently
    // pretending certainty or wrongly trying to auto-continue a response that was never
    // confirmed to be cut off. See aiTypes.ts's AIProviderResult.finishReason doc comment.
    return { content: text, finishReason: 'unknown' };
  },
};
