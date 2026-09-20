import type { AISettings, AIStreamChunk, AIError, ProviderMessage, ChatMessage } from './aiTypes';
import { sendWithFailover, type RoutingContext } from './providerOrchestrator';
import { estimateProviderMessagesBytes, MAX_ESTIMATED_REQUEST_BYTES } from './promptBuilder';

/**
 * PHASE 2 — the single generation core behind NORMAL SEND, CONTINUE, RETRY, and EDIT+REGENERATE.
 *
 * Before this phase, `send()` and `retryLast()` in AiAssistantPage each hand-rolled their own
 * copy of: an AbortController per attempt, an `accumulatedText`/`liveText` pair to tell
 * "confirmed from a finished pass" apart from "still streaming in this pass" (needed because
 * `sendWithFailover` emits a `reset: true` chunk on every retry/failover attempt, which must
 * only wipe the CURRENT pass's partial text), and the length-triggered auto-continuation loop.
 * A real Continue action needs that exact same loop a third time — extending it in place instead
 * of writing a third copy is the smallest safe way to add Continue without regressing Retry or
 * Send (see PHASE_2_LEDGER.md, "Architecture").
 *
 * This module owns none of: request-size checks, capability/vision routing decisions, or
 * conversation persistence — those stay in AiAssistantPage (size/capability checks happen
 * BEFORE a generation starts, so they can honestly refuse before burning a daily-message
 * credit) and useConversations (which owns the actual stored ChatMessage shape). What this
 * module owns is exactly the streaming/continuation loop itself.
 */

/** Bounds how many times a single logical answer can auto-continue itself within ONE
 *  generation action (a fresh send, a single Continue click, a Retry, or an Edit's
 *  regeneration) before this app gives up and tells the student the answer is genuinely very
 *  long. Applies uniformly to every mode — previously this constant existed only inside
 *  `send()`, so Retry/Continue/Edit had no equivalent bound at all. */
export const MAX_AUTO_CONTINUATIONS = 4;

/** Bounds how many times the VISIBLE Continue button can be clicked on the same message,
 *  across separate user actions (as opposed to MAX_AUTO_CONTINUATIONS, which bounds automatic
 *  passes inside a single action). Prevents a pathological provider that always reports
 *  'length'/'unknown' from turning into an unbounded sequence of manual clicks against one
 *  message. Chosen as a generous-but-finite number for a genuinely very long study answer —
 *  not tuned to any provider-specific token limit. */
export const MAX_MANUAL_CONTINUATIONS_PER_ACTION = 4;

export const CONTINUE_INSTRUCTION =
  'Continue your previous answer exactly from the point where it left off. Do not repeat anything you already said, do not restart the answer, and do not restate the question — continue naturally.';

/** PHASE 2.1 — headroom reserved on top of MAX_ESTIMATED_REQUEST_BYTES's own already-generous
 *  margin (see promptBuilder.ts), specifically for the two small fields a continuation pass
 *  adds on top of `baseProviderMessages`: the CONTINUE_INSTRUCTION message itself and the
 *  JSON punctuation/field-name overhead of one extra array entry. Small and fixed rather than
 *  computed, since both of those are themselves fixed-size. */
const CONTINUATION_OVERHEAD_SAFETY_BYTES = 4 * 1024;

const utf8ByteLength = (s: string) => new TextEncoder().encode(s).length;

/** PHASE 2.1 — the actual fix for "Continue's real request size was never measured": every
 *  earlier version of this loop measured `estimateProviderMessagesBytes(baseProviderMessages)`
 *  ONLY, which never included the accumulated-answer-so-far a continuation pass appends. A long
 *  base history plus a long accumulated answer could together exceed the request budget even
 *  though the base history alone passed every preflight check. This function bounds exactly
 *  the one thing that grows unboundedly across passes (`accumulatedText`, since it only ever
 *  gets longer) down to whatever byte budget is actually left after `baseProviderMessages` and
 *  the instruction overhead — WITHOUT ever touching the real, full, displayed answer, which
 *  stays intact in `accumulatedText` regardless (see `runGenerationLoop`'s own returned value).
 *  Only the copy of it SENT as continuation context to the provider is ever shortened, and only
 *  ever from the front (oldest part of the answer) — mirroring promptBuilder.boundHistory's own
 *  "keep the newest, note the rest" strategy for the same reason: the newest part of the answer
 *  is what "continue from where this left off" actually needs. */
