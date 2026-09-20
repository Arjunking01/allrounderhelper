import type { AIProvider, AISettings, AIProviderResult, ProviderMessage, AIStreamChunk, AIErrorCode } from '../logic/aiTypes';
import { PROVIDER_UNAVAILABLE_MESSAGE, studentSafeErrorMessage } from '../logic/aiTypes';

// The real Gemini API key lives server-side only (GEMINI_API_KEY, read by api/ai/gemini.ts)
// and is never sent to or bundled into the browser. This flag is a non-secret boolean the
// deployer sets alongside it — it carries no credential, so it's safe to expose via VITE_,
// and it exists purely so the UI knows whether to show Gemini as available.
const ENABLED = (import.meta.env.VITE_GEMINI_ENABLED as string | undefined) === '1';

function mapSafety(level: AISettings['safetyLevel']) {
  const threshold = level === 'strict' ? 'BLOCK_LOW_AND_ABOVE' : level === 'relaxed' ? 'BLOCK_ONLY_HIGH' : 'BLOCK_MEDIUM_AND_ABOVE';
  return ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'].map((category) => ({ category, threshold }));
}

/** Splits a "data:image/png;base64,AAAA..." data URL into the mimeType and bare base64 payload
 *  Gemini's inlineData part shape expects. Returns null (and the caller skips the image) for
 *  anything that doesn't match the expected data URL shape rather than sending Gemini a
 *  malformed part that would fail the whole request. */
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  return match ? { mimeType: match[1], data: match[2] } : null;
}

function toGeminiContents(messages: ProviderMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      if (m.content) parts.push({ text: m.content });
      for (const dataUrl of m.images ?? []) {
        const parsed = parseDataUrl(dataUrl);
        if (parsed) parts.push({ inlineData: parsed });
      }
      // Gemini rejects a content entry with zero parts, so a message with only an (unparseable)
      // image and no text still needs something to send.
      if (parts.length === 0) parts.push({ text: '' });
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });
}

/** Maps Gemini's own `finishReason` ("STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER" |
 *  undefined) to this app's AIProviderResult finishReason. Only MAX_TOKENS is treated specially —
 *  it's the one case where the answer is genuinely truncated and AiAssistantPage's auto-continue
 *  loop (keyed on 'length') needs to fire instead of the response being shown as complete. */
function mapFinishReason(reason: unknown): 'stop' | 'length' {
  return reason === 'MAX_TOKENS' ? 'length' : 'stop';
}

function mapStatusToCode(status: number): AIErrorCode {
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 429) return 'rate_limited';
  if (status === 400) return 'context_overflow';
  if (status === 503) return 'not_configured';
  if (status === 504) return 'timeout';
  if (status === 502 || status >= 500) return 'provider_unavailable';
  return 'unknown';
}

