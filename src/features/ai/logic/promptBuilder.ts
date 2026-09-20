import type { ChatMessage, ProviderMessage, AISettings } from './aiTypes';
import { attachmentsWithText, collectImageDataUrls } from './attachmentTypes';
import { buildSiteIdentityPrompt } from './siteKnowledge';

// PHASE 1.7 — conversation-history bounding.
//
// Previously buildProviderMessages sent the ENTIRE, unbounded message history on every
// request — every past turn's text AND every past turn's images (collectImageDataUrls ran
// per-message across the whole array, not just the newest one). Attachment.dataUrl/pageImages
// are deliberately kept in memory for the whole session (see useConversations.ts's
// stripUnpersistableAttachmentData — only the PERSISTED copy strips them), so a real multi-turn
// conversation with a few image attachments scattered through it would silently re-upload every
// one of those images again on every single subsequent request, forever, alongside a
// continuously growing block of history text. Combined with api/_shared.ts's
// MAX_AI_BODY_BYTES_VISION (24MB) — a hard proxy limit, not a soft one — this was a real,
// eventually-guaranteed failure mode for exactly the kind of sustained study conversation this
// app is built for, not a theoretical edge case.
//
// Two independent bounds, both deterministic (no live token-counting, no external
// dependency — see the phase brief's explicit "don't over-engineer" instruction):
//  1. Images: only the single most recent image-bearing message keeps its images. Every
//     earlier image-bearing message has its images stripped and replaced with a short text
//     note instead of silently vanishing — the model still knows an image was there and
//     roughly when, it just isn't re-sent. A multi-turn "look at this new photo" flow still
//     works correctly (the new message's own images always survive this step); it's only
//     OLDER images that stop being repeated forever.
//  2. Text volume: history is trimmed from the OLDEST message forward (never the newest) until
//     it fits a character budget derived from the user's own `contextLength` setting (already
//     existed in AISettings, previously collected but never actually enforced anywhere) via a
//     plain chars-per-token estimate. The single most recent message is always kept regardless
//     of size — it's the actual question/continuation this request exists to answer.
const CHARS_PER_TOKEN_ESTIMATE = 4; // rough, deliberately simple — not a real tokenizer
const HISTORY_TEXT_BUDGET_RATIO = 0.5; // reserve the rest of contextLength for system prompt + output
const HISTORY_IMAGE_MESSAGES_KEPT = 1;

/** Bounds a provider-ready history array per the two rules above. Called once, inside
 *  buildProviderMessages, so every caller (initial send, auto-continue passes, retry) gets the
 *  same protection automatically with no call-site changes needed. */
function boundHistory(history: ProviderMessage[], settings: AISettings): ProviderMessage[] {
  if (history.length === 0) return history;

  // Rule 1 — images: find the indices of the most recent HISTORY_IMAGE_MESSAGES_KEPT
  // image-bearing message(s); strip images from every earlier one.
  const imageIndices: number[] = [];
  for (let i = history.length - 1; i >= 0 && imageIndices.length < HISTORY_IMAGE_MESSAGES_KEPT; i--) {
    if (history[i].images?.length) imageIndices.push(i);
  }
  const keepImageIndex = new Set(imageIndices);
  const imagesBounded = history.map((m, i) => {
    if (!m.images?.length || keepImageIndex.has(i)) return m;
    const note = `[${m.images.length} image(s) attached earlier in this conversation — not re-sent with this request to keep it within size limits.]`;
    return { ...m, images: undefined, content: m.content ? `${m.content}\n\n${note}` : note };
  });

  // Rule 2 — text volume: keep messages from the end backward while under budget; the newest
  // message is always kept even if it alone exceeds the budget (nothing else to trim it to).
  const charBudget = Math.max(settings.contextLength || 0, 2048) * CHARS_PER_TOKEN_ESTIMATE * HISTORY_TEXT_BUDGET_RATIO;
  let runningChars = 0;
  const kept: ProviderMessage[] = [];
  for (let i = imagesBounded.length - 1; i >= 0; i--) {
    const m = imagesBounded[i];
    const cost = m.content.length + (m.images?.reduce((sum, url) => sum + url.length, 0) ?? 0);
    if (kept.length > 0 && runningChars + cost > charBudget) break; // older than this no longer fits
    runningChars += cost;
    kept.unshift(m);
  }
  return kept;
}

/**
 * Builds the message array a provider's sendMessage() expects, from the conversation's
 * message history and the configured system prompt. Kept separate from any provider so
 * every provider implementation receives an identically-shaped conversation.
 *
 * The ALLROUNDER HELPER identity + website-knowledge + language-matching preamble
 * (`buildSiteIdentityPrompt`) is always prepended ahead of the mode-specific or
 * user-customized system prompt, for every provider. This is deliberate: previously,
 * selecting a chat mode (Coding Assistant, Resume Assistant, etc.) fully replaced
 * `settings.systemPrompt`, which silently dropped the platform identity and — since
 * nothing anywhere instructed the model to match the user's language — was the root
 * cause of providers (observed with Mistral) drifting into unrelated languages mid-reply.
 * Combining both prompts here, once, fixes it for every provider and every mode without
 * touching provider-specific adapter code.
 */
export function buildProviderMessages(messages: ChatMessage[], settings: AISettings): ProviderMessage[] {
  const rawHistory: ProviderMessage[] = messages
    .filter((m) => !m.isSystemNotice)
    .map((m) => {
      const images = collectImageDataUrls(m.attachments);
      return { role: m.role, content: withAttachmentText(m), images: images.length ? images : undefined };
    });

  const history = boundHistory(rawHistory, settings);

  const modePrompt = settings.systemPrompt.trim();
  const combined = modePrompt ? `${buildSiteIdentityPrompt()}\n\n---\n\n${modePrompt}` : buildSiteIdentityPrompt();
  return [{ role: 'system', content: combined }, ...history];
}

// PHASE 1.7 — kept comfortably under api/_shared.ts's MAX_AI_BODY_BYTES_VISION (24MB) so
// there's still headroom for each provider's own wrapper JSON (generationConfig,
// safetySettings, sampling params, etc.) on top of the messages array measured here.
export const MAX_ESTIMATED_REQUEST_BYTES = 20 * 1024 * 1024;

/** Deterministic pre-send measurement of the actual outgoing payload size (post-boundHistory),
 *  used by AiAssistantPage to reject an over-budget send honestly before it ever reaches the
 *  network, instead of discovering the same thing later as a generic HTTP 413. A fast, close
 *  proxy for the real wire size — not byte-for-byte identical to every provider's own request
 *  shape (Gemini/OpenAI add a few hundred bytes of their own wrapper fields), which is why the
 *  budget above is kept with real headroom rather than tuned to the exact limit. */
export function estimateProviderMessagesBytes(messages: ProviderMessage[]): number {
  return new TextEncoder().encode(JSON.stringify(messages)).length;
}

/** Appends any extracted attachment text to a message's content before it goes to the
 *  provider. The displayed `ChatMessage.content` stays exactly what the user typed —
 *  this only affects what the model actually receives. Attachments still being read,
 *  or with nothing extractable (images, failed reads), contribute nothing here. */
function withAttachmentText(m: ChatMessage): string {
  const withText = attachmentsWithText(m.attachments);
  if (withText.length === 0) return m.content;
  const blocks = withText.map((a) => `--- Attached file: ${a.name} ---\n${a.text}\n--- end of ${a.name} ---`).join('\n\n');
  return m.content ? `${m.content}\n\n${blocks}` : blocks;
}
