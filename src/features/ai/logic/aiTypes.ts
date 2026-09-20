/**
 * Provider-agnostic AI architecture.
 *
 * Nothing in this file calls a real AI service. It defines the contracts a future
 * provider (Gemini, OpenAI, Claude, OpenRouter, a local model, etc.) must implement
 * so the rest of the app — chat UI, settings, prompt library — never needs to change
 * when a provider is swapped in or added.
 */

import type { Attachment } from './attachmentTypes';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** Set when this message is an honest system notice (e.g. "no provider connected") rather than a real model reply. */
  isSystemNotice?: boolean;
  /** Set specifically when the notice represents a failed request (as opposed to a benign
   *  informational notice like "switched provider") — drives error styling + a retry action. */
  isError?: boolean;
  /** True while a message is a placeholder for content still streaming in. Never set without a real stream in progress. */
  isStreaming?: boolean;
  pinned?: boolean;
  generationMs?: number;
  modelUsed?: string;
  attachments?: Attachment[];
  /** PHASE 2 — the provider's completion signal for this exact message's content, persisted
   *  (not just held in transient React state) so a reloaded/reopened conversation still knows
   *  honestly whether this answer was ever verified complete. Undefined for older messages
   *  created before this field existed, for user messages, and for system notices/errors —
   *  treat undefined the same as 'stop' (nothing to continue) rather than as "unknown missing
   *  data", since every real code path that produces an assistant message now sets this. */
  finishReason?: 'stop' | 'length' | 'error' | 'cancelled' | 'unknown';
  /** PHASE 2 — true when a real Continue action is currently offered for this message: set
   *  alongside `finishReason` ('length' or 'unknown') and cleared once the per-message manual
   *  continuation cap (see generationEngine's MAX_MANUAL_CONTINUATIONS_PER_ACTION) is reached,
   *  or once a later continuation pass genuinely completes ('stop'). Deliberately its own field
   *  rather than re-deriving "continuable = finishReason is length/unknown" at render time, so
   *  reaching the manual cap can turn this off without pretending the underlying completion
   *  signal changed. */
  continuable?: boolean;
  /** PHASE 2 — how many times the visible Continue button has been used on this specific
   *  message (not counting the automatic in-request continuation passes that already ran
   *  before the message became continuable). Bounded by MAX_MANUAL_CONTINUATIONS_PER_ACTION. */
  manualContinuations?: number;
}

export type ConversationFolder = 'academic' | 'coding' | 'math' | 'personal' | 'general';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  providerId: string;
  folder: ConversationFolder;
  pinned: boolean;
  archived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const FOLDER_LABELS: Record<ConversationFolder, string> = {
  academic: 'Academic',
  coding: 'Coding',
  math: 'Math',
  personal: 'Personal',
  general: 'General',
};

/** The wire-format message shape a provider implementation receives — deliberately minimal.
 *  `images`, when present, is base64 data URLs for attachments the user actually attached to
 *  THIS message (never inherited from other messages). A provider adapter must only fold these
 *  into the outgoing request when its own `capabilities.vision` is true — routing (see
 *  providerRegistry.getRoutedFallbackChain / providerOrchestrator's `requireVision`) is
 *  responsible for making sure an image-bearing request is never handed to a non-vision
 *  provider in the first place, but adapters still guard on their own capability as a second,
 *  independent line of defense so a routing bug can never silently ship garbage image data
 *  into a text-only request body. */
export interface ProviderMessage {
  role: ChatRole;
  content: string;
  images?: string[];
}

export type AIErrorCode =
  | 'not_configured'
  | 'rate_limited'
  | 'network'
  | 'invalid_key'
  | 'timeout'
  | 'context_overflow'
  | 'provider_unavailable'
  | 'unknown';

export interface AIError {
  code: AIErrorCode;
  message: string;
  /** Present for rate_limited errors, so a future UI can show a countdown. */
  retryAfterMs?: number;
  /** HTTP status of the provider/proxy response this error came from, when there was one. Numeric
   *  only (safe to keep for diagnostics/tests) — never carries provider-authored text. */
  status?: number;
}

/** Plain-language message for failures that come from how the service is set up on the server
 *  (provider not enabled, key missing/rejected). Students can't fix those, and the raw server
 *  text names internal environment variables, so it must never be shown to them. */
export const PROVIDER_UNAVAILABLE_MESSAGE = 'No AI provider is currently available. Please try again later.';

