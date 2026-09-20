# ALLROUNDER HELPER — PHASE 9 LEDGER

Runtime Readiness, Verification Preparation & Controlled Validation

## Environment status (re-checked this session, not assumed)

Identical to Phase 8, independently re-verified:

- `curl` to `registry.npmjs.org` → **403 Forbidden**. Network egress remains disabled.
- `node_modules` → absent. Cannot be installed offline.
- `.env` / server provider credentials → none present anywhere in the checkpoint.
  Every real provider's `isConfigured()` would return false; the app would run on the
  `none` provider.
- `git status` → `fatal: not a git repository`. No commit history in this checkpoint.
- Browser/DOM runtime → unavailable (no headless browser tool in this environment).
- Android device → unavailable.

Consequence, stated plainly per Rule D: `npm run build`, `tsc -b`, `npm run typecheck:api`,
`oxlint`, any live provider call, and any browser/Android interaction are **ENVIRONMENT
BLOCKED** this session — not attempted repeatedly, not faked.

What this session *could* actually do, and did: (1) read the real source and trace real
call sites (SOURCE VERIFIED / STATIC VERIFIED), and (2) extract pure, dependency-free
logic verbatim and execute it under plain Node (RUNTIME VERIFIED — genuine execution,
not simulation).

## Step 1 — Phase 8 fix spot-check (SOURCE VERIFIED)

Traced all four usages of `expiredAttachmentNotice` in the actual checkpoint source
(`grep -rn`, not memory):

- **Defined** in `src/features/ai/logic/attachmentTypes.ts:214`. Logic confirmed: returns
  `null` when the original message never had an image/scanned page, and — critically —
  also returns `null` when `hasImageAttachment()` finds the bytes still present
  (`attachmentsWithImages` filters on `a.dataUrl` / `a.pageImages` actually being set,
  not just `a.type` metadata), so a same-session attachment is correctly never flagged
  as expired.
- **Continue** (`AiAssistantPage.tsx:496`) — calls it on `originUser?.attachments`,
  shows `showToast(expiredNotice, 'info')` when non-null. Unchanged from Phase 8,
  re-confirmed present.
- **Retry** (`AiAssistantPage.tsx:595`) — calls it on `lastUserMessage?.attachments`,
  same toast pattern. Present and wired correctly.
- **Edit + Regenerate** (`AiAssistantPage.tsx:709`) — calls it on
  `editedMessage.attachments`, inside the `else` branch that only runs when neither the
  "no vision provider" nor "format mismatch" pre-send checks already fired — i.e. it
  correctly catches exactly the case those two checks can't (attachment bytes gone, not
  a provider capability problem). Present and wired correctly.

**Finding: no regression.** All three action paths still call the shared helper; the
same-session vs. reload-expired distinction is still made on actual byte presence, not
on metadata. No source change was needed or made.

## Step 2 — Deterministic regressions re-executed (RUNTIME VERIFIED)

Both re-run verbatim under plain Node this session, not merely cited from Phase 8:

- `expiredAttachmentNotice()` + `hasImageAttachment()` + `attachmentsWithImages()`
  against 9 cases (no attachment, text-only doc, live image, live scanned PDF, expired
  image, expired scanned PDF, mixed expired-image+live-doc, mixed both-expired,
  uploading-status image not counted as live) — **9/9 pass**.
