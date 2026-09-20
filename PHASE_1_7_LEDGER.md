# PHASE 1.7 — FINAL ENGINEERING LEDGER
## AI Reliability Verification + Capability-Aware Routing
Date: 2026-09-12 | Continues from Phase 1.6 | Next: Phase 2 (Continue/Retry/Edit UX)

Full narrative writeup for every item below lives in `ENGINEERING_DECISIONS.md`'s
"Phase 1.7" section. This file is the compact, brief-mandated ledger only.

---

## VERIFIED — PREVIOUS PHASES
All SOURCE VERIFIED this session by direct re-read of current source (not assumed from
prior ledgers), per the brief's instruction not to trust the previous ledger blindly:
- Phase 1: image reading/inclusion pipeline, vision routing, honest no-vision-provider
  state, attachment persistence stripping — all present and correct as described.
- Phase 1.5: OpenAI-compatible + Gemini `finish_reason`/`finishReason` → `'length'`
  mapping for genuine token-limit truncation — present and correct.
- Phase 1.6: xAI vision enabled, proxy body limits raised + separated
  (`MAX_AI_BODY_BYTES_VISION`), image/document size limits separated, scanned-PDF
  rasterization fallback (`renderScannedPdfPages`) present, pageImages participate in
  vision routing and are stripped from persistence — all present and correct as described.

## FIXED — PHASE 1.7
1. **xAI default model** `grok-4.5` → `grok-4.6` (xAI's flagship changed again,
   re-verified live). `maxContextTokens` `128_000` → `500_000` (was already stale).
   User override via AI Settings unaffected.
2. **MIME-aware vision routing** — `AIProviderCapabilities.supportedImageMimeTypes`
   added; `providerRegistry.supportsImageFormats()` replaces the plain `vision: boolean`
   filter in `getRoutedFallbackChain`/`hasVisionCapableProvider`; per-image MIME
   filtering added as a second line of defense in `openAICompatibleProvider.toOpenAIContent`.
   Concretely fixes: a WebP upload can no longer be routed to xAI (jpg/jpeg+png only).
3. **Total request body budget** — `promptBuilder.estimateProviderMessagesBytes()` +
   `MAX_ESTIMATED_REQUEST_BYTES` (20MB); `AiAssistantPage.send()` measures the real,
   post-history-bounding payload before sending and rejects an over-budget send honestly.
4. **Unbounded conversation history (real bug, not preventive)** —
   `promptBuilder.boundHistory()`: only the most recent image-bearing message keeps its
   images (older ones get a text note instead); text history trimmed oldest-first to a
   character budget derived from `settings.contextLength`. Applied automatically inside
   `buildProviderMessages()` — every existing call site protected with no changes needed.
5. **Scanned-PDF cancellation** — optional `shouldAbort` cooperative-cancellation check
   added to `extractPdfText`/`renderScannedPdfPages`, wired from `AttachmentBar.tsx`'s
   `remove()` via a ref of removed ids; canvas dimensions zeroed after each page read.
6. **Cloudflare finish-reason honesty** — `finishReason` gains `'unknown'`; Cloudflare's
   Workers AI REST response (confirmed, no completion/truncation signal exists in it)
   now returns `'unknown'` instead of an unverifiable `'stop'`. `AiAssistantPage` never
   auto-continues on `'unknown'` and shows a distinct honest caveat instead of silence.
7. **OpenAI-compatible `finish_reason` audit** — documented decision only, no behavior
   change: `content_filter` → `'stop'` (correct, not a truncation), unrecognized/null →
   `'stop'` (correct — this class of provider's contract has a completion field at all,
   unlike Cloudflare, so it doesn't warrant `'unknown'`).
8. **Gemini native PDF input** — documented architectural gap (see `GeminiProvider.ts`
   header comment and `ENGINEERING_DECISIONS.md`), deliberately NOT implemented per the
   brief's own caution against building "a giant Gemini Files API system" this phase.

## TESTED — ACTUALLY RUN
- Manual full-file re-read of every changed file, post-edit, for syntax/consistency —
  **SOURCE VERIFIED.**
- Brace/paren/bracket balance check (scripted) across all 13 touched files — all
  balanced — **SOURCE VERIFIED.**
- Whole-`src`-tree grep for every changed function signature's call sites (not just
  files touched during editing) to confirm no caller was missed — **SOURCE VERIFIED.**
- `npm install` was attempted this session and failed: `403 Forbidden` from
  `registry.npmjs.org` — **BUILD attempt made, environment blocked it.**

## NOT TESTED
Every one of the following is **NOT TESTABLE — ENVIRONMENT LIMITATION** (no network
egress for `bash_tool` this session, confirmed via the `npm install` 403 above; no API
keys available even if network existed):
- `tsc` (app + API), `vite build`, `oxlint` — BUILD VERIFIED not possible.
- All 18 items of the brief's required live-test matrix (PNG/JPEG/WebP requests,
  image-only prompt, multi-image, near-limit image, scanned PDFs (1-page/multi-page),
  text PDF, PDF-with-diagram, DOCX, multiple attachments, oversized image, oversized
  combined request, provider failure/timeout, truncated response, retry) — every one
  is **NOT TESTABLE** this session, marked individually and honestly rather than
  inferred from source review. LIVE VERIFIED: **none, this session.**

## REMAINING
- A real `npm install` + `tsc -b` + `vite build` + `oxlint` pass, the first time this
  environment (or the deploy pipeline) has network access, to catch anything this
  session's manual source review couldn't (type errors, lint issues).
- The full 18-item live-test matrix, the first time real API keys + network are both
  available in the same environment.
- Gemini native PDF input (documented gap — see FIXED #8 above) — smallest safe next
  step is a new, optional `ProviderMessage.documents` field read only by Gemini's adapter.
- Per-model (not just per-provider) capability tracking, if AI Settings ever exposes
  model overrides that could have different real capabilities than the configured
  default (flagged, not built — no evidence yet it's needed; see `AI_PROVIDER_GUIDE.md`).

## NEXT PHASE
**Phase 2: Continue / Retry / Edit UX** — polished UI built on top of the now-more-honest
`finishReason` model (`'stop' | 'length' | 'error' | 'cancelled' | 'unknown'`) and the
bounded, budget-checked request pipeline this phase delivered. Per the brief, no
Continue/Retry/Edit UI work was done this phase beyond what `finishReason: 'unknown'`
required to integrate safely into the existing auto-continue loop.

---

**Verification-level key used consistently above and in `ENGINEERING_DECISIONS.md`:**
- **SOURCE VERIFIED** — confirmed by direct reading of the actual current source.
- **BUILD VERIFIED** — confirmed by an actual `tsc`/`vite build`/`oxlint` run. Not
  achieved this session (environment blocked).
- **LIVE VERIFIED** — confirmed by an actual request to a real provider. Not achieved
  this session (no network + no keys).
