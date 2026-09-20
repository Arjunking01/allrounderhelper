# PHASE 2 — FINAL ENGINEERING LEDGER
## Continue / Retry / Edit UX + Shared Generation Reliability
Date: 2026-09-12 | Continues from Phase 1.7 | Next: Phase 3 (Real Daily Routine)

Full inline reasoning for every item below lives as doc comments on the actual changed
code (`generationEngine.ts`, `useConversations.ts`, `AiAssistantPage.tsx`,
`ChatMessageBubble.tsx`) — this file is the compact ledger only, per the brief.

---

## VERIFIED — PREVIOUS PHASES
Re-checked by direct re-read of current source this session (not assumed from the
Phase 1.7 ledger), per the standing instruction not to trust a previous ledger blindly:
- Vision image data pipeline, MIME-aware vision routing, xAI JPEG/PNG-only restriction,
  xAI `grok-4.6` default, 500K xAI context metadata — present and correct, untouched.
- Request-size preflight (`estimateProviderMessagesBytes` / `MAX_ESTIMATED_REQUEST_BYTES`)
  and bounded conversation history (`boundHistory` inside `buildProviderMessages`) —
  present and correct, and now additionally exercised by Continue/Retry/Edit (see below;
  Phase 1.7 only ever exercised these from a fresh send).
- Old-image stripping from repeated requests, scanned-PDF cooperative cancellation,
  Cloudflare `'unknown'` finish state, OpenAI-compatible finish-reason normalization,
  scanned-PDF rasterization fallback, attachment persistence protections
  (`stripUnpersistableAttachmentData`) — all present and correct, untouched.
No regressions found in any Phase 1.7 foundation. Nothing in this list was changed
"for style" — every touched line ties to a Phase 2 requirement below.

## FIXED — PHASE 2

### Architecture
1. **Shared generation engine** — new `generationEngine.ts`, exporting
   `runGenerationLoop()`. Before this phase, `send()` and `retryLast()` each hand-rolled
   their own copy of the `accumulatedText`/`liveText` bookkeeping, the per-pass
   `AbortController`, and the length-triggered auto-continue loop. All four actions
   (**NORMAL SEND, CONTINUE, RETRY, EDIT+REGENERATE**) now call the exact same loop;
   the only per-mode differences are what `baseProviderMessages` / `seedText` / `routing`
   they hand it. This is the actual point of Phase 2's brief — one engine, four actions,
   no duplicated provider logic.
2. `MAX_AUTO_CONTINUATIONS` (4 — unchanged value, now a named exported constant instead
   of a local inside `send()`) bounds automatic passes within one generation action.
   `MAX_MANUAL_CONTINUATIONS_PER_ACTION` (4, new) separately bounds how many times the
   visible Continue button can be clicked against the same message across separate user
   actions, so a provider that never reports true completion can't be clicked forever.