function boundAccumulatedTextForContinuationPass(accumulatedText: string, baseProviderMessagesBytes: number): { text: string; fits: boolean } {
  const instructionOverhead = utf8ByteLength(CONTINUE_INSTRUCTION) + CONTINUATION_OVERHEAD_SAFETY_BYTES;
  const available = MAX_ESTIMATED_REQUEST_BYTES - baseProviderMessagesBytes - instructionOverhead;
  if (available <= 0) return { text: '', fits: false }; // base history alone already leaves no room at all
  if (utf8ByteLength(accumulatedText) <= available) return { text: accumulatedText, fits: true };

  const note = "[...earlier part of this answer omitted from what's sent to the model, to stay within the request size limit — it is NOT lost, only not re-sent as context...]\n\n";
  const noteBytes = utf8ByteLength(note);
  if (noteBytes >= available) return { text: '', fits: false }; // pathological: budget too small even for the note itself
  const tailBudget = available - noteBytes;

  // Deterministic, no external tokenizer (consistent with promptBuilder's own char-based
  // estimate) — shrink from the front in coarse steps until the tail's own encoded size fits.
  let tail = accumulatedText;
  while (tail.length > 0 && utf8ByteLength(tail) > tailBudget) {
    tail = tail.slice(Math.max(1, Math.ceil(tail.length * 0.1)));
  }
  return { text: note + tail, fits: true };
}

export type GenerationFinishReason = 'stop' | 'length' | 'error' | 'cancelled' | 'unknown';

export interface GenerationLoopResult {
  /** The FULL text for this logical answer — `seedText` plus everything generated across every
   *  pass of this loop. Never a fragment: callers should write this directly into the message's
   *  `content`, never concatenate it onto anything themselves (see PHASE_2 requirement "Continue
   *  must not duplicate content" — the loop is the one and only place text is assembled). */
  accumulatedText: string;
  finishReason: GenerationFinishReason;
  providerId: string;
  providerName: string;
  /** Set when the request succeeded on a different provider than originally selected/used. */
  switchedFrom?: string;
  error?: AIError;
}

export interface RunGenerationLoopParams {
  /** Provider-ready messages representing the actual conversation this answer is FOR — i.e.
   *  exactly what buildProviderMessages(history, settings) would produce for the turn being
   *  answered. Reused as-is for every continuation pass (the continuation instruction + the
   *  answer-so-far are appended on top of this, never used to replace it) so continuation
   *  requests keep the same document/image/task context as the original turn — see
   *  `deriveRoutingContextFor` in AiAssistantPage for why this must come from the ORIGINAL user
   *  turn's attachments/text, not the literal word "Continue". */
  baseProviderMessages: ProviderMessage[];
  /** '' for a fresh send/retry/edit-regenerate. The existing assistant text for a manual
   *  Continue — the loop treats this exactly like text confirmed from an earlier pass. */
  seedText: string;
  settings: AISettings;
  routing?: RoutingContext;
  /** MAX_AUTO_CONTINUATIONS for a fresh send/retry/edit; also MAX_AUTO_CONTINUATIONS for a
   *  manual Continue click (the click itself is bounded separately, per-message, by
   *  MAX_MANUAL_CONTINUATIONS_PER_ACTION — this parameter only bounds passes *within* that one click). */
  maxPasses: number;
  /** Supplies a fresh AbortController for each pass and is responsible for making it the one a
   *  Stop button would abort (i.e. the caller should assign it to its own abortRef). Called once
   *  per attempt (including provider failover attempts inside sendWithFailover), not once per pass. */
  nextController: () => AbortController;
  /** Called with the full display text (seed + everything generated so far in this loop) every
   *  time it changes, including immediately on each pass's `reset` chunk (with just the
   *  not-yet-extended text) so a mid-loop retry/failover visibly discards only its own
   *  now-abandoned partial output, never text a previous pass already confirmed. */
  onProgress: (fullText: string) => void;
}

/**
 * Runs one generation action to completion: a single provider call, or — while the provider
 * keeps reporting `finishReason: 'length'` — up to `maxPasses` additional automatic
 * continuation passes appended to the same in-progress answer. Every mode (send/continue/
 * retry/edit) calls this the same way; the only real difference between them is what
 * `baseProviderMessages`/`seedText`/`routing` they pass in.
 */
