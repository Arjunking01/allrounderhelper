// Vercel Edge Function — POST /api/ai/gemini
// Proxies chat requests to Google's Generative Language API. GEMINI_API_KEY is read from
// the server environment only; it is never sent to or readable by the browser. The client
// sends the already-built Gemini request body and we forward it, streaming the response
// straight through so the existing client-side SSE parser needs no changes.

import { readJsonWithSizeLimit, MAX_AI_BODY_BYTES_VISION } from '../_shared';

export const config = { runtime: 'edge' };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

interface GeminiProxyRequest {
  model?: string;
  stream?: boolean;
  body?: unknown;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: { message: 'GEMINI_API_KEY is not set on the server.' } }, 503);

  // Gemini is vision-capable (capabilities.vision: true in GeminiProvider.ts) — real image
  // bytes travel in this body, so it needs the raised limit. See _shared.ts's
  // MAX_AI_BODY_BYTES_VISION comment for why the plain default was a live bug for images.
  const parsed = await readJsonWithSizeLimit<GeminiProxyRequest>(req, MAX_AI_BODY_BYTES_VISION);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, parsed.status);
  const payload = parsed.data;
  // JSON.parse accepts top-level `null`/numbers/strings/arrays, not just objects — without
  // this check, a body of `null` (or any other non-object JSON) would throw on `payload.model`
  // below instead of returning a clean 400.
  if (typeof payload !== 'object' || payload === null) {
    return json({ error: { message: 'Invalid request body.' } }, 400);
  }

  // Only allow Gemini's actual model-name shape (letters, digits, dot, dash) — this value is
  // interpolated directly into the upstream URL path ahead of our real API key, and this route
  // is a public endpoint reachable directly (not only through the app's own UI), so it must be
  // validated server-side rather than trusted from the client.
  const rawModel = (payload.model || 'gemini-3.5-flash').toString();
  if (!/^[a-zA-Z0-9.-]{1,100}$/.test(rawModel)) {
    return json({ error: { message: 'Invalid model name.' } }, 400);
  }
  const model = encodeURIComponent(rawModel);
  const useStream = Boolean(payload.stream);
  const endpoint = useStream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.body ?? {}),
      signal: controller.signal,
    });

    // Pass the upstream status and body straight through (including the raw SSE stream for
    // streaming requests) — the client already knows how to parse Gemini's response shape.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return json({ error: { message: 'Gemini request timed out.' } }, 504);
    }
    return json({ error: { message: 'Could not reach Gemini.' } }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