### Continue
3. **Real Continue action** — `continueMessage(messageId)` in `AiAssistantPage.tsx`.
   Never creates a visible "continue" user message. Rebuilds `baseProviderMessages` from
   the conversation slice ending at the ORIGINAL user turn that produced the target
   answer (`active.messages.slice(0, idx)`), not from the literal continuation
   instruction — so routing/capability requirements (vision, document context, image
   MIME type) are derived from that original turn and can't drift. `seedText` is passed
   as the message's own existing content; the loop's continuation-instruction branch
   fires immediately (pass 0 is already a continuation request when `seedText` is
   non-empty — see `runGenerationLoop`'s `isFreshPass` check), and every update writes
   the loop's single `accumulatedText` back via the same `updateMessage()` a normal
   stream uses. There is exactly one authoritative copy of the message's text at every
   point — no separate "prepend old + new" step exists anywhere that could double it up.
4. **Continue after 'unknown'** — offered identically to 'length', with distinct UI
   copy ("Continue if incomplete" vs "Continue") but the identical underlying action —
   see `ChatMessageBubble`'s caveat block, driven by `message.finishReason`.
5. **Continuation state is now persisted**, not transient React state — `ChatMessage`
   gained `finishReason`, `continuable`, `manualContinuations` (all optional, all
   compact scalars — no duplicated prompt payloads, no attachment bytes). Every path
   that finalizes a message (send/continue/retry/edit) sets all three consistently via
   `updateMessage`'s extended `meta` parameter. A reload now shows the exact same
   Continue affordance it showed before the reload, or an honest "reached the
   continuation limit" note once `manualContinuations` hits the cap.
6. **No more baked-in caveat text.** Phase 1.7's `send()` appended literal strings like
   `*(Response is very long — reply "continue" for more.)*` directly into
   `message.content`. Phase 2 removes this entirely: `content` is now always exactly the
   model's own text, and `ChatMessageBubble` renders the caveat/Continue action from
   `finishReason`/`continuable` metadata instead. This was a real, not just cosmetic,
   fix — the old approach meant clicking Continue would have had to either resend its
   own caveat text as context (polluting the model's view of "what was already said") or
   the UI would have had to strip it with string matching before continuing. Neither
   existed before; now neither is needed.
7. **Continue + expired attachments (honest degradation)** — if the original user turn's
   image attachment metadata still exists but its base64 data was stripped on an earlier
   persistence cycle (see `stripUnpersistableAttachmentData`), continuing now shows an
   explicit toast ("...no longer available in this session — continuing with text
   only") instead of silently downgrading to a text-only continuation with no
   indication anything changed. Deliberately scoped to real image attachments only
   (`type` survives persistence unambiguously) — NOT extended to scanned-PDF
   `pageImages`, because the persisted shape can't distinguish "this PDF never had
   rasterized pages" from "it did, and they're gone now" (both look like `pageImages:
   undefined`); guessing there would risk a false alarm on an ordinary text PDF. Flagged
   under REMAINING below rather than faked.

### Retry
8. **Retry rebuilt on the shared engine** — `retryLast()` now calls
   `runGenerationLoop()` with the same temperature-nudge (`+0.3`, clamped to `1.5`,
   never persisted) as before, but gains auto-continuation for free: a retried answer
   that is itself long now auto-continues up to `MAX_AUTO_CONTINUATIONS`, which Phase
   1.7's retry never did (a real, if minor, functional improvement, not just a
   refactor). Failure-type handling (provider error, timeout, rate limit, network,
   partial generation, provider failover, empty response, cancelled generation) is
   unchanged — it all still flows through `sendWithFailover`, which Phase 1.7 already
   made robust to all of these; Phase 2 didn't touch that logic, only its caller.
9. **Retry now persists `finishReason`/`continuable` too**, so a long retried answer
   gets the same honest Continue affordance a fresh send would.
10. **Retry disabled while generating** — `canRegenerate` passed to `ChatMessageBubble`
    now additionally requires `!isGenerating` (previously only checked "is this the
    last message" + "is a provider configured"), closing a real gap: nothing before
    Phase 2 stopped a double-click on Retry from racing itself.

### Edit
11. **True Edit → truncate → regenerate semantics.** New
    `useConversations.editMessageAndTruncate(conversationId, messageId, content)`:
    updates the edited message's `content`, discards every message after it, and
    revokes blob object URLs on every discarded message's attachments (matching the
    cleanup discipline `deleteMessage`/`clearContext`/`permanentlyDelete` already had —
    Phase 1.7's `editMessage()` did none of this). `AiAssistantPage.editAndRegenerate()`
    then rebuilds `baseProviderMessages` from the truncated history and runs a fresh
    generation through the shared engine. The old `editMessage()` (content-only, no
    truncation/regeneration) is left in place in `useConversations.ts` as dead code for
    this phase rather than deleted, since nothing else in the codebase calls it and
    removing an exported hook function is a slightly larger surface change than this
    phase's scope requires — flagged under REMAINING.
12. **Attachments preserved through Edit** — `editMessageAndTruncate` only ever spreads
    `{ ...message, content }`; `attachments` is never touched, so a re-sent
    image/PDF question keeps working exactly as before the edit, still governed by the
    same live-session-only `dataUrl`/`pageImages` availability Phase 1.7 already
    established.
13. **Edit UX** — inline editor gained a one-line warning ("Editing this message will
    regenerate the conversation from here.") and the Save button now reads "Save &
    regenerate" instead of a bare "Save", so the truncation isn't a surprise. Cancel is
    unchanged (restores original text, no mutation). Deliberately no second modal/dialog
    — the brief explicitly discourages that when an inline warning is sufficient.
14. **Edit disabled while generating** — the Edit (pencil) button is now
    `disabled={isGenerating}` with an explanatory `title`/`aria-label`, closing the same
    "mutate history mid-stream" gap Retry had.
15. **Edit also runs the honest vision-capability check** send() already had (no
    vision-capable provider connected / format-mismatched provider), applied to the
    edited message's attachments — Phase 1.7's plain `editMessage()` had no equivalent,
    silently relying on whatever `send()`'s original message check had already decided.

### Reliability / cross-cutting
16. **Every generation action now goes through the same request-size and history-
    bounding protections** — `estimateProviderMessagesBytes`/`MAX_ESTIMATED_REQUEST_BYTES`
    is checked before Continue and before Edit's regeneration (previously only checked
    inside `send()`), and `buildProviderMessages()` (and therefore `boundHistory()`)
    is the single source of history preparation for all four actions — no separate
    unbounded path was created for any of them.
17. **Quota semantics, decided and documented** (brief §13/§38 explicitly asked this be
    a deliberate choice, not a default): NORMAL SEND, RETRY, CONTINUE (per manual click),
    and EDIT+REGENERATE each consume exactly **one** daily-message credit via
    `recordMessage()` — one credit per visible user-initiated action, matching how
    Retry already worked pre-Phase-2. Automatic continuation passes inside any of those
    four actions (`runGenerationLoop`'s internal loop) consume **zero** additional
    credits — `recordMessage()` is never called inside the loop. Provider failover
    inside `sendWithFailover` likewise consumes **zero** additional credits — it has no
    access to `recordMessage` at all. Net effect: one user tap/click == one credit,
    regardless of how many providers or continuation passes it took underneath.
18. **Cancelled responses are never marked continuable.** A cancelled generation
    (`finishReason: 'cancelled'`) always persists `continuable: false` in every one of
    the four actions — the app has no way to honestly tell "cancelled with more to say"
    apart from "cancelled right at the natural end," so it doesn't guess.
19. **No new duplicate-message paths.** All four actions still only ever call
    `appendMessage` once per new message and `updateMessage` repeatedly against that
    same message's id — verified by re-reading every call site after the refactor (see
    TESTED below).

## TESTED — ACTUALLY RUN
Unlike Phase 1.7 (network-blocked, 403 on `registry.npmjs.org`), this session's
environment had working npm registry access:
- **`npm install`** — succeeded (580 packages). **BUILD VERIFIED.**
- **`tsc -b`** (the actual `build` script's typecheck stage) — clean, zero errors, run
  twice (once after the initial refactor, once after the attachment-expiry-toast
  addition). **BUILD VERIFIED.**
- **`vite build`** — completed successfully, full production bundle emitted (including
  the PWA precache step). **BUILD VERIFIED.**
- **`tsc -p tsconfig.api.json --noEmit`** — clean, zero errors. **BUILD VERIFIED.**
- **`oxlint src api`** (scoped the same way CI would run it — the raw `npm run lint`
  also walks the build's own `dist/` output and flags third-party minified bundles,
  which is a pre-existing config gap unrelated to this phase) — **0 errors**, 1
  pre-existing warning in `src/lib/markdown.ts` (a file this phase never touched).
  **BUILD VERIFIED / LINT VERIFIED.**
- Manual re-read of every changed file post-edit for syntax/consistency, and a
  whole-`src` grep for every changed function's call sites (`editMessage` →
  confirmed the only prior call site was replaced; `sendWithFailover`/`AIStreamChunk`/
  `ProviderMessage`/`AIError` → confirmed no longer directly imported in
  `AiAssistantPage.tsx` once their logic moved into `generationEngine.ts`, imports
  removed to keep the typecheck honest about what's actually used).
  **SOURCE VERIFIED.**

## NOT TESTED
No provider API keys are configured in this environment, so the following remain
**NOT TESTABLE — ENVIRONMENT LIMITATION** (this is an execution-environment limitation,
not a code-readiness one — the build compiles and bundles cleanly):
- The full conversation-integrity matrix (brief §37, items A–P): normal text, long
  answer + Continue, Retry, Edit, edit-of-an-earlier-turn, image + vision routing,
  image + Continue retaining vision capability, WebP-never-reaches-xAI, PDF + Continue
  retaining document context, retry-after-failure, retry-after-cancellation,
  continue-after-unknown, continue-after-length, edit/retry/continue-while-generating.
  Each of these was reasoned through against the actual implementation while writing
  it (see the FIXED section above for the specific mechanism each relies on) but none
  was exercised against a real running provider this session.
- The full live AI test matrix (brief §44, 20 items) — **NOT TESTABLE**, no network
  path to a real provider account from this environment (only the npm registry was
  reachable, not the AI provider endpoints, and no provider keys exist here regardless).
- A real end-to-end mobile device/browser check (viewport resize + touch simulation
  wasn't available as a tool this session) — the mobile-facing CSS changes described
  under FIXED #13's Continue button (36px minimum touch target, matching the existing
  Edit/Retry/Delete buttons' own `h-9 w-9` convention on mobile; `flex-wrap` on the
  caveat row so long copy doesn't overflow on a narrow viewport) were verified by
  reading the rendered class list against the app's own established mobile
  conventions, not by an actual rendered-device screenshot. **SOURCE VERIFIED, not
  LIVE VERIFIED.**

LIVE VERIFIED: **none, this session** (same honest limitation as Phase 1.7, for the
same reason — no provider credentials in this environment).

## REMAINING
**See PHASE_2_1_LEDGER.md — two items originally listed here (the dead
`editMessage()` and the scanned-PDF Continue degradation toast) have since been
fixed in source; that file documents the fix and corrects this section rather than
duplicating stale text here.**
- The full live AI test matrix and conversation-integrity matrix above, the first time
  real provider keys + a real device/browser are both available in the same
  environment.
- Cloudflare OpenAI-compatible endpoint migration (brief §28) — still not done, per the
  brief's own instruction not to migrate without a concrete Phase 2 need for it. No new
  information surfaced this phase that changes that judgment.
- Per-model (not just per-provider) capability tracking (brief §30) — still flagged,
  not built, consistent with Phase 1.7's own assessment; nothing in this phase's work
  touched model-level overrides.

## NEXT PHASE
**Phase 3: Real Daily Routine / Plan My Day** — integrating Todo, Calendar, Study
Planner, Daily Planner, Habit Tracker, Goal Tracker, and Focus Mode into one "what
should I do today" workflow, per the brief. No Phase 3 work was started this session.

---

**Verification-level key used consistently above:**
- **SOURCE VERIFIED** — confirmed by direct reading of the actual current source.
- **BUILD VERIFIED** — confirmed by an actual `tsc`/`vite build`/`oxlint` run. Achieved
  this session (network was available, unlike Phase 1.7).
- **LIVE VERIFIED** — confirmed by an actual request to a real AI provider. Not
  achieved this session (no provider keys in this environment).