export async function runGenerationLoop(params: RunGenerationLoopParams): Promise<GenerationLoopResult> {
  const { baseProviderMessages, settings, routing, maxPasses, nextController, onProgress } = params;
  let accumulatedText = params.seedText;
  let liveText = '';
  let finishReason: GenerationFinishReason = 'stop';
  let providerId = '';
  let providerName = '';
  let switchedFrom: string | undefined;
  let error: AIError | undefined;

  const onChunk = (chunk: AIStreamChunk) => {
    if (chunk.reset) {
      // A new attempt (retry-on-transient-error or provider failover) is starting — only the
      // CURRENT pass's not-yet-confirmed text is discarded; `accumulatedText` (everything
      // confirmed from passes that already finished) is untouched.
      liveText = '';
      onProgress(accumulatedText);
      return;
    }
    if (!chunk.delta) return;
    liveText += chunk.delta;
    onProgress(accumulatedText + liveText);
  };

  for (let pass = 0; pass <= maxPasses; pass++) {
    liveText = '';
    // Pass 0 of a fresh send/retry/edit (seedText === '' going in) sends the real conversation
    // as-is. Every later pass — and pass 0 of a manual Continue, which starts with seedText
    // already populated — appends the continuation instruction on top of the SAME base
    // messages instead of resending the conversation as a "new" request, so routing/capability
    // context (see baseProviderMessages' own doc comment) is identical to the turn being
    // continued, never reclassified from the literal continuation instruction text.
    const isFreshPass = pass === 0 && accumulatedText === '';
    let passMessages: ProviderMessage[];
    if (isFreshPass) {
      passMessages = baseProviderMessages;
    } else {
      // PHASE 2.1 — measure the REAL request this pass will send (base history + the
      // answer-so-far + the instruction), not just baseProviderMessages, and bound only the
      // answer-so-far copy sent as context if it doesn't fit — see
      // boundAccumulatedTextForContinuationPass's own doc comment for why that's the safe part
      // to shrink (never the displayed/returned accumulatedText itself).
      const baseBytes = estimateProviderMessagesBytes(baseProviderMessages);
      const { text: contextText, fits } = boundAccumulatedTextForContinuationPass(accumulatedText, baseBytes);
      if (!fits) {
        // Even the base history alone (or the base history + the shortening note) leaves no
        // room for a safe continuation request. Stop honestly rather than send something known
        // to exceed the budget: pass 0 (nothing generated yet this loop) is a hard failure the
        // caller should show as an error; a later automatic pass keeps everything already
        // confirmed and is marked 'length' (still truncated, still continuable) rather than
        // silently claiming completion or erasing the answer.
        if (pass === 0) {
          finishReason = 'error';
          error = { code: 'context_overflow', message: "This conversation is too large to continue safely — try starting a new chat, removing an attachment, or shortening the request." };
        } else {
          finishReason = 'length';
        }
        break;
      }
      passMessages = [
        ...baseProviderMessages,
        { role: 'assistant', content: contextText },
        { role: 'user', content: CONTINUE_INSTRUCTION },
      ];
    }

    // Defensive final check on the EXACT bytes about to be sent — boundAccumulatedTextForContinuationPass
    // already guarantees this passes for the non-fresh branch, but a fresh pass's
    // `baseProviderMessages` is measured by its own caller (AiAssistantPage) BEFORE this loop
    // starts, not re-measured here, so this catches the (should-never-happen) case of a caller
    // skipping that preflight rather than silently sending an over-budget request regardless.
    if (estimateProviderMessagesBytes(passMessages) > MAX_ESTIMATED_REQUEST_BYTES) {
      if (pass === 0) {
        finishReason = 'error';
        error = { code: 'context_overflow', message: 'This request is too large to send safely — try starting a new chat or removing an attachment.' };
      } else {
        finishReason = 'length';
      }
      break;
    }

    const controller = nextController();
    const result = await sendWithFailover(passMessages, settings, onChunk, controller.signal, undefined, routing);
    providerId = result.providerId;
    providerName = result.providerName;
    if (result.switchedFrom) switchedFrom = result.switchedFrom;

    if (result.result.finishReason === 'cancelled') {
      finishReason = 'cancelled';
      break;
    }
    if (result.result.error) {
      finishReason = 'error';
      error = result.result.error;
      break;
    }

    accumulatedText += result.result.content;
    onProgress(accumulatedText);
    finishReason = result.result.finishReason;
    if (finishReason !== 'length') break; // complete answer, an honest 'unknown', or nothing more we can do
  }

  return { accumulatedText, finishReason, providerId, providerName, switchedFrom, error };
}

/** Whether a just-finished (or just-reloaded) message should offer a Continue action at all —
 *  centralizes the rule so AiAssistantPage and ChatMessageBubble can't drift apart on it.
 *  'length' and 'unknown' are both offered (see aiTypes.ts's AIProviderResult doc comment for
 *  why 'unknown' must never be silently treated as complete); 'stop'/'error'/'cancelled' never are. */
export function isContinuableFinishReason(reason: GenerationFinishReason | undefined): boolean {
  return reason === 'length' || reason === 'unknown';
}

/** PHASE 2.1 — finds the message Retry/Continue should actually target: the most recent
 *  genuine model response (or a failed attempt at producing one), skipping past any trailing
 *  purely-informational system notices appended after it (e.g. "Switched to X — the previous
 *  provider was unavailable."). Before this fix, Retry/Continue required the literal LAST array
 *  element to be `role === 'assistant'`, so a switch notice appended right after an otherwise
 *  perfectly good answer made that answer permanently un-retryable/un-continuable — not because
 *  anything was wrong with the answer, only because of an unrelated informational message that
 *  happened to be appended after it. A pure notice is `isSystemNotice && !isError`; an error
 *  bubble (`isError`, with or without `isSystemNotice`) is itself a real retry target, not
 *  something to skip past. Returns -1 when there's nothing retryable (empty conversation, the
 *  most recent real turn is the user's own with no reply yet, or the target is still streaming). */
export function findLastRetryableAssistantIndex(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.isSystemNotice && !m.isError) continue;
    return m.role === 'assistant' && !m.isStreaming ? i : -1;
  }
  return -1;
}
