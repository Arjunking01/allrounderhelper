// Vercel Edge Function — POST /api/ai/cloudflare
// Proxies chat requests to Cloudflare Workers AI. CLOUDFLARE_ACCOUNT_ID and
// CLOUDFLARE_API_TOKEN are read from the server environment only.
//
// Endpoint: the plain "Execute AI model" REST endpoint documented directly in
// Cloudflare's own official Workers AI get-started guide (developers.cloudflare.com/
// workers-ai/get-started/rest-api/) as of 2026:
//   POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
// Deliberately NOT using the newer /ai/v1/chat/completions (AI Gateway) endpoint —
// per Cloudflare's own AI Gateway REST API docs, that path requires a `cf-aig-gateway-id`
// header (a gateway ID), which was not among the configured environment variables. Rather
// than guess a gateway ID, this uses the endpoint that's verified to work with only an
// account ID and API token.
//
// Response shape: { result: { response: string }, success: boolean, errors: [] } — this
// is NOT an OpenAI-compatible shape, which is why CloudflareProvider.ts is a bespoke
// provider rather than using createOpenAICompatibleProvider.

import { readJsonWithSizeLimit } from '../_shared';

export const config = { runtime: 'edge' };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return json({ error: { message: 'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN are not set on the server.' } }, 503);
  }

  const parsed = await readJsonWithSizeLimit<{ messages?: unknown; model?: string }>(req);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, parsed.status);
  const payload = parsed.data;
  // JSON.parse accepts top-level `null`/numbers/strings/arrays, not just objects — without
  // this check, a body of `null` (or any other non-object JSON) would throw on `payload.model`
  // below instead of returning a clean 400.
  if (typeof payload !== 'object' || payload === null) {
    return json({ error: { message: 'Invalid request body.' } }, 400);
  }

  // `model` is client-controlled (free-text field in AI Settings) and gets interpolated
  // directly into the upstream URL path below. Without validation, a crafted value
  // (e.g. containing "../" path-traversal segments) could redirect this authenticated
  // request to a different Cloudflare API v4 path using this server's own
  // CLOUDFLARE_API_TOKEN — a path-injection/SSRF risk, not just a bad model name. Workers AI
  // model ids always look like "@cf/<vendor>/<name>", so anything else is rejected outright
  // rather than attempting to sanitize it.
  const CF_MODEL_ID = /^@cf\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/;
  const requestedModel = typeof payload.model === 'string' ? payload.model : '';
  if (requestedModel && !CF_MODEL_ID.test(requestedModel)) {
    return json({ error: { message: `Invalid Cloudflare Workers AI model id: "${requestedModel}". Expected the form "@cf/<vendor>/<model>".` } }, 400);
  }
  const model = requestedModel || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const upstream = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify({ messages: payload.messages }),
        signal: controller.signal,
      }
    );

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return json({ error: { message: 'Cloudflare Workers AI request timed out.' } }, 504);
    }
    return json({ error: { message: 'Could not reach Cloudflare Workers AI.' } }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
