# PHASE 2.1 — LEDGER RECONCILIATION
Date: 2026-09-12 | Continues from PHASE_2_LEDGER.md | Environment: no network access (npm registry returns 403, same as Phase 1.7)

## WHY THIS FILE EXISTS

The uploaded source tree (`allrounder-helper-phase2_1-generation-integrity.zip`) already
contains real, working fixes for every item `PHASE_2_LEDGER.md`'s own **REMAINING**
section listed as unaddressed, plus additional correctness fixes not mentioned in that
ledger at all — all tagged `PHASE 2.1` in doc comments across `generationEngine.ts`,
`useConversations.ts`, `attachmentTypes.ts`, and `AiAssistantPage.tsx`. But no ledger
entry exists for any of it, and `PHASE_2_LEDGER.md`'s REMAINING section is now
factually stale: it still lists things as unfixed that the code fixes. This file exists
only to correct that — no new implementation work was needed, only documentation
reconciliation, confirmed by direct re-reading of every changed site below.

**Verification level for everything in this file: SOURCE VERIFIED only.** This
environment could not run `npm install` (`403 Forbidden` from `registry.npmjs.org`,
identical to the Phase 1.7 and Phase 2 environment limitation) — no `node_modules`
exists in the tree, so `tsc -b` / `vite build` / `oxlint` could not be re-run here.
PHASE_2_LEDGER.md's claim of BUILD VERIFIED for Phase 2 proper was made in a
different session with working registry access and is not independently
re-confirmed by this session. Nothing below is claimed as BUILD VERIFIED or LIVE
VERIFIED.

## FIXES FOUND ALREADY PRESENT IN SOURCE (Phase 2.1)

1. **Scanned-PDF Continue degradation toast** — `attachmentTypes.ts` gained
   `hadRasterizedPages?: boolean`, a one-bit flag set at rasterization time and kept
   through `stripUnpersistableAttachmentData` even after the bulky `pageImages` array
   itself is stripped. `AiAssistantPage.continueMessage` now checks it alongside the
   existing image-expiry check and shows the same honest "no longer available in this
   session — continuing with text only" toast for an expired scanned PDF that it
   already showed for an expired image. This is exactly the "smallest safe fix"
   PHASE_2_LEDGER.md's REMAINING section proposed — it is implemented, not open.

2. **Dead `editMessage()` removed** — the old content-only, no-truncation editor that
   PHASE_2_LEDGER.md said was "left in place as dead code, safe to remove in a later
   cleanup pass" is no longer present in `useConversations.ts` at all (confirmed: zero
   remaining references anywhere in `src/features/ai`). `editMessageAndTruncate` is the
   only edit path.

3. **Edit-then-oversized-request ordering bug (new, not in Phase 2 ledger at all)** —
   Phase 2's `editAndRegenerate` called the destructive `editMessageAndTruncate()`
   (which discards downstream messages and revokes their blob URLs) *before* running
   the request-size check, so a correctly-rejected oversized edit could still
   permanently destroy conversation history for nothing. Phase 2.1 now builds a
   candidate history from the would-be edit, runs every size/capability check against
   that candidate without touching `active`/localStorage, and only commits the
   destructive truncation once every check has passed. This is a real data-integrity
   fix, not a refactor.

4. **Synchronous double-invocation guard (new)** — Phase 2's "Retry/Continue/Edit
   disabled while generating" relied solely on React's `isGenerating` state, which
   PHASE_2_LEDGER.md's own REMAINING section flagged as "reasoned to be safe... not
   measured" against a rapid double-tap, since state updates aren't synchronous within
   one click handler. Phase 2.1 adds `generationLockRef` — a plain ref set as the first
   statement of every one of the four action functions and released in that action's
   `finally` — as the actual synchronous enforcement, with `isGenerating` demoted to
   a pure UI-disabling signal on top of it. This closes the previously-unmeasured gap
   rather than just re-asserting it's fine.

5. **Cancelled/failed manual-continue attempts no longer burn a continuation slot** —
   Phase 2 counted every Continue click toward `MAX_MANUAL_CONTINUATIONS_PER_ACTION`
   regardless of outcome. Phase 2.1 only increments the persisted counter on an
   attempt that actually produced more text; a cancellation or provider failure still
   spends the daily-message credit (per Phase 2's quota rule — the click happened) but
   doesn't also cost the student one of their finite manual-continue attempts on that
   message for an attempt that produced nothing.

6. **`findLastRetryableAssistantIndex` skip-past-notices fix (new)** — Phase 2's
   Retry/Continue required the literal last array element to be `role === 'assistant'`,
   so a trailing purely-informational "Switched to X" notice appended after an
   otherwise-good answer made that answer permanently un-retryable/un-continuable for
   no real reason. Phase 2.1 adds this function, which walks backward past pure
   notices (`isSystemNotice && !isError`) to find the actual most recent real answer
   (or a genuine error bubble, which remains a legitimate retry target). Used
   consistently by both the Retry/Continue button logic and `retryLast`'s own target
   selection so they can't disagree with each other.

7. **Continuation request-size measurement was previously incomplete (new)** — flagged
   in `generationEngine.ts` itself: every earlier version of the loop measured only
   `estimateProviderMessagesBytes(baseProviderMessages)`, never including the
   accumulated answer-so-far a continuation pass appends on top of it. A long base
   history plus a long accumulated answer could together exceed the request budget
   even though the base history alone passed preflight. `boundAccumulatedTextForContinuationPass`
   now measures the real per-pass request and, if needed, shortens only the *sent*
   copy of the answer-so-far (never the displayed/returned `accumulatedText`) from the
   front, with an explicit note that nothing is actually lost.

## PHASE_2_LEDGER.md CORRECTIONS

The following lines in `PHASE_2_LEDGER.md`'s **REMAINING** section are superseded by
items 1–2 above and should be read as resolved, not open:
- "`useConversations.editMessage()`... is now dead code... safe to remove" → removed.
- "Scanned-PDF `pageImages` expiry has no equivalent honest-degradation toast for
  Continue... not implemented this phase" → implemented (`hadRasterizedPages`).

Everything else in that ledger's REMAINING section (live test matrix, Cloudflare
OpenAI-compatible migration, per-model capability tracking) is still genuinely open —
nothing in this session's source review found new information changing those
judgments.

## STILL NOT VERIFIABLE IN THIS ENVIRONMENT

- No `npm install` / `tsc` / `vite build` / `oxlint` run (network blocked here).
- No live provider tests (no credentials, no network).
- No real device/browser mobile check.

## NEXT PHASE

Unchanged from PHASE_2_LEDGER.md: **Phase 3 — Real Daily Routine / Plan My Day.** No
Phase 3 work started this session; this session was documentation reconciliation only,
since source review found the implementation already correct and complete for
Phase 2's Continue/Retry/Edit/shared-engine requirements.
