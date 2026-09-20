// Vercel Edge Function — POST /api/ai/pollinations-image
// Proxies image-generation requests to Pollinations AI. POLLINATIONS_AI_API_KEY is read
// from the server environment only — Pollinations' own docs explicitly warn against
// exposing secret keys (sk_...) in client-side code, so this cannot be called directly
// from the browser the way OpenRouter is.
//
// Endpoint verified against Pollinations' own official docs (APIDOCS.md / gen.pollinations.ai/docs)
// as of 2026: GET https://gen.pollinations.ai/image/{prompt}, Authorization: Bearer <key>.
// This is a capability distinct from text chat — deliberately not wired through the
// AIProvider/chat-completions interface (see imageGeneration.ts on the client side).

import { readJsonWithSizeLimit } from '../_shared';

export const config = { runtime: 'edge' };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const apiKey = process.env.POLLINATIONS_AI_API_KEY;
  if (!apiKey) return json({ error: { message: 'POLLINATIONS_AI_API_KEY is not set on the server.' } }, 503);

  // Small cap here — a prompt is never legitimately more than a couple KB, so this endpoint
  // doesn't need the full 2MB default the chat proxies use.
  const parsed = await readJsonWithSizeLimit<{ prompt?: string }>(req, 64 * 1024);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, parsed.status);
  const payload = parsed.data;
  // JSON.parse accepts top-level `null`/numbers/strings/arrays, not just objects — guard
  // before touching `payload.prompt` so a body of `null` gets a clean 400 instead of a crash.
  if (typeof payload !== 'object' || payload === null) {
    return json({ error: { message: 'Invalid request body.' } }, 400);
  }

  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
  if (!prompt) return json({ error: { message: 'A prompt is required.' } }, 400);
  if (prompt.length > 2000) return json({ error: { message: 'Prompt is too long.' } }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const upstream = await fetch(`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });

    if (!upstream.ok) {
      let message = `Pollinations returned an error (HTTP ${upstream.status}).`;
      try {
        const errJson = await upstream.json();
        message = errJson?.error?.message ?? message;
      } catch {
        // response wasn't JSON (likely for a successful image, but this branch is only
        // reached on !ok, so a non-JSON error body just falls back to the default message)
      }
      return json({ error: { message } }, upstream.status);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return json({ error: { message: 'Image generation timed out.' } }, 504);
    }
    return json({ error: { message: 'Could not reach Pollinations.' } }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
