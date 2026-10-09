import { generateText, gateway } from 'ai';
import { readJsonWithSizeLimit } from '../_shared';

export const config = { runtime: 'edge' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type ChatMessage = { role?: string; content?: unknown };

type GatewayRequest = {
  model?: string;
  messages?: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};

// Keep the server-side route authoritative. The Settings page allows a model field
// for other providers, so never trust that client value as a Gateway model selector.
const DEFAULT_GATEWAY_MODEL = 'openai/o4-mini';
const ALLOWED_GATEWAY_MODELS = new Set([DEFAULT_GATEWAY_MODEL]);
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 100_000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function textContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((part): part is { type?: string; text?: string } => typeof part === 'object' && part !== null)
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text ?? '')
    .join('');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const parsed = await readJsonWithSizeLimit<GatewayRequest>(req);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, parsed.status);
  const payload = parsed.data;
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    return json({ error: { message: 'A conversation is required.' } }, 400);
  }
  if (payload.messages.length > MAX_MESSAGES) {
    return json({ error: { message: 'This conversation is too long for the Gateway route.' } }, 413);
  }

  const requestedModel = typeof payload.model === 'string' ? payload.model.trim() : '';
  const modelId = requestedModel || DEFAULT_GATEWAY_MODEL;
  if (!ALLOWED_GATEWAY_MODELS.has(modelId)) {
    return json({ error: { message: 'That model is not available through the managed AI route.' } }, 400);
  }
  if (payload.temperature !== undefined && (!isFiniteNumber(payload.temperature) || payload.temperature < 0 || payload.temperature > 2)) {
    return json({ error: { message: 'Temperature must be a number between 0 and 2.' } }, 400);
  }
  if (payload.top_p !== undefined && (!isFiniteNumber(payload.top_p) || payload.top_p <= 0 || payload.top_p > 1)) {
    return json({ error: { message: 'Top-p must be a number greater than 0 and at most 1.' } }, 400);
  }
  if (payload.max_tokens !== undefined && (!Number.isInteger(payload.max_tokens) || payload.max_tokens < 1 || payload.max_tokens > 16_384)) {
    return json({ error: { message: 'The requested output length is not supported.' } }, 400);
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = payload.messages
    .map((message): { role: 'system' | 'user' | 'assistant'; content: string } => ({
      role: message.role === 'system' || message.role === 'assistant' ? message.role : 'user',
      content: textContent(message.content),
    }))
    .filter((message) => message.content.length > 0);
  if (messages.length === 0) return json({ error: { message: 'The conversation contains no valid text.' } }, 400);
  if (messages.some((message) => message.content.length > MAX_MESSAGE_CHARS)) {
    return json({ error: { message: 'One or more messages are too long.' } }, 413);
  }

  try {
    const result = await generateText({
      model: gateway(modelId),
      messages,
      temperature: typeof payload.temperature === 'number' ? payload.temperature : undefined,
      maxOutputTokens: typeof payload.max_tokens === 'number' ? payload.max_tokens : undefined,
    });

    return json({
      choices: [{
        message: { role: 'assistant', content: result.text },
        finish_reason: result.finishReason === 'length' ? 'length' : 'stop',
      }],
    });
  } catch {
    return json({ error: { message: 'The AI Gateway could not complete this request.' } }, 502);
  }
}
