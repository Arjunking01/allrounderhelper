// Vercel Edge Function — POST /api/ai/mistral
// Proxies chat requests to Mistral's OpenAI-compatible API. MISTRAL_API_KEY is read from
// the server environment only; it is never sent to or readable by the browser. The client
// sends the same OpenAI-style body it always built and we forward it with the real Bearer
// token attached, streaming the response straight through unchanged.

import { readJsonWithSizeLimit } from '../_shared';

export const config = { runtime: 'edge' };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return json({ error: { message: 'MISTRAL_API_KEY is not set on the server.' } }, 503);

  const parsed = await readJsonWithSizeLimit(req);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, parsed.status);
  const payload = parsed.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
      return json({ error: { message: 'Mistral request timed out.' } }, 504);
    }
    return json({ error: { message: 'Could not reach Mistral.' } }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
