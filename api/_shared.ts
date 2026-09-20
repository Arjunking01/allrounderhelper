// Shared helper for the api/* Vercel functions — not itself a route (Vercel skips files
// whose name starts with "_").
//
// Every function in api/ is a *public* endpoint: reachable directly over HTTP, not only
// through this app's own UI. The UI enforces its own bounds before a request is built (e.g.
// attachment text truncated to MAX_ATTACHMENT_TEXT_CHARS — 20,000 chars, see
// src/features/ai/logic/attachmentTypes.ts — and Contact's own field-length limits), but
// nothing stopped a request sent straight to one of these endpoints (bypassing the UI
// entirely) from carrying an arbitrarily large JSON body. For the AI proxies specifically,
// that body is buffered in full and forwarded to a real, billed provider account — a genuine
// cost/resource-exhaustion exposure, not a theoretical one, since every provider key involved
// is real and spendable (see each proxy's own header comment).
//
// This is a body-size guard, not a rate limiter. It bounds the cost of any single request; it
// does not bound how many requests one caller can send. True per-IP/per-session rate limiting
// needs a durable counter shared across invocations, which Vercel Edge Functions don't provide
// on their own (no in-memory state survives between invocations, and the same route can run
// across many isolates/regions) — that class of protection belongs at the deployment layer
// (e.g. Vercel's Firewall / rate-limiting rules configured in the project dashboard), not faked
// here with a counter that would silently do nothing in production. See PROJECT_BACKLOG.md.

export const MAX_AI_BODY_BYTES = 2 * 1024 * 1024; // 2MB default — comfortably covers real
// multi-turn, multi-attachment AI conversations (20,000 chars per attachment × several
// attachments/turns is still well under this) while rejecting payloads clearly built to
// waste provider spend. Callers with a naturally smaller legitimate body (e.g. Contact, or
// the image-generation prompt) pass a tighter explicit limit instead.
//
// IMPORTANT: this default is sized for TEXT-only request bodies. It was never raised when
// Phase 1 started sending real image bytes (base64 data URLs, ~33% larger than the source
// file) inside the same messages array for vision-capable providers — which meant a real
// photo attachment (anything much over ~1.4MB raw) was silently rejected with a generic 413
// here, before ever reaching the vendor. That's a strong candidate for the actual root cause
// behind "I attached a photo and the AI didn't see it" reports: the client-side attachment UI
// showed the image as attached and ready, but the request carrying it never got past this
// proxy. See MAX_AI_BODY_BYTES_VISION below, used specifically by the vision-capable proxies.

export const MAX_AI_BODY_BYTES_VISION = 24 * 1024 * 1024; // 24MB — used only by the AI proxies
// for providers this app actually marks vision-capable (currently Gemini, OpenAI, xAI — see
// each provider's `capabilities.vision` / `vision: true` config). Sized to comfortably fit the
// client-side budget in src/features/ai/logic/attachmentTypes.ts
// (MAX_TOTAL_IMAGE_PAYLOAD_BYTES = 18MB of base64 image data) plus headroom for the JSON
// envelope, conversation history text, and system prompt traveling in the same body — while
// still being a deliberately bounded number, not "large enough for anything," since this proxy
// buffers the full body and forwards it to a real, billed provider account (see the file-level
// comment above). Non-vision proxies (Cerebras, Mistral, OpenRouter, Z.ai, Cloudflare) keep the
// original 2MB default: images are never included in their request bodies in the first place
// (see openAICompatibleProvider.ts's toOpenAIContent, which substitutes a short text note for a
// non-vision provider instead of sending image bytes), so there's nothing to raise the limit
// for and no reason to accept a larger body from them.

type SizeLimitResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

/** Reads and JSON-parses a request body, rejecting it before it's used if it exceeds
 *  `maxBytes` — checked against the declared Content-Length first (cheap, no read required) and
 *  then enforced again against the actual bytes read, since Content-Length can be absent or lie. */
export async function readJsonWithSizeLimit<T = unknown>(
  req: Request,
  maxBytes: number = MAX_AI_BODY_BYTES
): Promise<SizeLimitResult<T>> {
  const declaredLength = req.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > maxBytes) {
    return { ok: false, status: 413, message: 'Request body is too large.' };
  }
  if (!req.body) {
    return { ok: false, status: 400, message: 'Invalid request body.' };
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // best-effort cancel — the size check below is what actually rejects the request
        }
        return { ok: false, status: 413, message: 'Request body is too large.' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, message: 'Invalid request body.' };
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, data: JSON.parse(new TextDecoder().decode(combined)) as T };
  } catch {
    return { ok: false, status: 400, message: 'Invalid request body.' };
  }
}