- `isRecommendationQuery()` (ArtisticAura purchase-intent detection) against the 8
  purchase-intent + 11 non-purchase cases from the Phase 9 brief (a superset of Phase
  8's 14) — **19/19 pass**, including the "explain how headphones work" and "how do
  headphones work internally" false-positive guards.

## Step 3 — Manual validation matrix (for Android/browser execution — NOT run this session)

This is the exact procedure someone with a browser/Android device and (optionally)
configured provider credentials should follow. Nothing below has been executed in this
environment; it is written to be followed without guessing.

### M1 — Reload → Retry/Edit/Continue (the Phase 8 fix itself — highest priority)

1. Open the AI Assistant.
2. Attach one image.
3. Ask a question that requires reading the image (e.g. "what color is the object in
   this photo?").
4. Send — confirm the reply actually references the image content.
5. Reload the browser tab (hard reload).
6. Reopen the same conversation.
7. Tap **Retry** on that answer.
   - Expected: an info toast reading "The image ... is no longer available in this
     session — continuing with text only." appears, and the regenerated answer does
     not pretend to still see the image.
8. Edit the original question's text slightly and tap **Edit + Regenerate**.
   - Expected: same toast, same honest text-only behavior.
9. If the answer was long enough to truncate, tap **Continue**.
   - Expected: same toast (this path already existed pre-Phase-8; confirm no
     regression).
10. Record PASS/FAIL for each of Retry / Edit+Regenerate / Continue individually.

### M2 — Same-session control (must NOT show the expiry toast)

Repeat steps 1–4 above but do **not** reload. Immediately: Retry, Edit + Regenerate,
Continue (as applicable). Expected: no expiry toast on any of them — the image is still
in memory and should be used normally. This guards against the helper becoming an
over-broad false positive.

### M3 — Attachment type coverage

| Test | Steps | Expected |
|---|---|---|
| Image | Attach a photo, ask a question only answerable by looking at it | Answer reflects actual image content |
| Normal PDF | Attach a small PDF with known text, ask a question answered by that text | Answer uses the extracted text |
| DOCX | Same, with a `.docx` | Answer uses extracted text |
| TXT / MD | Same, with `.txt` and `.md` | Answer uses extracted text |
| Scanned/image-only PDF | Attach a PDF with no text layer (photographed pages) | Rasterization occurs; a vision-capable provider is used; if none is configured, the user sees the explicit "no vision-capable provider" message — never a silent text-only guess |
| Unsupported file type | Attach e.g. a `.zip` | Clean rejection before any provider call |
| Oversized file | Attach a file over the app's size limit | Rejected client-side before send |

### M4 — Capability routing / failover (requires at least one configured provider)

- Text-only question → routes to any text-capable provider.
- Image question with only text-capable providers configured → user sees the
  "no vision-capable provider connected" message, never a silent downgrade.
- Image in a format a configured vision provider doesn't support (e.g. WebP to xAI) →
  user sees the "format the provider doesn't support" message.
- Force the first provider in the chain to fail (e.g. temporarily invalid key) with a
  second valid one configured → confirm failover actually occurs and the user gets a
  real answer, not a generic error.
- Remove all provider credentials → confirm the failure message is honest
  ("no provider configured / no compatible provider"), not a stuck spinner.

### M5 — Focus Mode / Pomodoro audio

For each of Focus Mode and Pomodoro: tap Start, let it run to alarm (or use the
shortest practical duration setting), confirm an actually audible sound plays. Repeat
after Pause → Resume, and after Reset → Start again. `primeAlarmAudio()` being present
in source is not evidence of this — only hearing the alarm counts as ANDROID/BROWSER
VERIFIED.

### M6 — Daily Routine / Plan My Day

- `/productivity/daily-routine`: create an item, mark it complete, reload, confirm the
  completion persisted and current/next/later sections still make sense.
- Plan My Day: confirm it opens, reflects Daily Routine data, and state persists across
  reload.
- Dashboard "What Next": confirm it stays consistent with the above after changes.

### M7 — Production regression (once the checkpoint is deployed)

Visit `https://allrounderhelper.vercel.app` and check: homepage loads, AI Assistant
loads and responds, Daily Routine and Plan My Day load, Focus Mode and Pomodoro pages
load, one calculator tool works, one static/legal page loads, no fatal console error on
any of these. This is a smoke pass, not a full visual audit.

## What was deliberately NOT re-done

Per Rule B / the brief's repeated instruction: no broad animation audit, no mobile
overflow audit, no full security audit, no full sitemap/routing audit, no PWA
branding audit. Nothing in this session touched those areas, so nothing needed
re-verifying in them.

## Files changed this session

- `PHASE_9_LEDGER.md` (this file, new).
- `PROJECT_BACKLOG.md` (Phase 9 entry appended).

No application source file was modified — the Step 1 spot-check found no regression,
so per Rule A/Rule 21 there was nothing to fix. No checkpoint ZIP was produced (Rule E:
documentation-only changes, no source changes, so no ZIP was created).

## Verification table

| Area | Result | Level | Evidence |
|---|---|---|---|
| Phase 8 expiry fix present & wired (Continue/Retry/Edit) | Confirmed, no regression | SOURCE VERIFIED | Direct grep + read of all 4 usages |
| Same-session vs. expired distinction logic | Correct | SOURCE VERIFIED + RUNTIME VERIFIED | 9/9 Node cases |
| Affiliate/purchase-intent detection | Correct, incl. false-positive guard | RUNTIME VERIFIED | 19/19 Node cases |
| Reload → Retry with expired image | Not executed | ENVIRONMENT BLOCKED | No browser available |
| Reload → Edit + Regenerate with expired image | Not executed | ENVIRONMENT BLOCKED | No browser available |
| Reload → Continue with expired image | Not executed | ENVIRONMENT BLOCKED | No browser available |
| Same-session control (M2) | Not executed | ENVIRONMENT BLOCKED | No browser available |
| PDF/DOCX/TXT/MD extraction in real use | Not executed | ENVIRONMENT BLOCKED | No browser available |
| Scanned PDF rasterization + vision routing | Not executed | ENVIRONMENT BLOCKED | No browser, no provider creds |
| Capability routing / failover | Not executed | ENVIRONMENT BLOCKED | No network, no provider creds |
| Live provider calls (any) | Not executed | ENVIRONMENT BLOCKED | No network, no credentials |
| Focus Mode / Pomodoro audible alarm | Not executed | ENVIRONMENT BLOCKED | No browser/device |
| Daily Routine / Plan My Day interaction | Not executed | ENVIRONMENT BLOCKED | No browser |
| Build / typecheck / oxlint | Not executed | ENVIRONMENT BLOCKED | No node_modules, no network |
| Production regression | Not executed | ENVIRONMENT BLOCKED | web_fetch not attempted this pass — see Next Step |

## Defects found

None this session.

## Fixes made

None — no defect to fix.

## Remaining manual tests (exact list, unchanged in kind from Phase 8's debt)

Everything in the M1–M7 matrix above, on real Android/browser hardware, ideally with
at least one real provider credential configured for M4.

## Next step

One concrete action: run **M1** (the reload → Retry/Edit/Continue sequence) on a real
device first — it's the highest-value test because it directly exercises the one real
defect this project's AI runtime work has found and fixed. Everything else in the
matrix is lower-risk polish-and-confirm work by comparison.
