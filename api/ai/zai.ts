// Vercel Edge Function — POST /api/ai/zai
// Proxies chat requests to Z.ai's OpenAI-compatible API. ZAI_API_KEY is read from the
// server environment only. Endpoint verified against Z.ai's own official developer docs
// (docs.z.ai) as of 2026: base URL https://api.z.ai/api/paas/v4, genuinely OpenAI SDK
// compatible /chat/completions schema. (This is the general API surface, not the
// separate "Coding Plan" endpoint, which uses a different base path.)

import { readJsonWithSizeLimit } from '../_shared';

export const config = { runtime: 'edge' };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) return json({ error: { message: 'ZAI_API_KEY is not set on the server.' } }, 503);

  const parsed = await readJsonWithSizeLimit(req);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, parsed.status);
  const payload = parsed.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const upstream = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
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
      return json({ error: { message: 'Z.ai request timed out.' } }, 504);
    }
    return json({ error: { message: 'Could not reach Z.ai.' } }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