export const RATE_LIMITED_MESSAGE = 'The AI is very busy or has reached its usage limit right now. Please wait a few minutes and try again.';
export const SERVICE_UNAVAILABLE_MESSAGE = 'The AI service is temporarily unavailable. Please try again in a few minutes.';
export const TIMEOUT_MESSAGE = 'The AI took too long to respond. Please try again, or shorten your message.';
export const CONTEXT_TOO_LARGE_MESSAGE = 'This conversation or attachment is too large for the AI to process. Try starting a new chat or removing an attachment.';
export const INVALID_REQUEST_MESSAGE = "The AI couldn't process this request. Try rephrasing your message or removing attachments, then try again.";

/** A 400 whose text is really about credentials, permissions or billing (e.g. Gemini reports an invalid
 *  key as HTTP 400, not 401) is a configuration failure, not something a student can act on. */
const CONFIG_SHAPED = /api[\s_-]?key|unauthori[sz]ed|authenticat|permission|forbidden|billing|quota|credit|subscription|invalid[\s_-]?token|access[\s_-]?token/i;
const SIZE_SHAPED = /context|too (long|large|big)|tokens?\b|maximum.{0,20}(length|size)|exceed|payload|request (body|entity)/i;

/** Returns the message safe to show a student for a failed provider HTTP response. Provider-authored
 *  text (billing/quota sentences, key fragments, internal request ids, raw upstream errors) is never
 *  passed through for the HTTP-error classes below; each maps to fixed, plain wording. `network`/`unknown`
 *  errors are authored by our own adapters and keep their own message. Decisions elsewhere (retry,
 *  failover, quota) are made on `code`, never on this text. `status` is optional so older callers keep
 *  working; when present it lets a 413 be told apart from an ambiguous 400. */
export function studentSafeErrorMessage(code: AIErrorCode, rawMessage: string, status?: number): string {
  switch (code) {
    case 'not_configured':
    case 'invalid_key':
      return PROVIDER_UNAVAILABLE_MESSAGE;
    case 'rate_limited':
      return RATE_LIMITED_MESSAGE;
    case 'provider_unavailable':
      return SERVICE_UNAVAILABLE_MESSAGE;
    case 'timeout':
      return TIMEOUT_MESSAGE;
    case 'context_overflow':
      if (CONFIG_SHAPED.test(rawMessage)) return PROVIDER_UNAVAILABLE_MESSAGE;
      if (status === 413 || status === undefined || SIZE_SHAPED.test(rawMessage)) return CONTEXT_TOO_LARGE_MESSAGE;
      return INVALID_REQUEST_MESSAGE;
    case 'unknown':
      // `status` is only ever set by the HTTP-error branch of a provider adapter (see
      // openAICompatibleProvider.ts / CloudflareProvider.ts / GeminiProvider.ts), where
      // `rawMessage` may be the provider's own `error.message` / `errors[0].message` JSON
      // field — text that can legitimately contain internal endpoint names, request ids, or
      // billing/quota wording for HTTP statuses this app hasn't explicitly classified (e.g.
      // 404/405/409/422/451). `mapStatusToCode` only returns 'unknown' for such unclassified
      // HTTP statuses or for adapter-internal failures with no status at all; for the latter,
      // `rawMessage` is already app-authored (e.g. "<provider> returned an empty response."),
      // so returning the fixed string here trades a small amount of specificity in that case
      // for the guarantee — required by this app's error-safety contract — that provider-authored
      // text is never surfaced to a student.
      if (status !== undefined) return INVALID_REQUEST_MESSAGE;
      return rawMessage;
    default:
      return rawMessage;
  }
}

export const ERROR_RECOVERY_HINTS: Record<AIErrorCode, string> = {
  not_configured: 'No AI provider is currently available — please try again later.',
  rate_limited: 'You\'ve hit the provider\'s rate limit — wait a moment and try again.',
  network: 'Check your internet connection and try again.',
  invalid_key: 'This AI provider is unavailable right now — please try again later.',
  timeout: 'The request took too long — try again, or shorten your message.',
  context_overflow: 'This conversation is too long for the model\'s context window — start a new chat or clear older messages.',
  provider_unavailable: 'The provider\'s service seems to be down — try again shortly.',
  unknown: 'Something unexpected happened — try again.',
};

