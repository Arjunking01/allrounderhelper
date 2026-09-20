// Vercel Edge Function — POST /api/contact
// Handles Contact, Feedback, and Bug Report submissions by relaying them through
// Resend's REST API. RESEND_API_KEY is read from the server environment only; it is
// never sent to or readable by the browser.

import { readJsonWithSizeLimit } from './_shared';

export const config = { runtime: 'edge' };

const DESTINATION_EMAIL = 'artistic.aura.2009@gmail.com';

const ALLOWED_TYPES = ['contact', 'feedback', 'bug'] as const;
type FormType = (typeof ALLOWED_TYPES)[number];

const SUBJECT_LABEL: Record<FormType, string> = {
  contact: 'New contact message',
  feedback: 'New feedback',
  bug: 'New bug report',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json({ error: 'Email sending is not configured on the server.' }, 503);

  // A real submission is a handful of short fields — 64KB is generous headroom over the
  // 5000-char message cap below while still rejecting a body sent to waste this function's
  // execution time/Resend usage.
  const parsed = await readJsonWithSizeLimit<{ type?: string; name?: string; email?: string; message?: string }>(req, 64 * 1024);
  if (!parsed.ok) return json({ error: parsed.message }, parsed.status);
  const body = parsed.data;
  // JSON.parse accepts top-level `null`/numbers/strings/arrays, not just objects — guard
  // before touching `body.type` etc. so a body of `null` gets a clean 400 instead of a crash.
  if (typeof body !== 'object' || body === null) {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const type: FormType = (ALLOWED_TYPES as readonly string[]).includes(body.type ?? '') ? (body.type as FormType) : 'contact';
  const name = (body.name ?? '').toString().trim().slice(0, 200);
  const email = (body.email ?? '').toString().trim().slice(0, 320);
  const message = (body.message ?? '').toString().trim().slice(0, 5000);

  if (!EMAIL_RE.test(email) || message.length === 0) {
    return json({ error: 'A valid email address and a message are required.' }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ALLROUNDER HELPER <onboarding@resend.dev>',
        to: [DESTINATION_EMAIL],
        reply_to: email,
        subject: `${SUBJECT_LABEL[type]}${name ? ` from ${name}` : ''}`,
        html: `<p><strong>Type:</strong> ${escapeHtml(type)}</p><p><strong>Name:</strong> ${escapeHtml(name || 'Not provided')}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`,
      }),
      signal: controller.signal,
    });

    if (resendRes.status === 401 || resendRes.status === 403) return json({ error: 'Email service rejected the request.' }, 502);
    if (resendRes.status === 429) return json({ error: 'Too many requests — please try again shortly.' }, 429);
    if (!resendRes.ok) return json({ error: 'The email service is unavailable right now — please try again later.' }, 502);

    return json({ ok: true }, 200);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return json({ error: 'The email service timed out — please try again.' }, 504);
    return json({ error: 'Something went wrong sending your message.' }, 500);
  } finally {
    clearTimeout(timeout);
  }
}
