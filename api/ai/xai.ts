// Vercel Edge Function — POST /api/ai/xai
// Proxies chat requests to xAI's OpenAI-compatible Grok API. XAI_API_KEY is read from the
// server environment only. Endpoint verified against xAI's own docs (docs.x.ai) and
// multiple independent sources as of mid-2026: base URL https://api.x.ai/v1, genuinely
// OpenAI-compatible /chat/completions schema (same request/response shape as OpenAI).

import { readJsonWithSizeLimit, MAX_AI_BODY_BYTES_VISION } from '../_shared';

export const config = { runtime: 'edge' };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return json({ error: { message: 'XAI_API_KEY is not set on the server.' } }, 503);

  // xAI is vision-capable (vision: true in XaiProvider.ts, verified this session against
  // docs.x.ai) — real image bytes travel in this body, so it needs the raised limit. See
  // _shared.ts's MAX_AI_BODY_BYTES_VISION comment for why the plain default was a live bug.
  const parsed = await readJsonWithSizeLimit(req, MAX_AI_BODY_BYTES_VISION);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, parsed.status);
  const payload = parsed.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return json({ error: { message: 'xAI request timed out.' } }, 504);
    }
    return json({ error: { message: 'Could not reach xAI.' } }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
