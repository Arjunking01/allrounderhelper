# ALLROUNDER HELPER — PHASE 8 LEDGER

AI Runtime Reliability, Attachments & Provider Routing Validation

## Environment constraints (checked directly, not assumed)

- The checkpoint `allrounder-helper-phase7-reconciled-checkpoint.zip` is a plain source
  tree, **not** a git repository (`git status` fails with "not a git repository"). There
  is no prior commit history to diff against in this checkpoint; "diff discipline" below
  is therefore a plain list of files touched this session, not a `git diff`.
- `node_modules` is not included in the checkpoint and `npm install` was attempted and
  fails: `403 Forbidden` from `registry.npmjs.org` (network egress is disabled in this
  environment). This is the same constraint the Phase 5 session recorded in
  `FINAL_AUDIT_REPORT.md` ("Network/`node_modules` constraint re-checked... still fails
  with 403 Forbidden") — re-confirmed, not improved, this session.
- Consequence: `tsc -b`, `npm run typecheck:api`, `npm run lint` (oxlint), and
  `npm run build` cannot actually be executed this session — the binaries themselves are
  not installed and cannot be installed offline. These are marked **ENVIRONMENT
  BLOCKED**, not "verified," anywhere in this ledger and in the final report.
- No `.env`/server API keys are present in this checkpoint, so every real provider's
  `isConfigured()` returns false and the app runs with the `none` provider. Combined
  with no network access, **no live provider call of any kind was possible** this
  session. Marked LIVE PROVIDER VERIFIED — NOT VERIFIED / ENVIRONMENT BLOCKED throughout.
- No browser/DOM runtime is available in this environment (no headless browser tool) —
  BROWSER VERIFIED items are ENVIRONMENT BLOCKED as well.
- What *was* actually possible and is reported as such: full source-level (SOURCE
  VERIFIED) inspection of the AI architecture end-to-end, and real, executed (RUNTIME
  VERIFIED) regression tests of pure, dependency-free logic by running the exact
  algorithm copied out of the source file directly under plain Node.js (no transpiler
  needed — the affiliate-detection regression below is plain JS/regex, so this is a
  genuine execution, not a simulation).

## What was audited (SOURCE VERIFIED)

Full read of the AI runtime path: `aiTypes.ts`, `attachmentTypes.ts`,
`attachmentTextExtraction.ts`, `promptBuilder.ts`, `taskClassification.ts`,
`routingPolicy.ts`, `providerCapabilities.ts`, `providerRegistry.ts`,
`providerHealth.ts`, `providerOrchestrator.ts`, `generationEngine.ts`, and the
1200+-line `AiAssistantPage.tsx` (send/continue/retry/edit-and-regenerate), plus a
focused pass over `useConversations.ts` (persistence/attachment-stripping),
`useLocalStorage.ts`, `MermaidDiagram.tsx`/`markdown.ts` (injection safety), and
`api/_shared.ts` (server-side body-size guard).

**Overall finding:** this architecture is already unusually mature for the areas this
phase cares about. Prior phases (1–2.1, per the doc comments throughout the code and
`PHASE_1_7_LEDGER.md`/`PHASE_2_LEDGER.md`/`PHASE_2_1_LEDGER.md`) had already fixed real
issues in almost every area this phase's brief asks about: MIME-aware vision routing
(xAI's jpg/png-only vs. this app's WebP uploads), request-size bounding for
continuation passes, provider-health decay so a transient failure doesn't permanently
poison routing, honest `finishReason: 'unknown'` handling, and duplicate-message-safe
Retry/Continue targeting past a trailing system notice. Very little was actually wrong.

## Real defect found and fixed this session

**Inconsistent "attachment expired after reload" handling across Retry / Edit+Regenerate
vs. Continue.**

- `continueMessage()` in `AiAssistantPage.tsx` already had a check (added in an earlier
  phase) for the case where an attachment's *metadata* survives a page reload but its
  actual image bytes (`dataUrl`/`pageImages`) do not — because
  `useConversations.ts`'s `stripUnpersistableAttachmentData` intentionally never
  persists those fields to localStorage (bytes are too large for localStorage's quota).
  When that happens, Continue shows an honest toast: *"The image/scanned document from
  this question is no longer available in this session — continuing with text only."*
- `retryLast()` and `editAndRegenerate()` had **no equivalent check**. Traced the actual
  data flow (`promptBuilder.buildProviderMessages` → `collectImageDataUrls` →
  `attachmentsWithImages`) and confirmed: after a reload, retrying or editing a question
  that originally included an image/scanned PDF silently rebuilds a text-only request
  with zero indication to the user that the image was dropped — exactly the "silently
  sending a text-only request instead of communicating that clearly" failure mode this
  phase's brief calls out by name (§10).
- **Fix:** extracted the check into a single shared function,
  `expiredAttachmentNotice()`, in `attachmentTypes.ts` (single source of truth, same
  pattern this codebase already uses for `attachmentsWithText`/`attachmentsWithImages`),
  and called it from all three of `continueMessage`, `retryLast`, and
  `editAndRegenerate`. `continueMessage`'s original inline check was replaced with a
  call to the shared function so there's exactly one implementation instead of three
  independent (and, per this finding, already-diverged) copies.
- Verification level: **SOURCE VERIFIED** (the data-flow trace and the fix itself) +
  **STATIC VERIFIED** (manual trace of `hasImageAttachment`/`expiredAttachmentNotice`
  against the exact shape `stripUnpersistableAttachmentData` produces). Not RUNTIME
  VERIFIED or BROWSER VERIFIED — no build toolchain or browser was available this
  session to actually reload a page and click Retry (see Environment constraints
  above). This is real remaining verification debt, called out in the final report.

## Capability matrix (source-derived, not assumed from provider names)

| Provider | Text | Vision | Image formats (verified in source) | Documents | Streaming | Fallback eligible |
|---|---|---|---|---|---|---|
| Cerebras | ✅ | ❌ | — | via extracted text only | ✅ | ✅ |
| Mistral | ✅ | ❌ | — | via extracted text only | ✅ | ✅ |
| OpenRouter | ✅ | ❌ (per this app's adapter config) | — | via extracted text only | ✅ | ✅ |
| OpenAI | ✅ | ✅ | per `OpenAIProvider.ts`'s declared `supportedImageMimeTypes` | via extracted text only | ✅ | ✅ |
| xAI (Grok) | ✅ | ✅ | jpg/jpeg + png only — **no WebP**, despite the app's upload picker accepting WebP (Phase 1.7 finding, re-confirmed this session in `providerRegistry.ts`'s `supportsImageFormats` doc comment and `XaiProvider.ts`) | via extracted text only | ✅ | ✅ |
| Z.ai | ✅ | ❌ | — | via extracted text only | ✅ | ✅ |
| Cloudflare Workers AI | ✅ | ❌ | — | via extracted text only | ❌ (adapter doesn't support streaming) | ✅ (deprioritized) |
| Gemini | ✅ | ✅ | per `GeminiProvider.ts` | via extracted text only | ✅ | ✅ (deprioritized — billing not enabled) |

Documents (PDF/DOCX/TXT/MD) are never sent as "a document capability" to a provider at
all — `attachmentTextExtraction.ts` extracts plain text client-side first
(`extractAttachmentText`), and only that bounded, truncated text
(`MAX_ATTACHMENT_TEXT_CHARS` = 20,000 chars) travels in the request body
(`promptBuilder.withAttachmentText`). So every text-capable provider — which is all of
them — can "handle" a document request; there is no capability-mismatch case for
documents by construction. The one exception is a **scanned/image-only PDF** with no
extractable text layer: it's rasterized to page images
(`attachmentTextExtraction.renderScannedPdfPages`, capped at
`MAX_SCANNED_PDF_PAGES` = 4 pages) and from that point on is routed exactly like an
image attachment — i.e. it genuinely does require a vision-capable, format-matched
provider, and is correctly treated as one by `attachmentsWithImages`/routing.

Confirmed no static/hardcoded capability list exists anywhere that could drift from the
adapters — `AIProviderCapabilities` is a field directly on each provider object
(`aiTypes.ts`), and `providerRegistry.ts`'s `supportsImageFormats` reads
`provider.capabilities.supportedImageMimeTypes` live, defaulting to "supports nothing"
(fail closed) if a vision-capable provider ever omits it.

## Routing / capability-mismatch behavior (source-traced)

Confirmed the three required properties hold, by reading `getRoutedFallbackChain` and
`sendWithFailover` directly (not inferred from comments):

1. **Detects incompatibility** — `getRoutedFallbackChain(settings, category,
   requireVision, imageMimeTypes)` filters the candidate id list by
   `supportsImageFormats` *before* scoring/ordering, so an incompatible provider is
   never even a routing candidate for an image-bearing request.
2. **Attempts a compatible route if one exists** — the filtered chain is still a full
   ordered fallback chain (task-ranked via `routeProviderOrder`), and
   `sendWithFailover` walks it with real retry/failover, so a compatible fallback IS
   tried if the first compatible candidate fails.
3. **Never blindly sends incompatible data** — `attachmentsWithImages`/
   `collectImageDataUrls` are the single source of truth for "does this request
   actually carry image bytes," used identically by the pre-send UI check
   (`hasVisionCapableProvider`) and by routing; `openAICompatibleProvider.ts`'s
   `toOpenAIContent` (per its own doc comment, read directly) is a second, independent
   guard that substitutes a text note instead of images for a non-vision provider even
   if it were somehow reached.
4. **Honest failure with no compatible route** — `getRoutedFallbackChain` returns
   `[getProvider('none')]` when the filtered id list is empty, and
   `hasVisionCapableProvider` is checked *before* sending in `send()`/
   `editAndRegenerate()` specifically so the UI can show "I don't have a vision-capable
   AI provider connected" / "the image is in a format the connected provider doesn't
   support" rather than a generic failure.

No capability-mismatch test could be run live (no configured providers, no network —
see Environment constraints), so this is SOURCE VERIFIED / STATIC VERIFIED only, not
RUNTIME VERIFIED against a real request.

## Regression checks against Phase 7's closed work

- **ArtisticAura purchase-intent detection** — the exact logic in
  `affiliateDetection.ts` was copied verbatim (regex/string logic only, no project
  dependencies) into a standalone Node script and actually executed against all 8
  purchase-intent cases and 6 non-purchase cases from this phase's brief (the 6th
  substituted for the brief's generic "ordinary coding/academic questions" bucket).
  **Result: 14/14 pass — RUNTIME VERIFIED** (real execution, not a source read).
- **Pomodoro `primeAlarmAudio()`** — confirmed via direct source read
  (`PomodoroTimerPage.tsx` line ~318) that the Start/Resume button's `onClick` still
  calls `primeAlarmAudio()` before toggling `running`, unchanged since Phase 7. SOURCE
  VERIFIED. No modification made — no defect found, nothing to fix.
- **Oxlint configuration** — `.oxlintrc.json` still excludes only vendor/build
  directories (`node_modules`, `dist`, `build`, `coverage`, `*.min.js`) with no project
  lint rule disabled. SOURCE VERIFIED. The lint command itself could not be *run* this
  session (oxlint binary not installed, network blocked) — that check is ENVIRONMENT
  BLOCKED, consistent with every prior phase's recorded experience in this same
  environment.

## Files changed this session

- `src/features/ai/logic/attachmentTypes.ts` — added `expiredAttachmentNotice()`
  (new exported function; no existing behavior changed).
- `src/features/ai/pages/AiAssistantPage.tsx` — `continueMessage()` now calls the new
  shared function instead of its own inline copy (behavior-preserving refactor);
  `retryLast()` and `editAndRegenerate()` each gained the same honest-degradation
  toast that was previously missing (genuine behavior fix, additive — no other logic
  in either function was touched).

No other files were modified. No dependency versions were changed. No animation,
mobile-polish, or already-closed Phase 6/7 area was reopened.

## Verification-debt carried forward (see final report §15 for the full breakdown)

Everything requiring a real build toolchain, a real browser, or a real provider
account is genuinely unverified this session because the environment does not permit
it, not because it was skipped. This ledger and the final report deliberately do not
upgrade any of that to a stronger verification label.