export interface AIProviderResult {
  content: string;
  /** 'unknown' — Phase 1.7 — is distinct from 'stop': it means the underlying provider's
   *  response shape genuinely does not expose a completion/truncation signal (see
   *  CloudflareProvider.ts), so this app cannot honestly claim the answer is complete OR that
   *  it was cut off. It must never be treated as 'length' (no auto-continue — there's nothing
   *  to continue from, since the provider gave no truncation signal to act on) and must never
   *  be silently displayed as if it were a verified-complete 'stop' — see AiAssistantPage's
   *  handling, which shows a small honest caveat for this case instead of staying silent. */
  finishReason: 'stop' | 'length' | 'error' | 'cancelled' | 'unknown';
  error?: AIError;
}

/** A single streamed chunk. `done: true` on the final chunk (which may carry the full/aggregated result too). */
export interface AIStreamChunk {
  delta: string;
  done: boolean;
  /** Set on the first chunk of a new attempt (retry or provider failover) so consumers
   *  accumulating streamed text know to discard whatever was buffered from the previous,
   *  now-abandoned attempt instead of appending on top of it. */
  reset?: boolean;
}

export interface AIProviderCapabilities {
  streaming: boolean;
  vision: boolean;
  maxContextTokens: number;
  /** Phase 1.7 — the exact image MIME types this provider/model actually accepts, per that
   *  vendor's own current documentation (not "images in general"). REQUIRED whenever
   *  `vision` is true — routing (see providerRegistry.getRoutedFallbackChain) treats a
   *  vision-capable provider with this left undefined as accepting nothing, not everything,
   *  since silently guessing "probably fine" for an unverified format is exactly the failure
   *  mode this field exists to prevent (see PHASE_1_7 finding: xAI documents jpg/jpeg + png
   *  only — no WebP — despite this app also accepting WebP uploads generally). Undefined/omitted
   *  is correct and expected for a non-vision provider (`vision: false`). */
  supportedImageMimeTypes?: string[];
}

export type SafetyLevel = 'strict' | 'balanced' | 'relaxed';

export interface AISettings {
  activeProviderId: string;
  apiKey: string;
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
  presencePenalty: number;
  contextLength: number;
  maxTokens: number;
  streaming: boolean;
  systemPrompt: string;
  safetyLevel: SafetyLevel;
  creativity: number; // 0-100, a simplified single-slider alternative to raw temperature
  reasoningMode: boolean; // placeholder — no provider implements this yet
  visionEnabled: boolean; // placeholder — no provider implements this yet
  voiceEnabled: boolean; // real: gates the browser-native speech-to-text mic button in the composer (see useSpeechToText.ts) — not a provider capability, so it works regardless of which AI provider is active
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  activeProviderId: 'none',
  apiKey: '',
  model: '',
  temperature: 0.7,
  topP: 1,
  topK: 40,
  frequencyPenalty: 0,
  presencePenalty: 0,
  contextLength: 8192,
  // Was 1024 — too small for a full PDF summary + viva questions in one pass, which is
  // exactly what produced the "response cuts off, then 'continue' gives the rest" bug.
  // 2048 covers most study-workflow answers in a single pass; anything longer than that
  // is now handled automatically by the auto-continue loop in AiAssistantPage's send().
  maxTokens: 2048,
  streaming: true,
  systemPrompt: 'You are a helpful, encouraging study assistant for students. Explain clearly, show your steps, and keep answers focused.',
  safetyLevel: 'balanced',
  creativity: 50,
  reasoningMode: false,
  visionEnabled: false,
  voiceEnabled: false,
};

/**
 * The contract every AI provider implementation must satisfy.
 * `sendMessage` is async and streaming-ready: pass `onChunk` to receive incremental
 * deltas when `capabilities.streaming` is true; the returned Promise always resolves
 * with the final aggregated result regardless of whether streaming was used.
 */
export interface AIProvider {
  id: string;
  name: string;
  capabilities: AIProviderCapabilities;
  isConfigured(settings: AISettings): boolean;
  sendMessage(messages: ProviderMessage[], settings: AISettings, onChunk?: (chunk: AIStreamChunk) => void, signal?: AbortSignal): Promise<AIProviderResult>;
}

/** Metadata for providers shown in Settings — includes providers with no real implementation yet ("planned"). */
export interface ProviderMeta {
  id: string;
  name: string;
  status: 'available' | 'planned';
  description: string;
}