// PHASE 1.7 — MIME types: restricted to the formats this app's own upload picker actually
// offers (attachmentTypes.ts ACCEPTED_TYPES) even though Gemini's own docs also list HEIC/HEIF
// — no point declaring support for a format users can never actually attach here.
//
// PHASE 1.7 — NATIVE PDF INPUT, DOCUMENTED ARCHITECTURAL GAP (not implemented this phase):
// Google's docs confirm Gemini can understand PDFs natively via inlineData (text, images,
// diagrams, charts, tables in one pass, no OCR step) at far larger limits (per Google: up to
// 50MB/1000 pages inline, more via the separate Files API) than this app's current
// rasterize-first-N-pages fallback (attachmentTextExtraction.ts's renderScannedPdfPages, capped
// at MAX_SCANNED_PDF_PAGES = 4). Notably, `toGeminiContents` below is ALREADY mimeType-generic
// — it splits any "data:<mime>;base64,<data>" string and forwards it as inlineData verbatim,
// so it would happily accept `{mimeType: 'application/pdf', data: ...}` today with no code
// change to this function. The actual gap is one layer up: `ProviderMessage.images` (aiTypes.ts)
// and `collectImageDataUrls`/`attachmentsWithImages` (attachmentTypes.ts) are the single
// provider-agnostic pipeline every provider shares, and they're intentionally scoped to real
// image data only (image/* files + rasterized PDF pages) — mixing in raw PDF bytes there would
// mean every OTHER provider's adapter (openAICompatibleProvider's `image_url` parts) would also
// receive a PDF disguised as an "image" and either error or silently mishandle it. The smallest
// safe abstraction for a future phase is a NEW, separate, optional `ProviderMessage.documents`
// field (or similar) that only Gemini's adapter reads and every other adapter ignores — NOT
// widening `images` to carry arbitrary MIME types. Deliberately not built this phase per the
// explicit instruction to avoid "a giant Gemini Files API system" and because Gemini is already
// deprioritized project-wide (billing not enabled — see providerCapabilities.ts's
// deprioritizePenalty) — the existing rasterized-fallback path remains the production path for
// every provider, including Gemini, until this is picked up.
export const geminiProvider: AIProvider = {
  id: 'gemini',
  name: 'Google Gemini',
  capabilities: { streaming: true, vision: true, maxContextTokens: 1_000_000, supportedImageMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  isConfigured: () => ENABLED,

  async sendMessage(messages: ProviderMessage[], settings: AISettings, onChunk?: (c: AIStreamChunk) => void, signal?: AbortSignal): Promise<AIProviderResult> {
    if (!ENABLED) {
      return { content: '', finishReason: 'error', error: { code: 'not_configured', message: PROVIDER_UNAVAILABLE_MESSAGE } };
    }

    // gemini-2.0-flash was shut down by Google on 2026-06-01. Re-verified via live web
    // search this session: Google's actual documented migration path is 2.0 → 2.5 Flash
    // (not directly to 3.5 as an earlier session's comment here claimed — at least one
    // source explicitly flagged that as a common misconception). However, gemini-2.5-flash
    // is itself already scheduled to retire Oct 16, 2026, and gemini-3.5-flash is
    // independently confirmed GA/stable/production-ready per Google's own current docs
    // (ai.google.dev) — so defaulting straight to 3.5 here is a deliberate choice to avoid
    // a second migration in ~2 months, not a claim about official migration mapping.
    // Overridable via AI Settings regardless.
    const model = settings.model || 'gemini-3.5-flash';
    const systemMsg = messages.find((m) => m.role === 'system');
    const geminiBody = {
      contents: toGeminiContents(messages),
      ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
      generationConfig: {
        // Google's Gemini API release notes (as of Aug 2026) list temperature/top_p/top_k
        // as deprecated parameters for the 3.x model family — they're not confirmed to
        // cause hard errors, but this is a real signal worth re-checking against a live
        // request before relying on user-set sampling values actually taking effect.
        // FOLLOW-UP, not fixed this session: no live Gemini access here to confirm impact.
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        maxOutputTokens: settings.maxTokens,
      },
      safetySettings: mapSafety(settings.safetyLevel),
    };

    const useStream = settings.streaming && Boolean(onChunk);

    let response: Response;
    try {
      response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, stream: useStream, body: geminiBody }),
        signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return { content: '', finishReason: 'cancelled' };
      return { content: '', finishReason: 'error', error: { code: 'network', message: 'Could not reach Gemini — check your connection.' } };
    }

    if (!response.ok) {
      const code = mapStatusToCode(response.status);
      let message = `Gemini returned an error (HTTP ${response.status}).`;
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
      const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      if (!text) return { content: '', finishReason: 'error', error: { code: 'unknown', message: 'Gemini returned an empty response.' } };
      return { content: text, finishReason: mapFinishReason(json?.candidates?.[0]?.finishReason) };
    }

    // Streaming: parse SSE "data: {...}" lines as they arrive.
    const reader = response.body?.getReader();
    if (!reader) return { content: '', finishReason: 'error', error: { code: 'unknown', message: 'Streaming is not supported in this environment.' } };

    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    // Set once a chunk carries a finishReason (Gemini attaches it to the final chunk for the
    // candidate) — defaults to 'stop' only as this function's own honest fallback if the field
    // is ever absent, never as an assumption that the response actually completed.
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
          if (!jsonStr) continue;
          try {
            const chunkJson = JSON.parse(jsonStr);
            const delta = chunkJson?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
            if (delta) {
              full += delta;
              onChunk?.({ delta, done: false });
            }
            const reason = chunkJson?.candidates?.[0]?.finishReason;
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
    if (!full) return { content: '', finishReason: 'error', error: { code: 'unknown', message: 'Gemini returned an empty response.' } };
    return { content: full, finishReason: mapFinishReason(sawFinishReason) };
  },
};
