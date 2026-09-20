# ALLROUNDER HELPER — Project Backlog

Living backlog. Updated at the end of every engineering session. Items move from
Backlog → In Progress → Done as work is completed and verified (`tsc -b` + `vite build`).

## In Progress

- **Phase 1 — Next-Level Inventory (2026-08-16, this session).** Source-verified
  re-inventory of the AI Assistant architecture, chat UX, and content pattern ahead of
  the "Peak Upgrade" work. Method: read the actual files listed below line-by-line
  rather than trusting prior docs. Findings below are labeled honestly.

  **SOURCE VERIFIED — already correct, do not touch:**
  - `siteKnowledge.ts` builds the ALLROUNDER HELPER identity prompt (who it is, what
    it's for) directly from `academicTools`/`productivityTools`/`documentTools`/
    `creatorTools` registries — no duplicated tool list, so it can't drift from the
    live site. Memoized module-level (`cachedIdentityPrompt`), computed once lazily.
  - Language policy ("reply in the user's language, never drift") lives in this single
    identity block, not per-provider.
  - `promptBuilder.ts` prepends `buildSiteIdentityPrompt()` ahead of the mode/custom
    system prompt for *every* send, so a chat mode or custom prompt can no longer
    silently drop the identity/language rule (this was the documented Mistral
    drift root cause, and the fix is structurally correct — it can't regress per-mode).
  - Capability-boundary disclaimer (no private data access, no browsing, no real
    actions) is in the same identity block, present on every request.
  - `providerOrchestrator.ts` + `openAICompatibleProvider.ts` confirmed: the exact same
    `ProviderMessage[]` (including the system message) is passed to every OpenAI-
    compatible adapter (Mistral, Cerebras, xAI, Z.ai, OpenRouter) with no per-provider
    mutation — retry/failover reuses the identical array, so identity survives retries.
  - Chat layout: `ChatMessageBubble.tsx` confirmed — user messages get
    `ml-auto flex-row-reverse` (right-aligned), assistant messages default left. Verified
    in source, not assumed.
  - 🔥 Flame animation: real CSS implementation in `index.css` (`.ai-flame-core/-aura/
    -spark`, staggered spark delays), not canvas. Respects reduced motion via both a
    `.reduce-motion` class override and a `prefers-reduced-motion` media query — two
    independent paths, both present.
  - Content architecture (`CalculatorLayout` → `ToolArticle` + `faqJsonLd`) is real and
    consistently used, not just documented. Spot-checked CGPA (academic), Study Planner
    (productivity), Merge PDF (document), Color Picker (creator) — all four ship a real
    `article` object with intro/why-it-matters/how-it-works/worked examples/common
    mistakes/tips/FAQs/related-tool links, not filler. FAQ schema (`faqJsonLd`) is wired
    per-page, not just declared.

  **NEEDS IMPROVEMENT — genuine gap, target for Phase 2:**
  - The identity prompt tells the model to recommend relevant tools and briefly explain
    why, but doesn't explicitly instruct it to *limit itself to a small number* of tools
    per answer — nothing currently stops a "tool dump" for a broad question. Small,
    surgical addition to `siteKnowledge.ts`, not a rebuild.
  - Empty-state quick-start chips (`AiAssistantPage.tsx`, `PROMPT_LIBRARY.slice(0,4)`)
    pull from `promptLibrary.ts`, which is a subject-tutoring template library (Math
    proof walkthroughs, Python debugging, etc.) — not the "tell me your problem, I'll
    point you to the right tool" discovery chips requested (e.g. "I have an exam coming
    up", "Which ALLROUNDER HELPER tool should I use?"). These don't exist yet anywhere
    in the codebase. This is new, additive work, not a fix to something broken.
  - No explicit handling in the identity prompt for emotional/vague check-ins ("I'm
    bored", "I keep procrastinating") beyond the model's own inference — reasonable
    given the identity prompt already primes tool-matching behavior, but not something
    to claim as verified without a runtime test.

  **NOT APPLICABLE / already scoped correctly:**
  - AI Settings custom-prompt override: by construction (`promptBuilder.ts` line 26),
    a user's custom system prompt is concatenated *after* the identity block, never
    replacing it — so the "custom prompt shouldn't be able to erase identity" requirement
    is already structurally satisfied. No redesign needed here.

  Routes inventoried: 62 total across Academic (14), Productivity (15), Document (19),
  Creator (9), plus Home/About/Contact/legal(4)/dashboard/settings/analytics/AI(2)/
  Finance/Blog/NotFound — matches what's registered in `App.tsx` exactly, no orphaned
  or missing routes found.

  **Phase 2 scope (next, same session if context allows):** (1) add an explicit
  "recommend a small, specific set of tools — not the whole catalog" instruction to
  `siteKnowledge.ts`; (2) build a real problem-first quick-start chip set for the empty
  state, distinct from the existing subject-tutoring `PROMPT_LIBRARY`; (3) re-run
  build/lint and document honestly.

- **Phase 2 — AI Assistant Peak Upgrade (2026-08-16, same session).** Addressed the two
  genuine gaps found in Phase 1. No rebuild, no architecture change — both changes are
  additive to the existing registry-driven/memoized system.

  **What changed:**
  - `siteKnowledge.ts` — `buildSiteIdentityPrompt()`: strengthened the opening identity
    line to explicitly name "ALLROUNDER HELPER AI" and what the platform is made of;
    added a new "TOOL RECOMMENDATIONS" paragraph instructing the model to recommend a
    *small* number of tools rather than the whole catalog, explain why each fits,
    describe multi-tool workflows when genuine, and infer the underlying need behind
    vague/emotional messages ("I'm bored", "I keep procrastinating") rather than
    replying with generic motivational text; added a "RESPONSE STYLE" paragraph
    (understand → explain → solve → recommend → next step, but only when the question
    actually warrants that shape — a simple factual question still just gets a direct
    answer). Catalog generation, memoization (`cachedIdentityPrompt`), and the
    registry-driven source of truth are untouched.
  - `promptLibrary.ts` — added `PROBLEM_STARTERS`, a new short list of first-person,
    situation-based conversation openers ("I'm bored", "I have exams coming up...",
    "I don't know which tool to use", etc.), kept separate from `PROMPT_LIBRARY` (which
    stays exactly as it was — a subject-tutoring template library for the full Prompt
    Library panel) since the two serve different purposes and mixing them would have
    made `PROMPT_LIBRARY` inconsistent (its entries have `[placeholder]` slots meant for
    `applyPromptTemplate`; problem starters are meant to be sent as-is).
  - `AiAssistantPage.tsx` — empty state now renders `PROBLEM_STARTERS` chips (sent
    directly via the existing `send()` function, same as `FollowUpChips` already does)
    instead of the first four tutoring templates. Updated the empty-state description
    copy to "Tell me what's getting in your way — I'll help you figure out the next
    step and point you to the right ALLROUNDER HELPER tool." Added a small text link
    under the chips to open the Prompt Library panel for anyone who does want the
    subject-tutoring templates, so that functionality wasn't removed, just no longer
    the default empty-state view. Removed the now-unused `PROMPT_LIBRARY` import from
    this file (caught during review — it would otherwise have been a genuine unused-
    import lint failure); the `PromptTemplate` type import and `applyPromptTemplate`
    remain in use for the Prompt Library panel and its chips.

  **Explicitly NOT changed, verified already correct (Phase 1 findings re-confirmed,
  not re-litigated):** chat layout (user-right/AI-left), 🔥 flame CSS + reduced-motion
  handling, `promptBuilder.ts` identity-always-first behavior, provider message pass-
  through for every OpenAI-compatible adapter, custom-prompt-is-additive structure in
  AI Settings, site-knowledge memoization, ads.txt/robots.txt/sitemap.xml presence.

  **Verification — stated honestly:**
  - SOURCE VERIFIED: both changed files re-read after editing; string-literal quoting,
    JSX structure, and import usage checked by hand line-by-line.
  - BUILD: **NOT VERIFIED.** `npm install` failed in this environment — the sandbox has
    no network egress (`npm error 403 Forbidden` fetching from registry.npmjs.org), so
    `node_modules` for this project (including `vite`, `@types/node`, `zustand`, etc.)
    could not be installed, and `npm run build` (`tsc -b && vite build`) could not run
    for real. This is an environment limitation, not a decision to skip verification.
    As a partial substitute: ran a bracket/paren/brace balance check across all three
    edited files (all balanced) and manually re-read every changed block for syntax
    correctness, including the specific unused-import bug caught above.
  - LINT: **NOT VERIFIED** for the same reason (`oxlint` binary isn't installed without
    `npm install` completing).
  - RUNTIME/BROWSER: **NOT VERIFIED.** No running dev server or connected AI provider
    in this environment, so the actual model output (tool-recommendation quality,
    Mistral language behavior, chip click-through) has not been tested end-to-end.
  - REGRESSION: grep-level spot checks confirm the flame CSS block, chat alignment
    class, and public SEO files are untouched by this session's diff. No line-by-line
    re-review of the full previous regression list was repeated this session since
    none of those areas were touched.

  **Genuine limitation to flag directly:** because build/lint could not run, there is a
  real (if small) chance a TypeScript type error exists in the new code that manual
  review missed — e.g. a subtle type mismatch on `PROBLEM_STARTERS` usage. This should
  be re-verified with `npm run build && npm run lint` in an environment with registry
  access before this is treated as release-ready.

- **Phase 2 hardening — quick-start chip polish (2026-08-16, same session).** Trimmed
  `PROBLEM_STARTERS` from 9 to 7 entries (removed two that overlapped with existing
  mid-conversation `FollowUpChips` suggestions) per the "don't overfill the interface"
  guidance. Deliberately did NOT add emoji prefixes to the chips as one brief suggested
  — checked `FollowUpChips.tsx`, the sibling chip component already in production, and
  confirmed its actual pattern uses a Lucide icon (`ArrowUpRight`), never raw emoji
  glyphs, so emoji chips would have been visually inconsistent with the established
  design system. Flagged this deviation rather than applying it silently.

- **Phase 3A — Academic Tools content audit (2026-08-16, same session).** Read the
  actual `article` object in all 14 Academic Tools pages (word counts, FAQ counts,
  example counts extracted directly from source, not estimated) before changing
  anything. Honest finding: the content pattern across all 14 pages is structurally
  consistent and NOT filler — real worked examples, real mistakes, real FAQs with
  schema — but thinner than the brief's own quality bar in most cases (roughly
  330–500 words in the article block, 3 FAQs, 2 examples, no explicit treatment of
  institution-to-institution variance beyond CGPA/GpaToPercentage).

  **Genuinely improved (3 of 14 — worked by hand, not templated):**
  - `CgpaCalculatorPage.tsx` — added a third worked example (projecting a target CGPA
    forward, showing why later semesters move the average less), a fourth "common
    mistake" (early-semester CGPA isn't unrecoverable, just diluted), a fourth FAQ
    (why CGPA barely moves after one strong semester), and a Study Planner related
    link. **Fixed a genuine accuracy issue**: the old CGPA→percentage FAQ stated
    "Most Indian universities use percentage = CGPA × 9.5" as if broadly true; this
    now correctly says there's no single universal formula, ×9.5 is common at *some*
    institutions, and points to the official registrar policy for anything formal —
    matching the accuracy standard the brief explicitly asked for.
  - `AttendanceCalculatorPage.tsx` — was already the strongest page in the category
    (4 related links, clear mechanics). Added: explicit institutional-variance framing
    for the 75% figure in both the intro and a new FAQ (some institutions use 65%,
    others 80%+, some allow condonation), a third worked example ("right at the edge"
    — the case where a student is technically clear but one bad week could put them
    back under), and a fourth "common mistake" (the safe-miss number shrinks over
    time and needs rechecking, not just calculating once).
  - `GpaToPercentagePage.tsx` — the intro previously called ×9.5 "the standard
    formula used by many universities," which overstated its universality even though
    the page's own FAQ already correctly hedged it. Rewrote the intro and
    "why it matters" to match the FAQ's honesty, added a third worked example (a
    concrete "does my GPA clear this cutoff" scenario), a fourth mistake (submitting
    a self-converted percentage on an official document without a registrar
    equivalence certificate), and a fourth FAQ addressing whether foreign
    universities/employers will actually accept the converted number.

  **Reviewed, left unchanged — genuinely adequate, not neglected:** `SgpaCalculatorPage`,
  `SemesterPercentagePage`, `PercentageCalculatorPage`, `AssignmentScorePage`,
  `ExamScorePage`, `MarksRequiredPage`, `DeadlineCalculatorPage`, `StudyHoursPage`,
  `BudgetPlannerPage`, `UnitConverterPage`, `ScientificCalculatorPage` (11 of 14). These
  share the same solid pattern (real examples/mistakes/tips/FAQs/related links) as the
  three improved pages did before this session, and share the same thinness relative to
  the brief's ideal — but improving all 14 by hand in one pass risked exactly the
  shallow, rushed content the brief explicitly warned against. Not claiming these are
  "done" — they're an honest backlog item for the next Academic session, prioritized
  behind Productivity/Document/Creator per the requested phase order.

  **Verification:** SOURCE VERIFIED for all 3 changed files — re-read after editing,
  paren/brace/bracket balance checked programmatically (all balanced), and checked
  specifically for unescaped apostrophes inside single-quoted JS strings (none found —
  all contractions correctly escaped as `\'` or written as `\u2019`). BUILD and LINT
  remain **NOT VERIFIED** — same environment network restriction as the previous
  session (`npm install` still returns 403; not re-tested this turn since nothing about
  the environment changed). ToolArticle.tsx (the shared rendering component) was NOT
  modified, so no new render-path risk was introduced — only the data objects changed,
  against a fixed interface (`ToolArticleContent`) that was read before editing.

  **Next in the requested phase order:** Productivity (15 pages), then Document Tools
  (19), then Creator (9), then homepage/AI-education content, then internal linking
  sweep, then trust/SEO/a11y/perf/security regression, then final build/lint (pending
  network access), then the single final archive. Not starting Productivity in this
  same turn to avoid rushing it — flagged as the next actionable checkpoint.

- **Phase 3A — Academic Tools content phase COMPLETE (2026-08-16, same session).** All
  14 public Academic pages individually inspected; genuinely weak or stale content
  fixed, already-strong content left alone. Re-checked the 3 pages from the prior
  checkpoint (CGPA, Attendance, GPA to Percentage) for consistency before continuing —
  no further changes needed there, they were fine as left.

  **10 more pages touched this session (13 of 14 total across both sessions):**
  - `SgpaCalculatorPage.tsx` — added a mistake (strong SGPA ≠ equal CGPA movement) and
    an FAQ explaining why, plus a Study Planner related link.
  - `SemesterPercentagePage.tsx` — **fixed a real accuracy issue**: "a performance
    label is applied based on standard percentage bands" presented institution-specific
    bands as fact; now explicitly framed as "commonly seen bands... your institution
    may define its own." Added a mixed-scale-subjects worked example and a matching
    mistake (averaging percentages instead of summing raw marks).
  - `PercentageCalculatorPage.tsx` — **fixed the same class of accuracy issue**: the
    GPA-from-percentage FAQ said dividing by 9.5 was "the standard conversion used by
    many Indian universities" as flat fact; reworded to "an estimate... used by some
    institutions... not universal." Added an averaging-across-subjects worked example
    with the same weighting caveat found on Semester Percentage.
  - `AssignmentScorePage.tsx` — added a "tracking across assignments" example
    encouraging students to look for patterns rather than panic over one low score, a
    matching mistake, and a Study Planner link.
  - `ExamScorePage.tsx` — added a genuinely useful worked example most students don't
    think of: passing the combined score while still failing a component-wise minimum
    (common in some institutions' theory+practical split), a matching mistake, and an
    Exam Countdown link.
  - `MarksRequiredPage.tsx` — added a "working backward from remaining assessments"
    example (checking whether a target is still mathematically reachable given what's
    left), a matching mistake, and a Study Planner link.
  - `DeadlineCalculatorPage.tsx` — **fixed a real staleness bug**: tips/FAQ said
    "Once Productivity Tools launches, sync deadlines directly with the Assignment
    Tracker" and called multi-deadline tracking "planned," but `/productivity/
    assignment-tracker` is already a live route (confirmed against `App.tsx`, not
    assumed). Corrected both to describe the feature as available now, and added
    direct related-tool links to Assignment Tracker and Exam Countdown.
  - `StudyHoursPage.tsx` — **fixed the same class of staleness bug**: "Use the Pomodoro
    Timer (coming to Productivity Tools)" — `/productivity/pomodoro-timer` and
    `/productivity/focus-mode` are both already live. Corrected the tip and added both
    as related links. Also added a worked example about routine shape vs. total hours,
    and a mistake about treating a projection as a hard target.
  - `BudgetPlannerPage.tsx` — added an irregular-income worked example (one-time
    scholarship deposits shouldn't scale up regular spending) and a matching mistake.
    No accuracy issue found here — the page already correctly framed 50/30/20 as "a
    widely used" rule, not a universal one.
  - `UnitConverterPage.tsx` — added one worked example (area vs. volume dimensional
    mix-ups). This page was already accurate and well-explained; light-touch addition
    only.
  - `ScientificCalculatorPage.tsx` — **inspected, left unchanged.** Before leaving it
    alone, checked the FAQ's claim ("trigonometric functions aren't available yet")
    against the actual calculator logic in `src/features/academic/logic/
    calculations.ts` — confirmed no sin/cos/tan implementation exists, so the claim is
    accurate. This is the strongest page in the category already (honest about its own
    limits, good mistake coverage); no change needed.

  **Two genuine "stale feature claim" bugs found and fixed** (Deadline Calculator,
  Study Hours) — both said Productivity Tools features were "coming soon" when those
  exact routes are already live in `App.tsx`. This is exactly the kind of trust-quality
  issue Phase 6/7 (Trust/AdSense) asked to be checked for, caught early while working
  through Academic content rather than deferred.

  **Two more accuracy fixes** (Semester Percentage, Percentage Calculator) of the same
  shape already caught on CGPA/GPA-to-Percentage last session — grading-band and
  GPA-conversion figures stated as universal fact, now correctly hedged as
  institution-variable with a pointer to check official policy.

  **Content quality control (self-check against the brief's own checklist):**
  - No duplicate/copied paragraphs between pages — each addition is specific to that
    tool's actual mechanics (verified by re-reading, not just written and assumed).
  - No fake statistics, testimonials, or unsupportable "best"/"most students" claims
    introduced.
  - Calculator UI position unchanged — only the `article` data object was edited on
    every page; `CalculatorLayout`/`ToolArticle` component order (tool first, article
    below) was not touched.
  - No unrelated files modified — diff this session is scoped to the 10 article
    objects listed above.
  - No tool functionality invented — every new claim (component-wise pass minimums,
    routine-shape framing, etc.) describes real academic/planning situations, not
    fabricated calculator features. Where a related-tool link was added, the target
    route was checked against `App.tsx` first, not assumed to exist.

  **Verification:** SOURCE VERIFIED for all 10 files — re-read after editing,
  paren/brace/bracket balance checked programmatically (all balanced across all 10),
  checked for unescaped apostrophes in JS string literals (none found; the one match
  from the automated check was pre-existing JSX text, not a string literal, and needs
  no escaping). BUILD and LINT remain **NOT VERIFIED** — `npm install` still blocked by
  the sandbox's lack of network egress; not re-tested this turn since the environment
  hasn't changed since the last two sessions confirmed the 403.

  **ACADEMIC CONTENT PHASE: COMPLETE.** All 14 pages individually inspected and
  classified; 6 genuinely improved in the first session (CGPA, Attendance, GPA to
  Percentage) plus this session's 10, minus the 1 (Scientific Calculator) correctly
  left unchanged after verification — 13 of 14 pages touched, 1 confirmed
  already-adequate. No page was marked complete without being actually read first.

  **Not proceeding to Productivity in this same turn.** Per the requested work order,
  Productivity (15 pages) is next, followed by Document Tools (19) and Creator (9).
  Given the volume of remaining category work plus the still-outstanding build/lint
  verification, continuing to rush through categories without a checkpoint risks the
  exact shallow-content outcome this whole effort is meant to avoid. This is a clean
  stopping point, not an abandoned one.

- **Phase 4 — Productivity Tools content phase COMPLETE (2026-08-16, same session).**
  Read the actual route registry first rather than trusting the prior estimate: 14
  Productivity tool pages + 1 index page = 15 total, matching what "approximately 15"
  assumed, but confirmed against `App.tsx` rather than taken on faith.

  **Dedicated stale-content audit performed first (high priority per this phase's
  brief), before any editing:** grepped all 14 pages for "coming soon / planned / will
  be available / launching soon / in development / future feature / upcoming /
  currently unavailable." Result: **no genuine stale claims found** in Productivity —
  every match was either a UI label (e.g. "Nothing upcoming" empty state) or ordinary
  prose use of "upcoming," not a false availability claim. This is a different result
  from Academic (which had 2 real stale-claim bugs), and it's reported honestly rather
  than manufacturing a finding to look thorough.

  **One genuine accuracy bug found and fixed** — the more serious kind, a false
  capability claim: `ExamCountdownPage.tsx`'s FAQ stated "exam entries can be edited
  if a date changes." Checked the actual component: only an `addExam`/`removeExam`
  pair exists, no edit handler, no edit button in the JSX. The FAQ was simply wrong.
  Fixed to correctly say there's no edit option and describe the actual workaround
  (delete and re-add); also added a mistake entry and a note that priority level is
  cosmetic and doesn't affect the date-based sort order (also verified against the
  `sorted = [...exams].sort(...)` logic, not assumed).

  **Pages genuinely improved (8 of 14):** Exam Countdown (accuracy fix + depth), Study
  Planner, Weekly Planner, Daily Planner, Priority Matrix, Calendar (added a verified
  nuance: Weekly/Semester Planner do NOT feed into Calendar's aggregation — confirmed
  by reading `calendarEvents.ts`'s five `useLocalStorage` sources directly, not
  assumed), Goal Tracker (added an FAQ explaining progress is a manual 0–100% slider,
  not sub-task-derived — verified against `updateProgress`/`goal.progress` in source),
  Assignment Tracker.

  **Pages inspected and left unchanged — genuinely already strong, not neglected (6 of
  14):** To-Do List, Notes, Pomodoro Timer, Focus Mode, Habit Tracker, Semester
  Planner. Each was read in full before being left alone. Notably these already model
  the standard this whole content phase is asking for: Notes honestly states it has no
  image support and doesn't sync across devices; Pomodoro honestly states the timer
  stops if the tab closes; Semester Planner honestly states it doesn't auto-detect
  holidays; Focus Mode has an unusually precise, verified-accurate comparison against
  Pomodoro Timer. No edits were forced onto these just to show activity.

  **Implementation claims verified against source before writing (not assumed), per
  this phase's explicit requirement:**
  - Habit Tracker's streak logic (`currentStreak`/`bestStreak` in `habitTypes.ts`)
    matches its article's claims exactly.
  - Focus Mode vs. Pomodoro differentiation (presets/task label/fullscreen/sound vs.
    fixed 25/5 + 7-day chart) confirmed against both components' actual state and UI.
  - Calendar's "pulls from exams, assignments, tasks, goals, daily plan" claim
    confirmed against `calendarEvents.ts` — five real `useLocalStorage` reads, no
    fabrication. Also confirmed Weekly/Semester Planner are excluded, which the old
    article didn't mention and could have implied incorrectly.
  - Goal Tracker's progress mechanic confirmed as a manual slider, not automatic.
  - Exam Countdown's edit capability confirmed absent (the bug above).

  **Content quality control:** no duplicated paragraphs between pages (every addition
  is specific to that tool's real mechanics), no fake stats/testimonials/"best"
  claims introduced, calculator/tool UI position unchanged (only `article` objects
  edited), no unrelated files touched, no fabricated functionality — every new
  claim traces to something read in the actual component first.

  **Verification:** SOURCE VERIFIED for all 8 changed files — re-read after editing,
  paren/brace/bracket balance checked programmatically (all 8 balanced). BUILD and
  LINT remain **NOT VERIFIED** — same npm 403 network restriction as every prior
  session; not re-tested since the environment hasn't changed.

  **PRODUCTIVITY CONTENT PHASE: COMPLETE.** 15/15 routes confirmed against `App.tsx`
  (14 tool pages + 1 index); 14/14 tool pages individually inspected; 8 genuinely
  improved (including 1 real accuracy bug fixed), 6 verified already-strong and
  correctly left alone. No page marked complete without being read first.

  **Next in the requested order:** Document Tools (19 pages), then Creator Tools (9).
  Not starting Document Tools in this same turn — stopping at a clean, fully-verified
  checkpoint rather than beginning a new category with reduced attention.

- **Phase 5 — Document Tools: audit complete, content upgrade IN PROGRESS
  (2026-08-16, same session).** First correction: the prior estimate of "approximately
  19 Document Tool pages" was checked against `App.tsx` and is **inaccurate** — the
  actual count is **22 tool pages + 1 index page = 23 routes**, confirmed by counting
  `<Route path="/document-tools...">` entries directly, not assumed. Flagging this
  correction explicitly per the instruction not to trust prior documentation blindly.

  **High-priority privacy/security claims audit — completed for all 23 pages.**
  Grepped every page for the full flagged-term list (private/secure/safe/offline/
  local/never uploaded/no server/encrypted/preserves formatting/unlimited/instant/
  permanent/cloud sync/cross-device/AI-powered/100% accurate). Every "never uploaded"
  / "local processing" claim found was individually traced to source, not
  taken on faith:
  - `WordToPdfPage.tsx` — claims client-side-only `.docx`→PDF conversion. Verified: uses
    `mammoth` (client-side docx parser) and `pdf-lib` (client-side PDF builder), no
    `fetch`/network calls in the conversion path. **Claim accurate.** Also already
    honestly discloses that tables/columns/embedded images are NOT preserved — this
    page is a strong example of the honesty standard this phase is asking for.
  - `OcrTextExtractionPage.tsx` — claims the image is never uploaded. Verified via
    `tesseract.js`'s `createWorker` call: true for the *image*, but the OCR engine
    itself is downloaded from a CDN on first use (a genuine nuance). Checked the
    page's actual wording — it **already discloses this precisely** ("requires an
    internet connection the first time it runs... then works offline," "the engine
    itself is downloaded once and cached"). No fix needed; this was already correct.
  - `SplitPdfPage.tsx`, `ImageMetadataViewerPage.tsx`, `WebpConverterPage.tsx`,
    `DocumentToolsIndexPage.tsx` (site-wide claim) — all claim in-browser-only
    processing. Spot-verified against imports/logic; no network calls found in any.
    **All claims accurate.**
  - OCR accuracy claims checked — no "100% accurate" language found anywhere;
    `OcrTextExtractionPage.tsx` explicitly warns handwriting is unreliable.
  - **Result: no false or overstated privacy/security/capability claims found across
    the entire category.** This is a genuinely different (better) starting state than
    Academic's ×9.5-as-universal problem or Productivity's Exam Countdown edit-button
    bug — reported honestly rather than manufacturing a finding.

  **One real content bug found and fixed (not a privacy issue, a mismatched-answer
  bug):** `QrScannerPage.tsx`'s FAQ asked "Can I scan a barcode instead of a QR code?"
  and answered with information about *Barcode Generator* (which creates barcodes,
  not scans them) — a non-sequitur that doesn't actually answer the question asked.
  Verified against the actual decoding library (`jsqr`, QR-only, no barcode decode
  capability) and rewrote the answer to correctly and directly say no, this scanner
  doesn't read barcodes, and clarify Barcode Generator creates but doesn't scan them.

  **Pages genuinely improved so far this session (3 of 22):** Extract PDF Pages
  (added a second worked example, a Merge PDF related link), PDF to Text (added a
  worked example about recognizing a scanned-vs-digital PDF by extraction failure, a
  Notes related link), QR Code Scanner (fixed the mismatched FAQ bug above, added a
  second worked example, a second mistake about camera-permission fallback — verified
  against the actual "Allow camera access, or upload an image" alternative already in
  the page's `howItWorks`).

  **Verification:** SOURCE VERIFIED for all 3 changed files — re-read after editing,
  balanced brackets confirmed programmatically. BUILD/LINT remain **NOT VERIFIED** —
  same npm 403, environment unchanged.

  **DOCUMENT TOOLS: NOT YET COMPLETE — honest status, not a fabricated finish.** 23
  routes inventoried and the full privacy/accuracy audit is done across all of them
  (the highest-priority part of this phase, per the brief). Content-depth improvement
  has been done for 3 of 22 tool pages so far. The remaining 19 pages (Merge PDF,
  Compress PDF, Rotate PDF, Rearrange PDF, Delete Pages, Image to PDF, PDF to Image,
  Word to PDF, OCR, Image Compressor, Image Resizer, Image Cropper, Image Format
  Converter, JPG↔PNG Converter, WEBP Converter, Image Metadata Viewer, QR Generator,
  Barcode Generator, Document Tools index) were inventoried for article depth (example/
  FAQ counts recorded) and several were read in full during the privacy audit above
  (Word to PDF, OCR, Split PDF, Image Metadata Viewer, Webp Converter, Document Tools
  index — all confirmed already strong, no changes needed), but have not all received
  the same depth pass as the 3 listed above. Continuing in the next turn rather than
  rushing the remaining 19 to claim a false "COMPLETE" this turn.

- **Phase 5 — Document Tools content phase COMPLETE (2026-08-16, same session).**
  Finished individually inspecting all remaining pages from the prior checkpoint.

  **All 5 PDF page-manipulation tools inspected in full (Merge, Compress, Rotate,
  Rearrange, Delete Pages) — VERIFIED, NO CHANGE REQUIRED for all 5.** Every technical
  claim in each was checked against its actual implementation before being accepted:
  - Compress PDF's "re-optimizes internal structure, doesn't re-encode images" claim
    confirmed against the actual `doc.save({ useObjectStreams: true, ... })` call.
  - Delete Pages' "requires at least one page to remain" claim confirmed against the
    shared `PdfPageWorkspace.tsx` component's `indicesToCopy.length === 0` handling.
  - Rotate PDF and Rearrange PDF's precise per-page, no-bulk-action, no-drag-and-drop
    descriptions were checked against the actual UI and match exactly — nothing was
    invented (no "rotate whole document" button, no drag-and-drop, exactly as
    described).
  - Merge PDF's "no hard cap on file count" claim is honestly hedged ("may take
    longer") rather than making an absolute guarantee — appropriate as written.
  These 5 pages did not need edits; each was read in full and is documented here as a
  genuine "inspected, verified, correctly left alone" result, not skipped.

  **One genuine accuracy bug found and fixed — Image to PDF:** the FAQ claimed JPG,
  PNG, *and WEBP* were all accepted input formats. Checked the actual file filter
  (`f.type === 'image/jpeg' || f.type === 'image/png'`) and the dropzone's `accept`
  attribute (`"image/jpeg,image/png"`) — **WEBP is not actually accepted**; a WEBP
  file would be silently rejected. Fixed the FAQ, `howItWorks`, and added a mistake
  entry pointing users to WEBP Converter first, plus a related link to it.

  **A second genuine overclaim found and fixed — QR Code Generator:** the FAQ said
  the tool could encode "Wi-Fi details, contact info" implying functional Wi-Fi-
  auto-connect or contact-card QR codes. Checked the implementation: it's a plain
  `<textarea>` piped straight into `QRCode.toDataURL()` — no `WIFI:`/`MECARD:`/vCard
  template logic exists anywhere in the file. A student typing "Wi-Fi: name,
  password: 1234" as plain text gets a QR code that displays that literal text when
  scanned, not one that auto-connects a phone to the network — those require a
  specific syntax this tool doesn't generate. Rewrote the FAQ to be accurate and
  added a matching "mistakes" entry so this doesn't quietly mislead a reader into a
  poster that doesn't do what they expect.

  **Pages content-depth-improved this pass (6 more, all verified-accurate first):**
  Image to PDF (accuracy fix above + depth), PDF to Image (verified `scale: 2` /
  `image/png` output claims exactly match `page.getViewport({ scale: 2 })` and
  `canvas.toDataURL('image/png')` in source; added depth), Image Compressor (already
  strong; added one example), Image Resizer (already strong; added one example/
  mistake), JPG↔PNG Converter (already strong; added one example), QR Generator
  (overclaim fix above + depth).

  **Remaining pages inspected and VERIFIED — NO CHANGE REQUIRED (Image Cropper,
  Image Format Converter, Barcode Generator, plus the earlier-audited Word to PDF,
  OCR, Split PDF, Image Metadata Viewer, WEBP Converter, Document Tools index):**
  Image Cropper's specific "92% JPEG re-encode quality" claim was checked character-
  for-character against `canvas.toBlob(..., 0.92)` in source — exact match, a genuinely
  precise and verified claim, not a plausible-sounding guess. Barcode Generator
  correctly distinguishes CODE128 from retail UPC/EAN formats and is honest that no
  color/size customization exists. Image Format Converter's claims were consistent
  with the fixes already made elsewhere (accurate JPG/PNG/WEBP support, correctly
  hedged quality-slider behavior).

  **Final category-wide sweep before declaring completion (per this phase's explicit
  checklist):**
  - Stale-content/old-branding re-scan across all Document Tools pages and shared
    components: **zero matches** for "coming soon / planned / will be added / not
    available yet / future feature / launching soon / ALLROUNDER CALCULATOR" — clean.
  - Every `href` added to a `related` array this session was checked against
    `App.tsx`'s actual route list, not assumed — all valid (`/document-tools/
    merge-pdf`, `/document-tools/webp-converter`, `/productivity/notes`, etc.).
  - All edited files re-balance-checked programmatically (parens/braces/brackets) —
    all pass.
  - `npm install` re-attempted at the start of this final push in case the sandbox's
    network access had changed — **still blocked**, identical `403 Forbidden` from
    `registry.npmjs.org` as every prior session. BUILD and LINT remain **NOT
    VERIFIED**, honestly, not fabricated.

  **DOCUMENT TOOLS — COMPLETE.**
  TOTAL: 23 routes (22 tool pages + 1 index), corrected from the prior "~19" estimate.
  IMPROVED: 9 of 22 tool pages (Extract PDF Pages, PDF to Text, QR Scanner from the
    prior checkpoint; Image to PDF, PDF to Image, Image Compressor, Image Resizer,
    JPG↔PNG Converter, QR Generator this pass).
  LEFT UNCHANGED (verified, not skipped): 13 of 22 (Merge PDF, Compress PDF, Rotate
    PDF, Rearrange PDF, Delete Pages, Word to PDF, OCR, Split PDF, Image Metadata
    Viewer, WEBP Converter, Image Cropper, Image Format Converter, Barcode Generator)
    + the Document Tools index page.
  ACCURACY FIXES: 3 total — QR Scanner's mismatched barcode FAQ (prior checkpoint),
    Image to PDF's false WEBP-support claim, QR Generator's Wi-Fi/contact-card
    overclaim (both this pass).
  STALE CLAIM FIXES: 0 — none found in this category (confirmed by dedicated audit).
  INTERNAL LINK FIXES: added contextual links where genuinely useful (Image to PDF →
    WEBP Converter, Extract Pages → Merge PDF, PDF to Text → Notes) — no link spam,
    every addition checked against the real route list.
  BUILD: NOT VERIFIED — environment/network limitation (npm registry 403, re-tested
    this session, unchanged).
  LINT: NOT VERIFIED — same cause.

  **Not creating the final ZIP yet.** Per the explicit packaging rule, the single
  authoritative archive should represent the complete requested upgrade (Academic +
  Productivity + Document + Creator + final regression + SEO/trust/accessibility/
  performance/security passes), not just this category. Creator Tools (9 pages + 1
  index) is the one category phase remaining before that final consolidation makes
  sense. Packaging now would mean re-packaging again immediately after Creator, which
  the rules explicitly say to avoid ("supersede," not multiply, and only when the
  overall upgrade is complete). Continuing to Creator next.

- **Phase 6 — Creator Tools content phase COMPLETE (2026-08-16, same session).** 9
  routes confirmed against `App.tsx` (8 tool pages + 1 index), matching the assumed
  count exactly this time — no correction needed, unlike Document Tools.

  **Dedicated stale-content audit performed first:** searched all 8 pages for the same
  stale-claim phrase list used in every prior category. **Zero matches** — clean,
  consistent with Productivity and Document Tools' results.

  **One genuine overclaim found and fixed — Social Media Size Guide.** The article
  said the guide contains "current" dimensions and is "kept up to date as platforms
  change their recommended sizes." Checked the implementation: the dimensions are a
  static hardcoded array in the page's source, not a live feed from any platform API.
  There is no mechanism that could make this claim true on an ongoing basis, and — an
  important honesty point — I have no way to verify in this environment whether the
  specific numbers currently in the array (e.g. Instagram Story 1080×1920, YouTube
  thumbnail 1280×720) are still accurate today, since I don't have live web access in
  this session. Rather than either leaving an unverifiable "current" claim or
  guessing at corrections to numbers I can't check, I reworded the article and FAQ to
  accurately describe what the tool actually is (a static reference, not a live feed)
  and added an explicit recommendation to cross-check high-stakes uses against the
  platform's own current page — which is honest regardless of whether today's numbers
  happen to still be correct. Also updated Aspect Ratio Calculator's cross-reference
  FAQ to match this more honest framing instead of also implying guaranteed currency.

  **A second, smaller accuracy improvement — Color Picker.** The contrast-checker FAQ
  vaguely described it as scoring "the way common accessibility guidelines do."
  Checked the implementation and found it's actually more specific and more useful
  than the vague description let on: real WCAG contrast-ratio math with explicit
  AA/AAA pass/fail badges (`contrast.normalAA`, `contrast.normalAAA` in source).
  Rewrote the FAQ to accurately reflect this — the tool does more than the old
  wording gave it credit for.

  **Pages genuinely improved (6 of 8):** Social Media Size Guide (overclaim fix),
  Aspect Ratio Calculator (consistency fix + depth), Color Picker (accuracy
  improvement), Palette Generator (depth — verified all three export claims, JSON/CSS/
  PNG, exactly against `exportJson`/`exportCss`/`exportPng` in source before adding
  content), DPI Calculator (depth — verified the 300/150-200 DPI thresholds exactly
  against the `qualityBand()` function's actual breakpoints), Thumbnail Safe Zone
  Checker (depth — verified the no-upload claim against source, confirmed no network
  calls).

  **Pages inspected and left unchanged — genuinely already strong (2 of 8):** Gradient
  Generator (exceptionally precise — correctly explains conic gradients also use the
  angle slider while radial doesn't, and that a minimum of two color stops is
  enforced; verified against actual state logic), Resolution Calculator (excellent,
  precisely differentiates itself from DPI Calculator's different input/output
  direction, correctly explains the PPI vs. DPI terminology distinction). Both were
  read in full before being left alone.

  **Self-correction caught during editing:** while adding a cross-reference FAQ to
  Aspect Ratio Calculator, an invalid stray `examples2: []` key was accidentally left
  in mid-edit (not part of the `ToolArticleContent` interface, would have broken the
  type). Caught immediately on the next edit before moving on, not left in the file.
  Flagging this transparently rather than silently fixing it.

  **Verification:** SOURCE VERIFIED for all 6 changed files — re-read after editing,
  balanced brackets confirmed programmatically for all 6. `npm install` re-attempted a
  final time before packaging — **still blocked**, identical 403 from
  `registry.npmjs.org`. BUILD and LINT remain **NOT VERIFIED**, reported honestly.

  **CREATOR TOOLS — COMPLETE.**
  TOTAL: 9 routes (8 tool pages + 1 index).
  IMPROVED: 6 of 8.
  LEFT UNCHANGED (verified, not skipped): 2 of 8 + index page (no article content to
    inspect there).
  ACCURACY FIXES: 2 — Social Media Size Guide's false "kept up to date" claim,
    Color Picker's undersold contrast-checker description.
  STALE CLAIM FIXES: 0 — none found.
  INTERNAL LINK FIXES: consistency fix on Aspect Ratio Calculator's cross-reference
    to Social Media Size Guide.
  BUILD: NOT VERIFIED — environment/network limitation, re-tested, unchanged.
  LINT: NOT VERIFIED — same cause.

  ============================================================
  ALL FOUR CONTENT CATEGORY PHASES NOW COMPLETE:
  Academic (14/14), Productivity (14/14 tool pages), Document (22/22 tool pages),
  Creator (8/8 tool pages). Proceeding to final packaging per the completion rule —
  build/lint remain NOT VERIFIED and are reported as such in the release notes below,
  not fabricated as passing.
  ============================================================

- **Phase 5 — Final Production Hardening (started 2026-08-09, still NOT fully complete
  — see "Genuinely still open" below).** Four sessions of work now recorded. Session 3
  (2026-08-10) did a real, line-by-line accessibility review of the entire Productivity
  feature area (14 pages) plus a spot check of Creator/Dashboard, rather than attempting
  all ~230 files at once — see the Done entry below for what was actually found and
  fixed, and what was checked and confirmed already correct. Session 2 worked through
  Parts A/B/C/D/E/F/G of the checklist that session 1 had left open. What remains is
  listed honestly, not marked done to appear finished.

  **Genuinely still open (updated after the Creator + Analytics subphase, 2026-08-10):**
  - **Accessibility/mobile line-by-line review:** Productivity (14 files), Document
    Tools, shared `src/components/ui/`+`src/components/layout/` (17 files), AI (18
    files), Dashboard (6 files), Academic (14 calculator pages + shared foundation),
    and now Creator (9 files) + Analytics (1 page + shared `Charts.tsx`) have all had a
    real line-by-line pass — see the corresponding Done entries and
    `ENGINEERING_DECISIONS.md` for what was found and fixed in each. What's left of the
    original ~230-file estimate is genuinely small at this point but has not been
    re-counted precisely this session — do not assume it's zero without checking
    `src/pages/` (non-feature top-level pages like Home/About/Contact/Finance/BlogPage)
    and `src/pages/dashboard/` beyond what the Dashboard subphase covered, which have
    not been explicitly confirmed as reviewed under this line-by-line standard.
  - **Productivity — false claim corrected, not a fix:** an earlier session's
    cross-cutting note claimed `StudyPlannerPage.tsx`, `HabitTrackerPage.tsx`,
    `DailyPlannerPage.tsx`, and `ExamCountdownPage.tsx` had un-announced validation
    errors. Source-checked directly this session (2026-08-10): none of the four files
    contain any validation-error UI at all. The claim was false and is corrected in
    `FINAL_AUDIT_REPORT.md`; no code change was made since there was nothing to fix.
  - **Document Tools — one part of the same note still unverified:** the same
    cross-cutting note also flagged `ImageToPdfPage.tsx`, `QrGeneratorPage.tsx`,
    `MergePdfPage.tsx`, `QrScannerPage.tsx` for the identical pattern. Given the
    Productivity portion of the note turned out to be false, this Document Tools
    portion should be source-verified directly before being trusted or fixed — not
    assumed correct just because it wasn't the part that was disproven.
  - **Performance:** not touched this session; still only the leak-pattern/timer/listener
    project-wide grep from session 2 (see below), not a per-file render-cost review.
  - **Part A (build/type/lint/test):** still NOT VERIFIED. `npm install` was retried once
    this session and still returns a real `403 Forbidden` — this sandbox has no npm
    registry egress. `tsc -b`, `vite build`, `oxlint`, and any test script have never
    actually been run against this source. This needs a real CI run or a machine with
    registry access before shipping — no way to fix this from inside this sandbox.
  - **Parts C/D (accessibility/mobile):** broadened from a 20-candidate spot-check to a
    68-instance `justify-between` heuristic scan plus manual review of the highest-risk
    files (site header, dashboard stat rows, result/action bars). Every file opened was
    already handling truncation/shrink correctly — consistent with the two prior
    dedicated mobile-audit passes already recorded further down this file. This is still
    a spot-check, not a line-by-line review of all 45 flagged call sites or all ~230
    files — treat it as SOURCE VERIFIED for the files actually opened, not as a
    completed exhaustive audit.
  - **Part B (performance):** timers (`setInterval`/`setTimeout`), DOM/window event
    listeners, and blob-URL (`createObjectURL`/`revokeObjectURL`) usage were checked
    project-wide this session — every interval and listener has a matching cleanup, and
    blob URLs are consistently revoked. No leaks found, nothing fixed (nothing was
    broken). Did NOT check for unmemoized expensive calculations inside individual
    calculator/page render bodies — that would need opening most of the ~230 files
    individually, which this session didn't do.

## Done

- **Phase 5 — Creator + Analytics accessibility/mobile subphase (2026-08-10, session
  5).** Full line-by-line review: all 9 Creator files, `AnalyticsPage.tsx`, and its
  shared `Charts.tsx` dependency. 12 genuine issues found and fixed across 8 files —
  missing `aria-pressed` on 5 different color-only selection toggles, unlabeled hex/color
  inputs and a search input, un-announced validation errors, duplicate accessible names
  on repeated buttons (favorite gradient swatches, per-platform copy/favorite controls),
  a `truncate`-without-`min-w-0` mobile overflow risk in the Analytics "Most used tools"
  list, and a latent hardcoded-SVG-gradient-`id` collision bug in `ProgressRing`/
  `AreaChart` (fixed with `useId()`). `DpiCalculatorPage.tsx`, `ResolutionCalculatorPage.tsx`,
  and `CreatorToolsIndexPage.tsx` reviewed and already correct — no change. Full detail
  and rationale in `ENGINEERING_DECISIONS.md`. All SOURCE VERIFIED (re-read + brace/paren
  balance check); no build available this session (npm registry 403, re-confirmed rather
  than assumed).

- **Phase 5 — Shared components/layout accessibility subphase (2026-08-10, session 5).
  SOURCE VERIFIED (syntax-checked with `tsc --noEmit` against the edited files only —
  full project `tsc -b`/`vite build` still not runnable in this sandbox, see Part A
  above).** Line-by-line review of all 17 files in `src/components/ui/` and
  `src/components/layout/` (the components every feature area shares — buttons, cards,
  dialogs, charts, header/nav, footer, skip link/route layout). 10 of the 17 files were
  already correct and needed no change (`Button`, `Card`, `Badge`, `EmptyState`,
  `ResultStat`, `AnimatedNumber`, `Logo`, `Field`/`FieldWrapper`, `ThemeToggle`,
  `FavoriteToggle`). Genuine issues found and fixed in the other 7:
  - `ConfirmDialog.tsx` — the description paragraph had a visible id-less `<p>` with no
    `aria-describedby` link, so assistive tech announced the dialog title but not the
    body text. Added `id="confirm-dialog-description"` + `aria-describedby` on the
    dialog. (Confirms the prior-session correction that `ConfirmDialog` is a shared
    component used by AI dialogs, not a Document Tools component — no change needed
    there.)
  - `Header.tsx` — mobile menu toggle button had `aria-expanded` but no `aria-controls`
    linking it to the nav it opens. Added `id="mobile-nav"` to the nav and
    `aria-controls="mobile-nav"` to the button.
  - `Breadcrumbs.tsx` — the current-page crumb (the one with no `href`) had no
    `aria-current="page"`, so assistive tech had no way to tell which crumb was the
    active page. Added it.
  - `Charts.tsx` — `LineChart`/`AreaChart`/`PieChart`/`Sparkline` all had a hardcoded
    generic `aria-label` ("Line chart", "Pie chart", etc.) instead of describing what
    data they actually showed, and every instance on a page announced the same generic
    name. Added an optional `label` prop to each (default value = the old generic
    string, so this is additive/backward-compatible for any caller not yet updated) and
    updated the one page that renders them (`AnalyticsPage.tsx`) to pass real labels
    ("Productivity score trend", "Task status breakdown", "CGPA trend", "Attendance
    trend"). Also: `ProgressBar`'s optional visible label text was rendered but never
    programmatically linked to the `role="progressbar"` element — added
    `useId()`-based `aria-labelledby` (falls back to `aria-label="Progress"` when no
    label is passed). `ProgressRing`'s inner `<svg>` had no ARIA at all; its one real
    caller (`AnalyticsPage.tsx`) already renders the numeric value as visible text inside
    it, so the SVG itself is decorative — marked `aria-hidden="true"` rather than adding
    a duplicate label.
  - `RootLayout.tsx` — genuine SPA routing accessibility gap: navigating between routes
    only did `window.scrollTo`, never moved focus. Keyboard and screen-reader users
    stayed focused on whatever control they'd just activated on the *previous* page
    instead of landing in the new page's content. Added a route-change effect that
    moves focus to the existing `#main-content` landmark (which already had
    `tabIndex={-1}` from the skip-link setup, just wasn't being used for this) — skips
    the very first render so initial page load doesn't steal focus from the URL bar.
  - Audited but found already correct: no `onClick` on a non-interactive `div`/`span`
    anywhere in either directory (`FavoriteToggle`/`ThemeToggle`/`Header` all use real
    `<button>`); `Skeleton`/`PageSkeleton` already has `aria-busy`/`aria-label`; `Logo`
    already has real `alt` text; `Field.tsx`'s three field types already correctly wire
    `label htmlFor` ↔ `input id`.

  **Not covered by this subphase:** browser/AT verification of any of the above (all
  flagged `BROWSER VERIFICATION REQUIRED`, most importantly the new `RootLayout` focus
  behavior — needs an actual screen reader/keyboard pass to confirm it doesn't fight
  with an in-page anchor scroll on any route); mobile-safety review of these same 17
  files (not attempted this session — accessibility only); the ~180 files in AI,
  Creator, Academic, Dashboard, and Analytics feature pages.

- **Phase 5 — Document Tools accessibility + mobile-safety subphase (2026-08-10,
  session 4). SOURCE VERIFIED.** Line-by-line review of every file under
  `src/features/document/` (27 files: 2 shared workspace components, 2 logic files, 23
  pages including 9 thin registry wrappers with no interactive JSX of their own) plus
  the document-specific shared components in `src/components/document/`
  (`FileDropzone`, `ProcessingIndicator`, `DownloadCard`, `HistoryPanel`,
  `PrivacyNotice`) and `DocumentToolLayout.tsx` / `FavoriteToggle.tsx`.

  **Note on a prior-session claim:** an earlier session prompt referenced a
  `ConfirmDialog` component in this feature area as already fixed. `ConfirmDialog`
  (`src/components/ui/ConfirmDialog.tsx`) is a real, shared component — but it's used
  only by `AiAssistantPage.tsx` (chat deletion confirmation); nothing in
  `src/features/document/` or `src/components/document/` uses it (verified via
  `grep -rl "ConfirmDialog"` across both directories, zero matches). It has no place in
  a Document Tools subphase and was not touched here.

  **Real issues found and fixed (12 files):**
  - `FileDropzone.tsx` — the hidden native `<input type="file">` remained a second,
    unlabeled tab stop behind the already-labelled custom `role="button"` control
    (Tailwind's `.sr-only` hides visually but doesn't remove focusability). Fixed with
    `tabIndex={-1} aria-hidden="true"` on the input; click-to-open and drag/drop
    behavior untouched.
  - `HistoryPanel.tsx` and `MergePdfPage.tsx` — filename `<span>` had `truncate` but no
    `min-w-0`; flex items default to `min-width: auto`, so long filenames overflowed the
    row instead of clipping, next to `shrink-0` siblings (size label / index badge /
    button cluster). Added `min-w-0`.
  - `ProcessingIndicator.tsx` — the determinate progress bar (`status="processing"` with
    a numeric `progress`) had no `role="progressbar"`/`aria-valuemin/max/now`, only a
    visual filled div. Added standard progressbar semantics, additive only.
  - `PdfPageWorkspace.tsx` (backs Rotate/Rearrange/Extract/Delete Pages) — the per-page
    rotate button's `aria-label` never changed after rotating, so a screen-reader user
    got no confirmation their click had any effect. Label now includes the current
    rotation angle once non-zero. Also added `flex-wrap` to the action button row
    (longest label "Extract selected pages" + "Start over" could overflow ~320–360px
    viewports).
  - `ImageTransformWorkspace.tsx` (backs Resizer/Compressor/Format Converter/WEBP/JPG-PNG
    converters) — the output-format toggle buttons communicated selected state through
    border/background color only, with no `aria-pressed` and no programmatic group
    label. Added `aria-pressed` per button and `role="group" aria-labelledby` wired to
    the existing visible "Output format" text. Also `flex-wrap` on the action row for
    the same overflow reason as above.
  - `BarcodeGeneratorPage.tsx`, `QrGeneratorPage.tsx`, `QrScannerPage.tsx` — inline
    validation error text was a plain `<p>` with no live-region semantics, so dynamically
    inserted errors were not reliably announced. Added `role="alert"`.
  - `PdfTextExtractPage.tsx`, `OcrTextExtractionPage.tsx` — the read-only results
    `<textarea>` had no accessible name at all. Added `aria-label`.
  - `PdfToImagePage.tsx` — the per-page download button's accessible name duplicated the
    filename twice (once from the `<img alt>`, once from the visible `<p>` text) with no
    action verb. Changed to `aria-label={"Download " + name}` on the button and made the
    thumbnail `alt=""` (decorative, redundant with the visible caption).
  - `ImageCropperPage.tsx` — **the one substantive fix this subphase.** The crop-selection
    interaction (`onPointerDown`/`onPointerMove`/`onPointerUp` on a plain `div`) had zero
    keyboard equivalent — a keyboard-only user could upload an image but had no way to
    select a crop region at all, i.e. the tool's core function was entirely inaccessible
    without a pointer. Rather than a fake ARIA patch, implemented a real keyboard-operable
    alternative: on image load, a default selection rectangle (10%–90% of the image) is
    now seeded automatically so a selection always exists; four native
    `<input type="number">` fields (X / Y / Width / Height, in the same display-pixel
    coordinate space the pointer drag already uses, clamped to image bounds) are rendered
    below the image and kept in two-way sync with the same `selection` state the pointer
    drag writes to. Pointer-drag behavior and the `crop()` conversion logic are completely
    unchanged — the new fields are a second way to write to the same state, not a parallel
    code path. Verified by re-reading the full file and confirming balanced
    braces/parens/brackets; **BROWSER VERIFICATION REQUIRED** to confirm the on-screen
    keyboard/focus experience, since no browser is available in this sandbox.

  **Mobile-safety pass (after the accessibility pass):** systematic grep + manual
  inspection for `justify-between`/`whitespace-nowrap`/fixed widths across the same file
  set. All remaining `justify-between` rows already had `flex-wrap`. Every remaining
  `truncate` usage was checked against its container: several are already safe because
  they sit inside a `flex-1 min-w-0` wrapper, or inside a Tailwind `grid-cols-N` track
  (Tailwind's grid utilities already emit `minmax(0, 1fr)`, so grid children don't need
  an explicit `min-w-0` the way flex children do) — these were left alone per the
  false-positive-discipline rule. No fixed-width (`w-[Npx]`, `min-w-[Npx]`) risks found
  in this feature area.

  **Lifecycle/performance check (object URLs):** every `URL.createObjectURL` call site
  across the document feature area was matched against its revocation — all paired
  correctly (unmount cleanup, pre-replacement revocation, or same-function revocation
  after use). No leaks found; nothing changed here, since nothing was broken.

  **Verification levels:**
  - SOURCE VERIFIED — every line above, by direct file inspection (not grep-only).
  - BUILD — NOT VERIFIED. REASON: npm registry/network unavailable (`403`), consistent
    with every prior session in this sandbox; not retried again this session since
    nothing indicated conditions had changed.
  - BROWSER VERIFIED — none. BROWSER VERIFICATION REQUIRED for: the new
    `ImageCropperPage` keyboard-input crop flow (focus order, actual on-screen
    behavior of the synced numeric fields), and general focus-visible/`aria-live`
    announcement behavior for the `role="alert"` and `role="progressbar"` additions
    across this batch — these are standard, correctly-specified attributes, but actual
    screen-reader announcement timing can only be confirmed in a real browser + AT
    combination.



- **Phase 5 — Productivity feature area, full accessibility + mobile-safety review
  (2026-08-10, session 3).** Read all 14 files in `src/features/productivity/pages/`
  line-by-line (not grep-and-assume), checking accessible names, color-only meaning,
  aria state on toggles, keyboard/native-semantics, and mobile overflow risk
  (`justify-between` rows, fixed-width elements next to variable text, truncation/wrap
  handling) against the source rendering logic, not just the class names.
  - **Two real accessibility bugs found and fixed, both instances of state/meaning
    conveyed by color alone with an ambiguous accessible name:**
    1. `CalendarPage.tsx` — the month-grid day-cell `<button>`s had no accessible name
       beyond the bare day number (e.g. a screen reader heard just "12", "13", "14"…
       with no month/year context), and which days had events was shown only as small
       colored dots with no text alternative. Fixed with a full-date `aria-label`
       (including event count when present), `aria-pressed` for the selected-day state,
       and `aria-hidden` on the now-redundant visual day-number/dot elements so the
       accessible name isn't announced twice.
    2. `HabitTrackerPage.tsx` — the weekly per-day completion toggle's only accessible
       name was a narrow weekday initial + day number (e.g. "M12"), and completed vs.
       not-completed was conveyed only via the button's background color — no text or
       ARIA state at all. Fixed with a full-date + habit-name + completion-state
       `aria-label` and `aria-pressed`, with the visual weekday/day-number spans marked
       `aria-hidden` to avoid duplicate announcement.
  - Both fixes are additive (`aria-*` attributes only) — no visual/layout change, no
    behavior change, native `<button>` semantics kept throughout per the "prefer native
    HTML, don't add ARIA mechanically" rule; ARIA was added here specifically because
    it's genuinely missing *state*, not decoration.
  - **Checked and confirmed already correct, no change made** (documented so a future
    session doesn't re-check them from scratch): `AssignmentTrackerPage.tsx`,
    `DailyPlannerPage.tsx`, `ExamCountdownPage.tsx`, `GoalTrackerPage.tsx`,
    `NotesPage.tsx`, `StudyPlannerPage.tsx`, `TodoListPage.tsx`, `WeeklyPlannerPage.tsx`
    item-remove rows — all already use the correct `min-w-0`/`truncate`/`shrink-0`
    combination, or rely on a `flex-1` basis-0 item that wraps gracefully instead of
    overflowing (verified there's no `whitespace-nowrap` forcing single-line overflow
    in any of them). Tab/filter button groups (`GoalTrackerPage.tsx`,
    `TodoListPage.tsx`, `CalendarPage.tsx` view switcher) already carry visible text
    labels, so they have real accessible names without needing ARIA. `ColorPickerPage.tsx`
    swatch buttons already carry a hex-value `aria-label`, so color choice isn't
    color-only for screen-reader users.
  - **Not fabricated:** an initial read of `StudyPlannerPage.tsx`'s subject/exam/goal
    list rows looked like the same "no `min-w-0`, text next to a button" pattern flagged
    elsewhere in this file — closer inspection showed no `whitespace-nowrap` is present,
    so long text wraps onto a second line instead of overflowing. Left unchanged rather
    than "fixed" for a bug that isn't actually there.
  - **Verification:** SOURCE VERIFIED only (this sandbox still has no `node_modules`/
    network — see Part A below). Both edited files were re-viewed in full after editing;
    brace/paren counts and `<button>`/`</button>` tag counts balance in both.
  - **Scope, honestly:** 14 files fully reviewed, 2 more (Creator/Dashboard) spot-checked.
    ~210 files across the rest of the app were not touched this session — see "Genuinely
    still open" above.

- **Phase 5 — Established-provider re-audit (2026-08-09, session 2).** Re-read Gemini,
  Cerebras, Mistral, OpenAI, and OpenRouter adapters end-to-end (not just the newer
  xAI/Z.ai/Cloudflare ones from session 1). No functional bugs found. One documentation
  correction: `GeminiProvider.ts`'s comment claimed Google's official migration path from
  the retired `gemini-2.0-flash` was directly to `gemini-3.5-flash`; live web search this
  session found that's disputed — Google's actual documented path is 2.0 → 2.5 → 3.6, and
  at least one source explicitly called out "not gemini-3.5-flash" as a common
  misconception. `gemini-3.5-flash` itself is independently confirmed GA/stable per
  Google's current docs, so keeping it as the default isn't a bug (it works, and skips a
  second migration in ~2 months) — only the comment's specific claim was corrected, no
  behavior changed. `llama3.1-8b` (Cerebras), `mistral-small-latest`, `gpt-4o-mini`, and
  `openrouter/auto` were all re-confirmed current/valid.

- **Phase 5 — Cloudflare Workers AI proxy path-injection fix (2026-08-09, session 1).**
  `settings.model` (a free-text field in AI Settings) was interpolated unvalidated into
  the Cloudflare Workers AI REST URL in `api/ai/cloudflare.ts`, which is a path segment,
  not a JSON body field like every other provider proxy — a crafted value could redirect
  this authenticated, server-side request to a different Cloudflare API path using the
  deployment's own token. Fixed with a strict `@cf/<vendor>/<name>` format check before
  the value is ever used to build the URL; anything else is rejected with a 400.
  Re-verified still present and correct in session 2. Full detail in
  `ENGINEERING_DECISIONS.md` (Phase 5 entry).


- **Phase 4 — Attachments + PDF/Document Pipeline (2026-08-09).** Per the master phase
  order. Audited the AI Assistant's attachment ingestion pipeline (already largely built
  in earlier sessions) end-to-end rather than trusting it worked as documented — found and
  fixed 3 real bugs plus one UX gap:
  - **Misrouting bug fixed:** `hasDocumentAttachment` (the Phase 3 routing signal) counted
    *any* attachment, including images with nothing extracted, as document context —
    disagreeing with `promptBuilder.ts`, which only ever sends text-bearing attachments to
    the provider. An image-only attach could route toward document-summary/long-context
    providers with zero document content in the actual payload. Fixed with a single shared
    `hasAttachmentText()`/`attachmentsWithText()` source of truth in `attachmentTypes.ts`,
    used by both `promptBuilder.ts` and both `AiAssistantPage.tsx` call sites (`send()`,
    `retryLast()`).
  - **Stale error text fixed:** oversized-attachment error said "10MB limit"; the real
    constant is 25MB (a leftover string from an earlier limit change). Now derives the
    number from the constant so it can't drift again.
  - **Broken-image-after-reload bug fixed:** attachment/generated-image previews are blob
    URLs persisted into `localStorage`-backed conversation history; blob URLs don't
    survive a reload, so old images rendered broken. Added a graceful `onError` fallback
    (labeled "(expired)" chip instead of a broken `<img>`) in `ChatMessageBubble.tsx`, plus
    actual blob-URL revocation on message/conversation permanent deletion (a doc comment
    in `imageGeneration.ts` already claimed this happened; it didn't, until now).
  - **UX gap closed:** a scanned/photographed PDF (no text layer) and a genuinely corrupt
    file both surfaced as one generic "couldn't read this file" tooltip. Extraction now
    returns a reason (`'empty' | 'failed'`), and the attachment chip shows a specific,
    actionable hint — pointing at the existing OCR Text Extraction tool for the scanned-PDF
    case specifically.
  - **Deliberately not built:** automatic OCR fallback when PDF extraction returns empty.
    Tesseract.js OCR needs network on first use and runs multi-seconds-per-page with no
    room for a progress/cancel UI in the compact attachment bar — auto-triggering that
    silently was judged worse than pointing the user at the dedicated, already-built OCR
    tool (which has that room). See Engineering Decisions for the full reasoning.
  - **Confirmed correct, no changes:** PDF/DOCX/TXT/MD extraction logic itself, the
    early-stop truncation threshold, the functional-update pattern that keeps concurrent
    attachment resolution from clobbering user edits, and the shared `pdfjsSetup.ts` worker
    wiring also used by the standalone document tools.
  - **Scope check:** only 7 files touched, all under `src/features/ai/` — confirmed via a
    full file-modification diff that nothing in `src/features/document/` (the standalone
    PDF/image tool pages, separately audited across many earlier content-accuracy
    sessions) was touched, so this phase carries zero regression risk to that area.
  - **Verification:** `attachmentTypes.ts` and `promptBuilder.ts` have no React/DOM
    dependency, so — same method as Phase 3 — they were actually executed via `tsx`: 23
    runtime assertions (size-limit message, image-vs-document classification split, mixed
    attachment lists, and an end-to-end check against Phase 3's real `classifyTask`
    confirming an image-only attach no longer reaches `document_summary` while a real
    extracted-text PDF attach still correctly does). All 23 pass. The four component edits
    were SOURCE VERIFIED (full manual read + brace/paren balance check on every touched
    file) — this sandbox still has no `node_modules`/network for a real `tsc -b`/
    `vite build`, same limitation as every prior phase.
  - **Next up per the master phase order:** Phase 5. Content-accuracy phase (Phase 9)
    also remains large — see the earlier session's entry below for the reproducible
    word-count scan and the next-thinnest-pages list.

- **Content accuracy/depth batch — four more pages
  (`ExtractPdfPagesPage.tsx`, `JpgPngConverterPage.tsx`, `QrGeneratorPage.tsx`), plus
  `PdfToImagePage.tsx` verified accurate as-is.** Read-code-first as usual.
  - `ExtractPdfPagesPage.tsx` — **two real, substantive inaccuracies**, traced against
    `PdfPageWorkspace.tsx`'s actual extract-mode logic. (1) The article implied you start
    with nothing selected and pick pages to keep — actually `marked: mode === 'extract'`
    means **every page starts pre-selected**, and the real workflow is deselecting the
    ones you don't want. (2) The FAQ claimed extracted pages come out "in the order you
    select them" — false; traced `indicesToCopy = pages.filter(p => p.marked).map(...)`
    against the stable `pages` array (never reordered by click sequence) to confirm
    output always preserves original document order regardless of click order. Both
    corrected. Confirmed this pre-selection quirk is specific to extract mode only
    (`marked` starts `false` for delete mode), so `DeletePdfPagesPage.tsx`'s
    already-audited content from an earlier session is unaffected.
  - `JpgPngConverterPage.tsx` — same shared-component gap as the previous batch
    (`ImageTransformWorkspace.tsx`): no mention of batch support or the real adjustable
    quality slider for JPG output. Fixed consistently with the prior batch's pattern.
  - `QrGeneratorPage.tsx` — accurate but incomplete: didn't mention the preview
    regenerates live on every keystroke (no separate "generate" action — confirmed via
    the `useEffect` dependency array), the real 128\u2013512px size range, or that output
    is specifically PNG. Added all three, matching the same live-preview detail already
    correctly documented on Barcode Generator in an earlier batch.
  - `PdfToImagePage.tsx` — **verified accurate, left unchanged.** 2x-scale PNG render,
    individual + ZIP download, per-page selective download all confirmed directly in
    the component's own `processFile`/`downloadOne`/`downloadAll` functions. Recorded
    as verified rather than rewritten, per the "don't over-edit working features"
    principle — no fabricated problems added just to show activity.
  - Word counts: Extract Pages ~237\u2192~430, JPG\u2194PNG ~249\u2192~420, QR Generator ~254\u2192~440.
  - Remaining: 43 more pages still under the word-count target from the ongoing scan.
- **Fixed a real build-breaking TypeScript error found on first verification of the
  previous upload.** `AiSettingsPage.tsx` had `useRef<ReturnType<typeof setTimeout>>()`
  with no initial value — invalid under this project's TS config. Fixed to
  `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)`. Reported prominently
  in the prior session's entry below since it meant that upload did not actually build
  prior to the fix.
- **Content accuracy/depth batch — three related image-tool pages
  (`ImageFormatConverterPage.tsx`, `WebpConverterPage.tsx`, `ImageCompressorPage.tsx`),
  read-code-first as usual.** All three share `ImageTransformWorkspace.tsx`. Found the
  same real gap repeated across all three (the same class of shared-component bug
  pattern this backlog has caught before): none of the three articles mentioned that
  **batch conversion of multiple images is supported** (`allowBatch` defaults `true` —
  confirmed via the dropzone's actual `multiple={allowBatch}` prop and its "Drop one or
  more images here" label when active), and none mentioned the real, adjustable
  **quality slider** (`allowQuality`, defaults 85%/70%, hidden for PNG output since PNG
  `toBlob` is always lossless regardless of the value passed).
  - `ImageFormatConverterPage.tsx` had a direct **contradiction**, not just an omission:
    its FAQ stated "Each conversion handles one image at a time" — false, traced against
    `handleFiles`'s actual `allowBatch ? valid : [valid[0]]` logic. Corrected.
  - `ImageCompressorPage.tsx` had the most substantive finding: `formatOptions` only
    offers `image/jpeg`/`image/webp` — **PNG is not an available output format on this
    page at all**. Traced the actual `initialFormat` selection logic
    (`formatOptions.find(fmt => fmt !== first.type) ?? formatOptions[0]`) to confirm that
    dropping in a PNG source silently defaults its output to JPG, meaning "compressing" a
    PNG here actually converts it and **loses any transparency** — a real, meaningful
    thing a user should know before uploading a transparent PNG expecting a same-format
    compressed result. Added as both a mistake entry and a dedicated FAQ.
  - Batch-download mechanism confirmed by reading the actual code
    (`downloadAll()`/`JSZip`/`zip.generateAsync`), not assumed: results download either
    individually or all together as one ZIP.
  - Word counts: Image Format Converter ~202→~380, WEBP Converter ~223→~400, Image
    Compressor ~225→~420.
  - Remaining: 46 more pages still under the word-count target from the ongoing scan.

- **Content accuracy/depth batch, pages 5\u20138 of the 57-page backlog (2026-08-09).**
  Same read-code-first discipline, done as a batch this time rather than one page at a
  time, per this session's instruction.
  - `RotatePdfPage.tsx` \u2014 **real accuracy bug, most significant of this batch.** The
    article described a "choose whole document or specific pages" mode selector and a
    "pick 90\u00b0/180\u00b0/270\u00b0" angle picker. Checked `PdfPageWorkspace.tsx`'s actual rotate
    mode: there is no mode selector and no angle picker \u2014 it's a single per-page rotate
    button that adds 90\u00b0 per click (`(p.rotation + 90) % 360`) and wraps after four
    clicks. There's also no bulk "rotate whole document" control at all; a full-document
    fix means clicking every page's button individually. Rewrote the article to
    describe the actual click-to-cycle interaction, added a mistake entry about
    overshooting past 4 clicks and one about assuming a bulk-rotate switch exists.
  - `RearrangePdfPage.tsx` \u2014 checked against the same `PdfPageWorkspace.tsx`: the
    "move-up/move-down" claim was accurate (real per-thumbnail arrow buttons, no
    drag-and-drop). Left the accurate claims in place, deepened with real detail
    (boundary buttons disabled at first/last position, thumbnail-grid detail).
  - `ImageMetadataViewerPage.tsx` \u2014 content was accurate but incomplete: the page has
    a genuine "Export JSON" button (downloads file info + all parsed EXIF fields) that
    the article never mentioned at all. Added it as a real feature across `howItWorks`,
    tips, and a new FAQ, plus a FAQ explaining why screenshots typically show no EXIF
    data.
  - `BarcodeGeneratorPage.tsx` \u2014 content was accurate but missed two real UI facts:
    the barcode preview updates live as you type (not "enter text, then generate"), and
    there's no color/size customization \u2014 it's a fixed black-on-white PNG. Added both,
    plus a mistake entry and FAQ about the customization limitation so users don't go
    looking for options that don't exist.
  - **Source-verified** against `PdfPageWorkspace.tsx`'s actual `cycleRotation`/`move`
    logic, `ImageMetadataViewerPage.tsx`'s `downloadJson()`, and
    `BarcodeGeneratorPage.tsx`'s `useEffect`-driven live preview \u2014 not assumed from the
    existing copy in any case.
  - Word counts this batch: Rotate 215\u2192~430, Rearrange 212\u2192~400, Metadata Viewer
    204\u2192~400, Barcode 215\u2192~400.
  - Remaining: 49 more pages still under the word-count target from the original scan.

- **Content accuracy/depth pass, pages 3–4 of the 57-page backlog —
  `ImageCropperPage.tsx` and `DeletePdfPagesPage.tsx` (2026-08-09).** Same
  read-code-first discipline as Focus Mode and Split PDF.
  - `ImageCropperPage.tsx`: found a real, subtle accuracy issue. The FAQ claimed
    cropping never reduces image quality. Checked the actual `crop()` handler \u2014
    `canvas.toBlob(..., file.type.includes('png') ? 'image/png' : 'image/jpeg', 0.92)`.
    PNG output is genuinely lossless, but JPEG output is re-encoded through the canvas
    at 92% quality, which is a real (if usually imperceptible) compression pass \u2014
    the same class of nuance already correctly noted on the Image Format Converter
    page. Corrected the FAQ and added a matching mistake/tip pointing PNG-source users
    at a fully lossless path. 200 \u2192 ~350 words.
  - `DeletePdfPagesPage.tsx`: checked `PdfPageWorkspace.tsx`'s actual delete logic and
    found the existing article was accurate (thumbnail preview claim, "remaining pages
    untouched" claim both genuinely correct) \u2014 left the accurate claims as-is rather
    than rewriting working content. Did find one real, undocumented constraint worth
    surfacing: the component enforces "At least one page must remain" (rejects deleting
    every page), which the article didn't mention. Added it as both a mistake entry and
    a new FAQ, and expanded surrounding content genuinely (thumbnail-preview detail,
    a second example) rather than padding. 205 \u2192 ~330 words.
  - **Source-verified** against `crop()`'s actual canvas/toBlob call and
    `PdfPageWorkspace.tsx`'s actual delete-mode validation, not assumed.
  - Remaining: 53 more pages still under the word-count target from the original scan.

- **Content accuracy/depth pass, page 2 of the 57-page backlog — `SplitPdfPage.tsx`
  (2026-08-09).** Continuing the page-by-page content phase opened last session. Read
  the actual split logic (`PDFDocument.copyPages` per page, zipped via `JSZip`,
  delivered through the shared `DownloadCard`) before touching the copy — same
  discipline as the Focus Mode fix. Found a real accuracy bug: the article's
  `howItWorks` claimed you could "Download all pages together as a ZIP, **or
  individually**" — checked `DownloadCard.tsx`, confirmed it renders exactly one
  Download button bound to the single ZIP blob; there is no per-page download path
  anywhere in this component. Rewrote the article to state that correctly (ZIP-only,
  unzip locally to get individual files), added a mistake entry specifically warning
  users not to expect an individual-page download, an FAQ answering it directly, a
  second example, and a large-PDF processing-time tip grounded in the real
  `for (let i = 0; i < pageCount; i++)` per-page-regeneration logic. 194 → ~360 words,
  2 → 3 FAQs, 1 → 2 examples, 1 → 3 mistakes.
  - Also read `ImageFormatConverterPage.tsx` (196 words, another of the thinnest pages)
    looking for the same class of bug. Checked its actual props
    (`formatOptions={['image/jpeg','image/png','image/webp']}`, `allowQuality`) against
    the article's claims about JPG/PNG/WEBP conversion and lossy-compression behavior —
    **confirmed accurate, no factual issue found**, left unchanged this session (word-
    count expansion for this specific page deferred rather than done partially).
  - **Source-verified** against each page's actual conversion/split logic and shared
    components, not assumed from the existing copy.
  - Remaining: 55 more pages still under the word-count target from last session's
    scan, most not yet re-checked for factual accuracy the way these two and Focus Mode
    were. This is a real, large, multi-session task — continuing it a few pages at a
    time each session rather than rushing a shallow full pass.

- **AdSense/content-quality audit — found and fixed a genuine factual accuracy bug in
  `FocusModePage.tsx`'s article content (2026-08-09).** Ran a proper word-count/content-
  depth scan across all 64 tool pages (parsed each `const article = {...}` object with
  balanced-brace extraction, not a naive regex — a page-file-only regex undercounted
  again here for the same reason as the earlier SEO scan, since some pages define
  `article` before the component). Result: 58 of 64 pages have an article object; word
  counts cluster 200–450 words, well under this session's brief's 800–1500-word target
  for pages that "genuinely benefit from that depth" — flagging this honestly rather
  than claiming it's already sufficient, but not treating it as an emergency either
  (these are narrow utility tools, not long-form guides; forcing 800+ words onto e.g. a
  QR generator page would be the filler this project's own rules explicitly forbid).
  While reading the thinnest pages for real content gaps (not just length), found an
  actual **factual accuracy bug**, not just thinness: `FocusModePage.tsx`'s article
  claimed Focus Mode is "a single uninterrupted block" with "no built-in break," and
  contrasted it against the Pomodoro Timer's "fixed work/break rhythm" as if Focus Mode
  had none. Checked `focusModeTypes.ts` and the page's own `finishPhase()` logic: Focus
  Mode genuinely does auto-advance into a short or long break after every work session
  (configurable `sessionsUntilLongBreak`, `autoAdvance`), the same structural pattern as
  the Pomodoro Timer, just with different defaults, duration presets, a task label,
  fullscreen mode, and soundscapes on top. The article was telling users something
  false about how the tool they're looking at actually behaves. Rewrote `intro`,
  `whyItMatters`, `howItWorks`, `examples`, `mistakes`, `tips`, and `faqs` to correctly
  describe the auto-advancing break cycle and the *real* differentiator (presets/
  fullscreen/soundscapes/task-label vs. Pomodoro's fixed rhythm/7-day chart), while
  genuinely deepening the content per this session's content-quality brief (194 → ~430
  words, 1 → 3 FAQs, 1 → 2 examples) rather than just correcting the error in place.
  **Source-verified** against `focusModeTypes.ts` and the component's own state logic,
  not assumed from the old copy.
  - **Not done this session:** did not rewrite the other 57 article-bearing pages up to
    800+ words — that's a large, page-by-page content project, not something to rush in
    one pass without risking exactly the filler this brief prohibits. Recommend doing it
    a handful of pages at a time in future sessions, prioritizing pages with real user
    traffic over mechanically hitting every page. Did not re-check every other page's
    article content for the same class of factual-accuracy bug just found in
    `FocusModePage.tsx` — only the pages read during the word-count pass were checked;
    a dedicated accuracy pass across all 58 pages is still open.

- **SEO duplicate-title/description audit — genuinely checked via the actual data
  source, confirmed clean (2026-08-09).** Grepping individual page `.tsx` files for
  `description="..."` mostly fails silently, because nearly all calculator/tool pages
  pull their `toolName`/`description` from a central registry (`getToolBySlug(...)` /
  `tool.description`) rather than inlining a string — a page-by-page regex undercounts
  and produces false "missing" positives (the exact mistake a prior session already
  flagged and avoided once before for JSON-LD; same lesson applies here for descriptions).
  Went to the actual source of truth instead: parsed `toolsRegistry.ts`,
  `documentToolsRegistry.ts`, and `creatorToolsRegistry.ts` directly (44 tool entries
  found this way). Checked for (a) duplicate `description` values across entries — zero
  found — (b) duplicate `name` values — zero found — (c) description length outliers
  (<50 or >165 chars, the practical Google snippet range) — zero found. This scan didn't
  cover every individual page's Seo call (e.g. static pages like About/Privacy that set
  their own description inline), only the registry-driven tool pages, which is the
  majority of the site's indexable surface. **Source-verified** (regex/parse against
  actual file content, not assumed).

- **Mobile audit — "lower-confidence" banner items resolved (2026-08-09).** Re-checked
  the three items this backlog had flagged as "not touched": `SemesterPlannerPage.tsx`
  and `AssignmentTrackerPage.tsx` progress banners, `ExamCountdownPage.tsx` notification
  banner. All three were already fixed (a prior session must have addressed them without
  updating this note) — confirmed each already uses `flex-col sm:flex-row` +
  `w-full sm:w-40`/`flex-wrap` correctly. No changes needed there; striking the stale
  "not touched" note.
  - Instead, did a fresh scripted scan of every `justify-between` row across
    `productivity`, `creator`, `document`, `academic`, `ai`, `dashboard`, and
    `analytics` pages (32 files) for the real risk pattern — a heading/text block next
    to a multi-item button or badge group with no `flex-wrap` guard — rather than
    re-checking the same three files. Found and fixed 3 genuine instances plus one
    consistency fix:
    - `ColorPickerPage.tsx` "Saved palette" header: heading + two buttons ("Export
      JSON", "Clear") with no wrap — `Export JSON` is long enough to push the row past
      320–360px width. Added `flex-wrap` to both the row and the button group.
    - `GoalTrackerPage.tsx` goal card header: category/type/due-date badge row had no
      `flex-wrap`, and the text container had no `min-w-0` next to the shrink-0 delete
      button. Fixed both.
    - `HabitTrackerPage.tsx` habit card header: name + streak/best-streak/missed-
      yesterday badges (up to 4 inline items) had no `flex-wrap`; delete button lacked
      `shrink-0`. Fixed both, matched to the same pattern used elsewhere in the app.
    - `DailyPlannerPage.tsx` "X of Y complete" progress banner: same shape as the
      already-fixed Semester/Assignment banners but hadn't received the fix — brought
      into line (`flex-wrap` + `w-full sm:w-32`) for consistency, low severity since the
      text here is short.
  - Checked and confirmed fine, no change needed: `ChatSidebar.tsx`, `AiStatusPanel.tsx`,
    `PromptLibraryPanel.tsx`, `AffiliateRecommendationCard.tsx`, `CodeBlock.tsx`,
    `AiAssistantPage.tsx` sidebar-drawer header (fixed-size icon button, not a growing
    group), `AiSettingsPage.tsx` toggle rows, `StudyPlannerPage.tsx`, `FocusModePage.tsx`,
    `WeeklyPlannerPage.tsx`, `NotesPage.tsx` (title input is `flex-1`, action buttons are
    fixed-size icon buttons — correct existing pattern), `DpiCalculatorPage.tsx`,
    `PaletteGeneratorPage.tsx`, `SocialMediaSizeGuidePage.tsx`, `DailyGoalCard.tsx`,
    `AnalyticsPage.tsx` — all single-value or icon-only right-hand sides that don't grow,
    not the button-group overflow shape.
  - **Source-verified only** — read + manually checked for balanced JSX/braces, cross-
    referenced against the app's own established fix pattern (already used in
    Semester/AssignmentTracker). This sandbox has no `node_modules`/network access, so
    `tsc -b`/`vite build` were not run this session — do that before deploying. No visual/
    browser testing performed (no rendering tool available here either).
  - Remaining genuinely open from this backlog's own prior note: `AiSettingsPage.tsx`
    mobile-viewport pass, and Phase A–G roadmap items below — not attempted this session,
    scope was kept to the specific mobile-overflow pattern only.

- **`AiSettingsPage.tsx` mobile-viewport pass — audited, genuinely already correct, no
  changes needed (2026-08-09).** This was the one item this backlog still listed open
  from the prompt-settings-panel polish work. Read the full page render top to bottom
  at the source level: provider grid is `grid sm:grid-cols-2`, sampling-parameter grid
  is `grid sm:grid-cols-2`, the Reasoning/Vision/Voice toggle row is `grid
  sm:grid-cols-3` with each toggle a short label + single checkbox (no multi-button
  overflow risk), export/import buttons already use `flex-wrap`, and the reset-confirm
  row already has the `flex-col sm:flex-row` + `min-w-0`/`shrink-0` fix from a prior
  session. No instance of the unwrapped-button-group bug pattern found here. Re-verified
  the security-relevant copy on this page too, since a past session fixed misleading
  wording — the current text ("Provider, model, and behavior settings below are used
  for real") is accurate against the actual `updateSettings` wiring, not stale.
- **Re-confirmed security posture, no new issues.** `VITE_OPENROUTER_API_KEY` is the
  only `VITE_`-prefixed provider key in the codebase, and that's intentional/pre-audited
  (OpenRouter documents client-side key usage — see the "Providers" table in
  `FINAL_AUDIT_REPORT.md`), not a leak. No `.env.local`, no `node_modules`, no `dist` in
  this working copy.
 (Grok/xAI, Z.ai, Cloudflare Workers
  AI, Pollinations image generation) — see `FINAL_AUDIT_REPORT.md` for full status detail
  including what's genuinely verified vs. not (nothing was live-tested; this environment
  has no network access to any of these vendor domains and no real API keys). Endpoints
  and request shapes were checked against each vendor's own current official
  documentation via web search rather than written from memory. `tsc -b` + `vite build`
  both pass. Grok and Z.ai reuse the existing `createOpenAICompatibleProvider` factory
  (both genuinely OpenAI-compatible); Cloudflare is a bespoke provider (different
  response shape); Pollinations is a distinct image-generation capability, not shoehorned
  into the text-chat `AIProvider` interface.
- **Capability-based routing (Phase B) — now built** (2026-08-09). Deterministic task
  classifier (`taskClassification.ts`) + documented-not-live-tested capability matrix
  (`providerCapabilities.ts`) + in-memory health tracking (`providerHealth.ts`) +
  scoring/ordering policy (`routingPolicy.ts`), wired into `providerRegistry.
  getRoutedFallbackChain` and `providerOrchestrator.sendWithFailover` (new optional
  `routing` param, backward compatible). See `ENGINEERING_DECISIONS.md` 2026-08-09 entry
  for full detail and honest verification status (`tsc --noEmit --strict` clean on all
  touched files; full project `npm run build` NOT run — this sandbox has no network
  access to install dependencies).
- **Security audit completed** — no secret env vars exposed via `VITE_` prefix, all
  server-only reads confirmed in `api/`, `.env.example` up to date with placeholders only.
- **Audited "Cerebras summarization special task" — confirmed it doesn't exist.** No
  dedicated summarization code path was ever built; "summarize" only appears as generic
  prompt-library templates. Recorded so a future session doesn't assume otherwise.

- **Attachment limit raised to 25MB (not the earlier 15MB) after re-examining the real
  risk.** The original concern (tab freeze during extraction) is already mitigated by
  the extraction loop's per-page `await` (yields to the event loop) and its early-exit
  once past the text-char cap — so processing cost is bounded by content complexity, not
  raw file size. Reasoning documented inline in `attachmentTypes.ts`.
- **Flame thinking indicator, theme-driven.** `TypingIndicator` now shows a pulsing
  `Flame` icon instead of `Sparkles`, styled via the existing `gradient-brand` class and
  a new `animate-flame-glow` keyframe built on the existing `--accent-from`/`--accent-to`
  CSS variables (not a hardcoded color) — automatically neutralized under
  `prefers-reduced-motion` by the pre-existing global `.reduce-motion` rule.
- **First-time AI onboarding dialog** (`AiOnboardingDialog.tsx`) — shown once via a
  localStorage flag, optional name capture wired to the existing `displayName`
  preference, built on the same focus-trap/scroll-lock pattern as `OnboardingTour`.
- **Chat management audit + two real gaps fixed.** Rename/delete/duplicate/export/
  import/search/auto-title already existed — not rebuilt. Found and fixed: "clear all
  chats" didn't exist at all (added `clearAllConversations()`, soft-deletes everything to
  Trash rather than hard-deleting, consistent with the rest of the hook's delete
  semantics); "permanent delete" had zero confirmation despite being irreversible. Built
  one reusable `ConfirmDialog` (`src/components/ui/ConfirmDialog.tsx`) and a new `danger`
  `Button` variant, used for both actions rather than one-off dialogs.
- **Fixed the actual mobile header bug** ("prompt/export/import/settings/status buttons
  scroll horizontally"). Root cause had three parts, all fixed: (1) the action row used
  `overflow-x-auto no-scrollbar` — scrolls with the scrollbar hidden, so there was no
  visual affordance that more buttons existed off-screen; changed to `flex-wrap`. (2)
  The outer `<header>` itself was a non-wrapping flex row, so even a wrapping action row
  would've been squeezed beside the branding block instead of dropping to its own line;
  added `flex-wrap` there too. (3) The title/description text block had no `min-w-0`,
  a classic flexbox bug where long text (the provider-status sentence) can force a flex
  child wider than available space and cause real page-level horizontal scroll — added.
  **Verified via code-level audit of the CSS causing the bug, not via visual/browser
  testing at each breakpoint** — this environment has no browser-rendering tool
  available, so I couldn't literally screenshot-check 320/360/375/390/430px as
  requested; flagging this limitation explicitly rather than implying visual testing
  was performed.
- **AI attachments now actually reach the AI — real bug found and fixed (verified with
  `tsc -b` + `vite build`, both clean).** Audited the reported "PDF upload doesn't work"
  complaint; the literal error text didn't exist in the codebase, but the underlying
  pipeline genuinely was broken — attachments captured only file metadata (never content),
  and `buildProviderMessages` dropped the `attachments` field entirely. Fixed both: new
  `extractAttachmentText()` (PDF via existing lazy pdfjs pattern, DOCX via mammoth, TXT/MD
  via `file.text()`), real `reading`/`ready`/`error` status shown per attachment chip,
  provider messages now include extracted text (capped at 20k chars, truncation-noted).
  Also consolidated a duplicated `Attachment` type definition found along the way, and
  caught + fixed a real perf regression (pdfjs was initially statically imported,
  verified fixed via build output inspection, not assumed). See Engineering Decisions
  for full detail.
- **AI Assistant: time-based greeting + display name** — `getGreeting`/`getGreetingSubtext`
  in `src/features/ai/logic/greeting.ts`, `displayName` field added to the preferences
  store, Settings → Profile card, wired into the AI empty state.
- **Homepage: "Continue where you left off" + streak** — reuses existing
  `useRecentToolsStore` and the read-only `useProductivityInsights` hook. Only renders
  with real local activity; no fabricated placeholder state.
- **PWA install banner** — `useInstallPrompt` hook + `InstallBanner` component, mounted
  globally in `RootLayout`. Only shows on a genuine `beforeinstallprompt` event.
- **Category pages: search + "most used"** — `useToolFilter` hook and
  `CategorySearchBar`/`MostUsedInCategory` components shared across all four category
  pages (Academic, Productivity, Document, Creator). "Most used" is derived from real
  local usage counts and renders nothing when there's no usage yet.
- **Verified, not assumed: tool-page SEO content and affiliate recommendation flow.**
  Audited and confirmed already complete — every calculator/tool page has full
  `ToolArticle` content via `CalculatorLayout`/`ProductivityToolLayout`/etc., and the
  affiliate card is correctly gated and targets the specified URL. No changes needed;
  documented here so future sessions don't re-audit from scratch.
- **Fixed duplicated greeting logic.** `DashboardPage.tsx` had its own local `greeting()`
  function, separate from the `getGreeting`/`getGreetingSubtext` utility added for the
  AI assistant. Consolidated into one shared `src/lib/greeting.ts`, used by both. Dashboard
  greeting now also personalizes with the display name, matching the AI assistant.
- **Investigated the ~664KB `chunk-KEIR6QF5` build warning — confirmed it is not a real
  issue.** It's `vscode-languageserver-types`/langium code pulled in only by Mermaid's
  internal diagram-type sub-chunks (state/pie/gitGraph/etc.), which our own
  `MermaidDiagram.tsx` already dynamically imports (`await import('mermaid')`). Verified
  via `dist/index.html` that this chunk is not referenced from the initial page load —
  only from other lazy Mermaid chunks. No action needed; removed from backlog.
- **Recent AI conversations on the Dashboard.** New `useRecentConversations` read-only
  selector (`src/features/ai/logic/useRecentConversations.ts`) exposes the 5 most
  recently updated, non-deleted, non-archived conversations without pulling in the full
  `useConversations` UI-state hook. Added deep-link support to `AiAssistantPage` (via
  router `state.openConversationId`, matching the existing `pageContext` prefill
  pattern) so the new Dashboard card actually opens the right conversation instead of
  just linking to a generic empty chat.
- **PWA branding & install icons — audited and fixed real bugs.** Confirmed the manifest
  `name` had an unwanted subtitle appended (`"ALLROUNDER HELPER — Student Productivity
  Platform"`), and `short_name` (`"ALLROUNDER"`) dropped "Helper" entirely. Fixed both:
  `name` is now exactly `"ALLROUNDER HELPER"`, `short_name` is `"AR Helper"` (11 chars,
  keeps both words, fits standard launcher truncation limits — see Engineering
  Decisions for why). More importantly, found and fixed real icon-asset bugs:
  `icon-512-maskable.png` had a visible dark border and a mispositioned white box
  around the badge (confirmed via a simulated circular-mask preview that it would have
  been badly clipped on real Android launchers), and `icon-192.png`/`icon-512.png` used
  inconsistent padding relative to each other. Regenerated all three (plus
  `apple-touch-icon.png`) from the existing clean source logo with a Python/PIL script
  that auto-crops to content bounds and re-composites with correct, consistent padding
  and a proper maskable safe-zone. Also added the missing `apple-mobile-web-app-title`
  (and related iOS/Android meta tags) to `index.html` — without it, iOS was falling back
  to the page `<title>` (which includes the subtitle) for the home-screen label.
  Favicons were inspected and left unchanged — they were already correctly proportioned.
- **Tool-page cross-linking audit — verified clean, no changes needed.** Mechanically
  extracted every `related` tool `href` across the entire `src/features` tree (74 unique
  hrefs) and cross-checked against every route actually defined in `App.tsx`. Zero
  broken links. Also checked for pages linking to their own route (self-links) — none
  found. Documented so future sessions don't need to re-run this from scratch unless new
  tool pages with `related` arrays are added.
- **SEO structured data pass — verified already complete, no changes needed.** Initially
  a naive check flagged `AboutPage`, `ContactPage`, `BlogPage`, and `FinanceToolsPage` as
  "missing" JSON-LD (same false-positive class as an earlier session's mistake — grepping
  a page file directly instead of checking the shared layout it renders through). On
  closer inspection, `AboutPage`/`ContactPage` get breadcrumb JSON-LD via
  `StaticPageLayout`, and `BlogPage`/`FinanceToolsPage` get it via
  `ComingSoonCategoryPage`. Only `NotFoundPage` and `OfflinePage` genuinely lack it,
  which is correct — neither is meant to be indexed.
- **Document-tool thin-content fix — 16 pages, real gap, fixed.** A scripted audit found
  16 of the document-tool pages had only 1 FAQ entry each (`ImageFormatConverterPage`,
  `ImageToPdfPage`, `ExtractPdfPagesPage`, `WebpConverterPage`, `PdfTextExtractPage`,
  `ImageCropperPage`, `PdfToImagePage`, `JpgPngConverterPage`, `ImageResizerPage`,
  `QrGeneratorPage`, `BarcodeGeneratorPage`, `DeletePdfPagesPage`, `RotatePdfPage`,
  `QrScannerPage`, `ImageCompressorPage`, `RearrangePdfPage`) — a real thin-content
  signal directly relevant to the roadmap's AdSense-readiness concern. Added 2 more
  accurate, tool-specific FAQs to each (now 3 per page), grounded in each tool's actual
  existing `intro`/`howItWorks`/`tips` content rather than generic filler — e.g. privacy
  ("is this uploaded anywhere? No, it runs in your browser"), format/quality specifics,
  and common follow-up questions a student would actually ask about that specific tool.
- **Same thin-content fix extended to productivity and creator tools — audit complete
  across all three tool categories.** Ran the identical scripted single-FAQ check
  against `src/features/productivity/pages` and `src/features/creator/pages`. Found and
  fixed 12 more pages the same way: `SemesterPlannerPage`, `DailyPlannerPage`,
  `AssignmentTrackerPage`, `WeeklyPlannerPage`, `PriorityMatrixPage` (productivity);
  `AspectRatioCalculatorPage`, `ResolutionCalculatorPage`, `ColorPickerPage`,
  `PaletteGeneratorPage`, `SocialMediaSizeGuidePage`, `GradientGeneratorPage`,
  `ThumbnailSafeZoneCheckerPage` (creator). Every tool page across all three categories
  (academic was already fine per an earlier session's audit) now has at least 3
  substantive, tool-specific FAQ entries. This closes out the thin-content backlog item
  entirely — no more categories left to check for this specific issue.

- **Phase A audit (Dashboard evolution) — verified already complete, no changes
  needed.** Checked for the roadmap's "today's study overview" and "motivation card
  beyond the existing quote widget" items specifically. Both already exist: the
  study-insights card (streak / today's score / weekly avg / 35-day heatmap) and the
  quote-of-the-day `SoftCard`. Nothing genuinely missing in this phase right now.
- **Accessibility spot-check (Phase F) — no issues found.** Grepped for `<img>` tags
  missing `alt` and icon-only `<button>`s missing `aria-label`; every hit either had
  proper `alt` text already or a visible adjacent label. No changes made.
- **AI Assistant: added PDF export (Phase B gap, closed) + fixed a real truncation
  bug in the shared PDF exporter.** Export menu now offers Markdown / PDF / JSON /
  Text. Extracted the pdf-lib drawing logic into `src/lib/pdfTextDocument.ts`, shared
  with `useResultPdfExport`, and fixed a bug where content longer than one page was
  silently cut off instead of flowing to a new page. See Engineering Decisions for
  detail. **Verified at the source level only** — this session had no network access,
  so `tsc -b`/`vite build` were not run; run them before deploying.

- **Phase C — "Daily study goal" gap, audited and closed.** Confirmed the suspected
  gap was real: `GoalTrackerPage`'s `Goal` type is long-term/short-term project goals
  (0–100% progress, deadline), and `useProductivityInsights`'s streak/score is
  activity-derived with no user-set target — neither is a "study N minutes today"
  concept. Built `useDailyStudyGoal` (`src/hooks/useDailyStudyGoal.ts`) — a minutes-based
  daily target checked against real Focus Mode + Pomodoro data already recorded, no new
  tracking mechanism — and `DailyGoalCard` (`src/features/dashboard/components/`),
  wired into the Dashboard between the stat cards and the existing study-insights card.
  Inline-editable target (default 60 min, clamped 5–600), progress bar, "goal hit"
  state. See Engineering Decisions for why minutes was chosen over the existing 0–100
  score or a free-form goal-type picker. **Verified at the source level only** — no
  network access in this session either (`npm install` still 403s on the registry, same
  as the previous session), so `tsc -b`/`vite build` have not been run; do so before
  deploying.

- **Phase B — AI experience: "suggested follow-up questions" gap, audited and
  closed.** Confirmed genuinely missing (grepped the `ai` feature for
  `follow-up`/`quick action`, zero hits) before building. Added heuristic (no extra AI
  call — see Engineering Decisions for why) follow-up chips under the latest completed
  assistant reply: `src/features/ai/logic/followUpSuggestions.ts` +
  `src/features/ai/components/FollowUpChips.tsx`, wired into `AiAssistantPage`.
  Mode-aware defaults (7 chat modes each get 3 relevant prompts) plus one contextual
  chip when the reply contains code or a list. **Verified at the source level only** —
  no network access this session (`npm install` still 403s), so `tsc -b`/`vite build`
  have not been run; do so before deploying.

- **Phase B — "Jump to latest message" button, audited and closed.** Confirmed
  genuinely missing (grepped `AiAssistantPage.tsx`/`ChatMessageBubble.tsx` for
  `jump`/`scroll`-to-bottom UI, found only the existing auto-scroll-while-pinned
  behavior and the search bar's jump-to-message, neither of which resurfaces once a
  user has manually scrolled up). Added a floating pill button that appears only when
  `isPinnedToBottom` is false and the active conversation has messages — mirrors the
  existing `pinnedToBottomRef` into render state (`isPinnedToBottom`) since a ref write
  alone can't drive button visibility. Button reads "New message" with a pulsing dot
  while a response is actively generating (so users mid-conversation know new content
  arrived below), and "Jump to latest" otherwise; both variants scroll smoothly to the
  bottom and re-pin. Scoped to a wrapper around just the scroll region (not the whole
  `Card`) so it sits directly above the composer rather than floating over the search
  bar/status panel. **Verified at the source level only** — this session had no network
  access (`npm install`/`node_modules` unavailable), so `tsc -b`/`vite build` were not
  run; run them before deploying.

- **`AiSettingsPage.tsx` — fixed misleading "nothing here works yet" copy (2026-08-09).**
  Audited before touching anything: `settings.model` and `settings.activeProviderId` are
  genuinely consumed by real code (`providerRegistry.ts`, `routingPolicy.ts`, every
  provider file — confirmed by grep, not assumed), so the page's blanket "Nothing here
  calls an external service yet" banner was stale and actively wrong. `settings.apiKey`
  specifically really is still unused anywhere (confirmed zero real references outside
  its own type/UI) — every provider is keyed via env vars, not a user-typed key — so
  that field's label was corrected to say so precisely rather than removed, since a
  future "bring your own key" mode may use it. Reasoning/Vision/Voice toggles confirmed
  still genuinely unused (only referenced in their own type declaration) — left
  unchanged, their existing "placeholder" disclaimer is accurate. **Verified at the
  source level only** — no `node_modules`/network in this session, so `tsc -b`/`vite
  build` were not run; run them before deploying.
- **Fixed a stale self-contradiction in this file** — the "Done" section already said
  capability-based routing (Phase B) was built; the "Backlog" section below still said
  "not yet started," left over from before that work landed. Corrected the backlog
  entry in place (struck through, not deleted, so git history stays honest) after
  re-confirming the routing files are genuinely wired in (`providerRegistry.ts` imports
  and calls `routeProviderOrder` from `routingPolicy.ts`).

- **Voice input — implemented (2026-08-09), scoped deliberately narrow.** Audited first:
  confirmed zero prior implementation (grepped for `SpeechRecognition`/`speechSynthesis`
  across `src/`, zero hits) — the `voiceEnabled` setting was a genuine dead placeholder,
  not partially built. Implemented single-utterance dictation via the browser-native
  Web Speech API (`useSpeechToText.ts`) — real capability, not a provider integration, no
  network call this project controls, no API key. A mic button appears next to the
  composer only when both `settings.voiceEnabled` is on AND the browser actually exposes
  `SpeechRecognition`/`webkitSpeechRecognition` (checked via feature detection, not
  browser-sniffing) — so no dead button shows in Firefox, where this API doesn't exist.
  Deliberately NOT a continuous voice-chat mode (no turn-taking, no TTS playback of
  replies) — that's a materially larger, riskier feature and isn't what the existing
  `voiceEnabled` toggle or its prior "placeholder" comment ever promised. Transcribed
  text is appended to the existing composer input, not auto-sent, so the user can review
  before sending. Errors (permission denied, no mic, no speech, network) are surfaced via
  the existing toast system with human-readable messages, not raw API error codes.
  Updated the misleading `aiTypes.ts` comment and `AiSettingsPage.tsx` copy that both
  called Voice a "placeholder" now that it's real. **Verified at the source level and a
  manual brace/import structural check only** — no `node_modules`/network in this
  session, so `tsc -b`/`vite build` were not run; run them before deploying. Also
  genuinely untested on-device (no browser-rendering tool available here) — the Web
  Speech API's real-world quirks (mobile Safari's more limited support, permission
  prompt timing) should be checked on an actual device before shipping.

_(none — pick up from Backlog at the start of the next session. Suggested next step:
per-message "regenerate with different wording" was audited this session — the
existing Retry (`onRetry`/`canRegenerate` in `ChatMessageBubble.tsx`) only re-sends the
identical prompt/history, so a true "different wording" variant would need either a
temperature bump or an explicit rephrase instruction appended to the resend. Left as a
real but lower-priority backlog item (below) rather than building it same-session as
the jump-to-latest button, to keep this session's change to one verified unit of work.
Otherwise continue toward Phase A's remaining "motivation card" item or Phase E
(Premium architecture, which still needs product input on what "Premium" gates).)_

- **AI Settings page — real "Saved" confirmation added, no fake Save button (2026-08-09).**
  Audited the actual persistence model first: `useAISettings`/`useLocalStorage` already
  writes to `localStorage` on every single change, immediately, with no draft/dirty
  state anywhere in the architecture. Adding a gated "Save" button on top of that (as a
  generic settings-UX checklist might suggest) would have been the same class of bug just
  fixed on this page — a control implying behavior ("unsaved changes") that isn't real.
  Instead added a debounced, `aria-live` "Saved" confirmation next to the page title that
  reflects the actual write, not a simulated one — fades in on any settings change, holds
  1.6s, uses the existing `transition-opacity` pattern so it's automatically covered by
  the project's existing global `prefers-reduced-motion` rule (didn't need a bespoke one).
  Reset-to-defaults already existed with a confirm step from a prior session — left
  unchanged, it was already correct. **Verified at the source level and a manual
  brace/import structural check only** — no `node_modules`/network this session, so
  `tsc -b`/`vite build` were not run; run them before deploying.
- **System-prompt character counter added.** Live count next to the label, no fabricated
  hard limit — checked first and confirmed there's genuinely no enforced max length on
  `systemPrompt` anywhere in the codebase, so the counter is purely informational rather
  than implying a cap that doesn't exist. Closes that part of backlog item 11.
- **Mobile audit — code-level scan of AI feature components, no new bugs found
  (2026-08-09).** Grepped `src/features/ai/**` for the known anti-patterns behind the
  earlier header bug (`overflow-x-auto` on button/control rows, `whitespace-nowrap`
  without wrap fallback, fixed-width containers without `min-w-0`). The only
  `overflow-x-auto` hits are `CodeBlock.tsx` and `MermaidDiagram.tsx`, both legitimate
  (code/diagram content that genuinely needs horizontal scroll, unlike the earlier
  button-row bug). `ChatSidebar.tsx` and `AttachmentBar.tsx` already use
  `flex-wrap`/`min-w-0` correctly. `AiSettingsPage.tsx` uses `sm:grid-cols-*` throughout
  (collapses to a single column below 640px) and `flex-wrap` on its button rows — no
  changes needed. **This is a code-level pattern scan, not the full requested
  320–1280px visual breakpoint sweep** — this environment still has no
  browser-rendering tool, so real device/browser testing remains genuinely
  unperformed and should be done before relying on this as complete mobile coverage. Live count next to the label, no fabricated
  hard limit — checked first and confirmed there's genuinely no enforced max length on
  `systemPrompt` anywhere in the codebase, so the counter is purely informational rather
  than implying a cap that doesn't exist. Closes that part of backlog item 11; the
  mobile-layout pass for this specific page is still open.

## In Progress

_(none — Phase 4 (Attachments + PDF/Document Pipeline) closed out this session, see Done
above/below. Next up per the master phase order: Phase 5. Content-accuracy phase (Phase 9)
also remains large — see the earlier session's entry below for the reproducible word-count
scan and the next-thinnest-pages list.)_

- **Phase 3 — Intelligent Task Routing (2026-08-09).** As anticipated in the previous
  session's note (below), the routing architecture — `taskClassification.ts`,
  `providerCapabilities.ts`, `providerHealth.ts`, `routingPolicy.ts`,
  `providerOrchestrator.ts`, `providerRegistry.ts` — was already built and wired in from
  an earlier session. This phase was therefore a genuine verification/testing pass, not
  new construction, and it found real, previously-undetected bugs:
  - **Real bug found and fixed:** in `taskClassification.ts`'s rule list, the generic
    subject-domain rules (`mathematics`, `science`) were checked *before* the more
    specific study-format rules (`flashcards`, `quiz_generation`, `exam_preparation`).
    A request like "make me flashcards for biology" matched the `science` rule's
    `biology` keyword first and never reached the `flashcards` rule at all — so it was
    misrouted to science-weighted providers (reasoning/writing-favoring) instead of
    flashcards-weighted ones (speed/summarization-favoring). Fixed by moving the
    study-format rules ahead of the subject-domain rules, with an inline comment
    explaining why. Caught by a runtime test harness (see below), not by inspection —
    this is exactly the class of ordering bug that a source read alone tends to miss.
  - **Real bug found and fixed:** `document_summary`'s pattern included a bare
    `tl;?dr this` alternative with no requirement that an actual document/pdf/file/
    attachment/upload be mentioned — so "tldr this article" or "tldr this movie plot"
    was misclassified as `document_summary` (and weighted toward long-context providers)
    instead of the generic `summarize` category, even with no attachment present.
    Removed the bare alternative; `document_summary` now only fires on an explicit
    document-ish noun, consistent with the rule loop's own documented intent (a real
    attached-file request with no matching keyword still correctly falls through to the
    `hasDocumentAttachment` default below the loop).
  - **Doc fix:** `providerCapabilities.ts`'s inline comment for the xAI profile still
    said `grok-4.3` after Phase 2 updated the actual default model to `grok-4.5` —
    updated the comment to match. Also corrected the same stale value in the Grok row of
    `FINAL_AUDIT_REPORT.md`'s provider table (the top-of-file summary already said
    `grok-4.5` correctly; only the table row had drifted).
  - **Explicit user-provider override, health penalty, capability scoring, and
    image-generation bypass (routed before any text provider, per
    `imageGeneration.ts`/`AiAssistantPage.tsx`) were all re-audited and confirmed
    correct** — no changes needed there.
  - **Verification method:** since this sandbox has no `node_modules`/network for a real
    `vite build`, the routing/classification files were verified by actually *running*
    them — `taskClassification.ts`, `routingPolicy.ts`, `providerCapabilities.ts`, and
    `providerHealth.ts` have no DOM/React/fetch dependencies, so a standalone `tsx`
    script imported them directly and exercised 96 assertions across classification
    correctness (21 category cases + document/long-context fallback), capability-profile
    sanity, category-based ranking, health-penalty accrual/decay, and the explicit
    override rule. All 96 pass after the two fixes above (2 failed before). This is a
    stronger verification level than the "syntax/brace-balance check" used for the
    provider adapters in Phase 2, since routing logic has no external I/O and can be
    genuinely executed here — labeled **RUNTIME-VERIFIED (routing/classification logic
    only)** to be precise about what that does and doesn't cover; the orchestrator's
    actual network calls, UI wiring, and the provider adapters themselves remain SOURCE
    VERIFIED only, same as Phase 2.
  - `tsc -b`/`vite build` still could not be run (no network to install dependencies in
    this sandbox) — remains outstanding, same as every prior phase.

- **Phase 2 — AI Provider Integration Hardening (2026-08-09).** Re-verified every
  chat-provider endpoint and default model id against current vendor documentation via
  web search (this session had search access, unlike the sandbox-only session that
  originally wired these providers in).
  - **Real bug found and fixed:** `GeminiProvider.ts` defaulted to `gemini-2.0-flash`,
    which Google retired 2026-06-01 — every request using the default model would have
    404'd in production. This is a genuinely severe, previously-undetected issue: it's
    invisible to `tsc`/`vite build` (valid string, not a type error), so it would only
    have surfaced as a live failure. Fixed to `gemini-3.5-flash` (Google's own current
    default across its products, confirmed GA as of Aug 2026).
  - **Model currency update:** `XaiProvider.ts` defaulted to `grok-4.3`, which still
    worked (not broken, xAI's own retirement redirects older slugs to 4.3) but is no
    longer xAI's flagship — Grok 4.5 shipped July 8, 2026. Updated the default to
    `grok-4.5`, confirmed against `docs.x.ai`'s own current request examples (the model
    id genuinely contains a dot — `grok-4.5`, not `grok-4-5`, which 404s).
  - **Confirmed correct, no change needed:** Cerebras (`llama3.1-8b`), Mistral
    (`mistral-small-latest`), Z.ai (`glm-5.2`, `api.z.ai/api/paas/v4/chat/completions` —
    checked directly against `docs.z.ai` after a third-party aggregator suggested a
    different, incorrect path), and Cloudflare (`@cf/meta/llama-3.1-8b-instruct`) all
    matched current vendor docs exactly as previously implemented. Cloudflare's own
    changelog now recommends newer models (Llama 4, gpt-oss) for new integrations —
    noted as a future deliberate upgrade, not an emergency fix, since the current model
    isn't deprecated.
  - **Core routing/orchestration architecture audited, no changes needed:**
    `providerRegistry.ts`, `routingPolicy.ts`, `providerHealth.ts`,
    `providerOrchestrator.ts`, and `providerCapabilities.ts` were all read in full.
    Confirmed: provider-agnostic routing (task classification → capability scoring →
    health penalty → score), explicit user provider selection always wins and routing
    only reorders the rest of the chain, timeout + one retry on transient errors +
    automatic failover through the configured chain, session-scoped health tracking
    with decay, and honestly-labeled capability scores (comment explicitly says
    "documentation verified, not live verified — treat as priors, not measured
    performance"). No changes were needed here — this part of the architecture was
    already sound.
  - Updated `AI_PROVIDER_GUIDE.md`'s "Provider status" section to reflect this
    session's actual verification (previously it claimed `tsc -b`/`vite build` "both
    pass" from the prior session — left as-is since unverifiable now, but this
    session's own status is reported separately and honestly: source-verified only, no
    build run, no live calls).
  - **Verification level: SOURCE VERIFIED. Not BUILD VERIFIED** (no `node_modules`/
    network in this sandbox to run `tsc -b`/`vite build` — syntax/brace-balance checked
    manually instead) **and not LIVE VERIFIED** (no real API keys or egress to vendor
    APIs from this sandbox). A real build and one real chat request per provider in the
    deployed environment are the two things that would fully close this phase out.

- **Content-accuracy batch, 4 pages (2026-08-09).** Read each page's actual component
  logic before touching its article content, per the project's standing content rule.
  - `ResolutionCalculatorPage.tsx` (276\u2192621 words) \u2014 **found and fixed a real factual
    inaccuracy**: the old copy described the tool as accepting "pixel dimensions,
    PPI/DPI, or physical size" and solving for whichever weren't entered (a general
    bidirectional/DPI-input calculator). The actual component only takes pixel
    width/height and a print width in inches, and derives PPI and print height from
    those \u2014 it doesn't accept a DPI/PPI input at all, and there's no reverse-solve.
    Rewrote the intro/how-it-works/FAQs to describe the real one-directional behavior,
    and added the 50/100/150/200% scaling reference table as a described feature \u2014 it
    existed in the component but wasn't mentioned in the article at all.
  - `ScientificCalculatorPage.tsx` (253\u2192451 words) \u2014 found a stale claim: the FAQ said
    calculation history isn't saved "yet," implying a Notes feature was still unbuilt.
    Checked `productivityRegistry.ts` and confirmed the Notes tool already exists and
    ships today. Corrected the FAQ to point to it as an existing tool rather than a
    future one. Also verified division-by-zero and unmatched-parenthesis error
    behavior directly against `evaluateScientificExpression` before writing the
    mistakes/FAQ copy.
  - `GradientGeneratorPage.tsx` (227\u2192487 words) \u2014 the article never mentioned the
    Favorites feature (save up to 12 gradients to `localStorage`, click a swatch to
    re-copy its CSS) even though it's a real, working part of the page. Added it to
    how-it-works/examples/tips/FAQs. Also clarified that the angle slider doesn't apply
    to radial gradients (confirmed in the component: the slider is conditionally
    rendered only when `type !== 'radial'`).
  - `SemesterPlannerPage.tsx` (268\u2192484 words) \u2014 no factual errors found; the existing
    copy matched actual behavior (week regeneration reuses existing per-index week data
    via `plan.weeks[i]`, so this session's added claim that focuses/completion survive
    a regenerate as long as week numbers line up was verified against the actual
    `generateWeeks` logic before being added, not assumed).
  - **Verification method:** source-level only (read each component's actual
    state/props/logic before writing or editing article copy) plus a brace-balance
    check on the edited files (`{`/`}` counts match) since there's no `node_modules`
    in this environment and no network access to install dependencies, so `tsc`/`vite
    build` could not actually be run this session. **Mark this batch SOURCE VERIFIED,
    not BUILD VERIFIED** \u2014 a full typecheck/build should be run before treating it as
    fully clear.
  - **Honest scope note:** all four pages are meaningfully deeper and more accurate
    than before, but none reached the 800\u20131500-word target in one pass \u2014 consistent
    with how prior sessions' batches worked (typically doubling a page's length per
    pass rather than hitting the target in one edit). Continuing the same pages again
    for further depth is reasonable, but picking up new thin pages first is likely
    higher value.

- **Mobile audit — continued, 7 more real bugs found and fixed (2026-08-09, same
  session, second pass).** Same source-level caveat as above. This pass specifically
  followed the exact shape of the two bugs already found (unwrapped button group next
  to text/heading in a non-wrapping flex row) across the rest of the app rather than
  re-checking already-cleared files.
  - `SemesterPlannerPage.tsx` / `AssignmentTrackerPage.tsx`: identical progress-banner
    pattern (short text next to a fixed `w-40` progress bar, no wrap). Fixed —
    `flex-col sm:flex-row`, bar goes `w-full sm:w-40`.
  - `ExamCountdownPage.tsx` notification banner: text next to an "Enable" button, no
    wrap. Fixed — `flex-wrap` + `min-w-0` on the text block, `shrink-0` on the icons.
  - `OcrTextExtractionPage.tsx` **and** `PdfTextExtractPage.tsx` (identical
    copy-pasted pattern in both): a result-count `<p>` next to **three** unwrapped
    buttons (Copy / Download / Start over) — the highest-confidence overflow risk found
    this session, three buttons is a lot of forced width. Fixed both — `flex-wrap` on
    the outer row and the button row.
  - `PdfToImagePage.tsx`: same pattern, two buttons. Fixed the same way.
  - `ImageMetadataViewerPage.tsx`: filename + metadata text next to two buttons, and
    the filename itself had no `min-w-0`/`break-words` so a long filename could also
    push width out independent of the button row. Fixed both issues.
  - `ImageTransformWorkspace.tsx`: text next to one button — lower risk but fixed for
    consistency with the now-established pattern.
  - `SgpaCalculatorPage.tsx` / `CgpaCalculatorPage.tsx`: heading next to an "Add
    subject"/similar button, borderline width math at 320px. Added `flex-wrap` as a
    safety net.
  - Checked and confirmed fine, no change: `DpiCalculatorPage.tsx`,
    `ColorPickerPage.tsx`, `SocialMediaSizeGuidePage.tsx` list rows — short
    label/value pairs, same correct shape as `ChatSidebar`'s rows.
  - Grepped for the exact `h-1.5 w-40` progress-bar pattern and the `justify-between`
    pattern across `productivity`/`document`/`creator`/`academic` — the files fixed
    above were the only matches for the actual bug shape (text + unwrapped
    button(s)/fixed-width element with no `flex-wrap`). This is now a genuinely
    site-wide pass for *that specific pattern*, not a sample.
  - **Still not covered:** dialogs/forms/tables not matching this specific
    text-next-to-control shape (e.g. multi-field forms, data tables) weren't
    separately audited for other mobile issues (column overflow, touch target size,
    etc.) — that's a different check than what this pass targeted.
- **Security re-audit (Phase 17), same session.** Re-ran the secret-exposure checks
  independently of the prior session's report rather than trusting it blindly: grepped
  for `VITE_*_KEY/SECRET/TOKEN` (only hit is `VITE_OPENROUTER_API_KEY`, which is a
  documented, intentional client-side-key architecture per OpenRouter's own docs, not a
  leak), grepped for `process.env.` reads anywhere under `src/` (zero matches — nothing
  outside `api/`), grepped for hardcoded key-shaped strings (`sk-`, `AIza`, etc. — zero
  matches), confirmed no `.env.local` file exists, confirmed `.env.example` has only
  empty placeholder values. **Result: clean, same conclusion as the prior session's
  audit, independently re-verified rather than assumed.**

- **Mobile audit — two real overflow bugs found and fixed (2026-08-09, this session).**
  No network/browser-rendering tool in this environment, so this is a source-level audit
  (reading Tailwind classes and reasoning about flex behavior at 320–375px), not a visual
  one — flag for real device testing before fully trusting it.
  - `AiSettingsPage.tsx` reset-confirmation row (`SoftCard` with a sentence + two
    `shrink-0` buttons, no `flex-wrap`): at ~200px available content width, buttons
    refusing to shrink forces the paragraph into a very narrow wrapped column. Fixed —
    `flex-col sm:flex-row` + `min-w-0` on the paragraph.
  - `OnboardingTour.tsx` final-slide footer: "Skip" + "View Dashboard" (with icon) +
    "Finish" — three buttons, no `flex-wrap`, none of which wrap their own text
    (`Button` has no `whitespace-nowrap` but also no width constraint forcing it to), so
    at 320–360px they can genuinely exceed the dialog's content width. Fixed — added
    `flex-wrap` to the row and `flex-wrap justify-end` to the button group so it degrades
    to two lines instead of overflowing.
  - Checked and confirmed **fine, no change needed**: `ChatSidebar.tsx` (title has
    `min-w-0 flex-1 truncate`, action icons are `shrink-0` — correct pattern),
    `AiAssistantPage.tsx` mobile drawer header, `DashboardPage.tsx` 35-day heatmap
    (`min-w-0` parent + scoped `overflow-x-auto` on the grid only — legitimate horizontal
    scroll per the project's own rule, not the header-bug pattern), the shared
    `ConfirmDialog.tsx` (full-width mobile sheet, stacked title/description, simple
    two-button `justify-end` footer — this is the *correct* reference pattern; only 1
    caller in the whole app uses it though, see note below), `StudyPlannerPage.tsx` exam
    form row (`flex-wrap` already present).
  - **Lower-confidence, not touched — STALE, see 2026-08-09 "lower-confidence banner
    items resolved" entry under Done, which found these already fixed and closed out
    the wider `justify-between` scan.** several `SoftCard` banners with a `<p>`/text block
    next to a fixed-width element and no `flex-wrap` — e.g. `SemesterPlannerPage.tsx`
    and `AssignmentTrackerPage.tsx` progress banners (text next to a `w-40` progress
    bar), `ExamCountdownPage.tsx` notification banner (text next to an "Enable" button).
    Text in a `<p>`/`<div>` without `whitespace-nowrap` wraps by default, so these likely
    degrade to a cramped/squeezed layout rather than true page-level horizontal scroll —
    a real visual bug worth fixing, but a different (lower) severity than the two above,
    and I didn't want to hand-edit ~10 files on source-level reasoning alone without
    being able to see the result. Listed in Backlog below as a grouped follow-up.
  - **Not covered this pass:** the ~25-file surface across `productivity`, `document`,
    `creator`, and `academic` pages that use `justify-between` wasn't individually opened
    beyond the confirm-dialog-shaped subset above — genuinely unaudited, not silently
    passed.
  - **Side finding, not a bug, worth a product decision:** `ConfirmDialog.tsx` (the
    shared, correctly-built confirmation component) has only one caller in the entire
    app. Worth checking whether destructive actions elsewhere (delete note, delete
    assignment, clear habit history, etc.) use their own inline confirm, a browser
    `confirm()`, or no confirmation at all — out of scope to fix blind this session.

## Backlog (roughly priority order)

1. **Add the four `VITE_*_ENABLED` flags in Vercel** — `VITE_GROK_ENABLED`,
   `VITE_ZAI_ENABLED`, `VITE_CLOUDFLARE_ENABLED`, `VITE_POLLINATIONS_ENABLED`. This is a
   Vercel dashboard action, not a code change — `.env.example` already documents all four
   flags correctly (verified 2026-08-09). Without setting these in the actual deployment,
   the new providers/capability exist in code but won't show as available, even though
   their secret keys are already configured.
2. **Live-verify the four new providers/capability** — the first real test needs to
   happen in the actual deployed environment (this sandbox can't reach any of these
   vendor domains). If any adapter's endpoint/shape has drifted from what was verified
   via docs this session, expect a real fix to be needed here.
3. ~~Capability-based provider routing (Phase B) — not yet started.~~ **STALE — this was
   completed in a later session than this backlog item was written.** Corrected
   2026-08-09: `routingPolicy.ts` + `taskClassification.ts` + `providerCapabilities.ts`
   + `providerHealth.ts` all exist and are genuinely wired into
   `providerRegistry.getRoutedFallbackChain` (confirmed by reading the actual import and
   call site, not assumed from the "Done" section above). See the "Capability-based
   routing (Phase B) — now built" entry under Done for detail. Leaving this struck-through
   rather than deleted so future sessions don't get confused by git history alone.

A large multi-phase roadmap (Dashboard evolution, AI experience, retention, performance,
premium architecture, accessibility, micro-UX polish) was proposed in this session.
Given the scope, sessions should tackle it one real, verified task at a time rather than
attempting all phases at once — audit each phase for what's already implemented before
building anything new, exactly as done for phases already closed out above.

1. **Phase A — Dashboard evolution.** Audit first: many of the listed items (recent
   tools, recent AI, achievements, streak, upcoming deadlines, weekly progress) already
   exist on `DashboardPage`. Check what's genuinely missing (e.g. "today's study
   overview" as a single glanceable summary, "motivation card" beyond the existing quote
   widget) before adding anything.
2. **Phase B — AI experience.** Audit first: markdown/code/table rendering, pinning,
   conversation export (Markdown already supported — check PDF), mobile/desktop layout
   already look mature from earlier sessions' work. Look for genuine gaps like
   "suggested follow-up questions" or "AI quick actions," not a rewrite.
   - ~~Sub-item: "regenerate with different wording."~~ **Done (2026-08-09).** Chose the
     lowest-risk option: `retryLast()` now sends with a temperature bumped by +0.3
     (clamped to the existing 1.5 max), only for that one retry — not written to
     `settings`/`localStorage`, no visible instruction added to the conversation. Picked
     over silently appending a "rephrase this" instruction because that would live
     inside the actual message history sent to the provider and risks the model
     commenting on it; picked over a user-visible label because there's nothing
     meaningfully different to show the user about *how* it's varying.
     **Source-verified only** (no `tsc -b`/`vite build` this session — see top note).
3. **Phase C — Retention.** Overlaps heavily with Phase A/existing achievements system —
   audit for genuine gaps (e.g. a "daily study goal" concept) rather than duplicating
   what streak/XP/achievements already cover.
4. **Phase D — Performance.** The one large chunk was already investigated and found to
   be a non-issue (see Engineering Decisions, 2026-08-06). Re-check whether there's a
   *real* measurable win before doing speculative code-splitting work.
5. **Phase E — Premium architecture.** This is a product-shape decision, not a pure
   engineering task — needs input on what "Premium" actually gates before building a
   feature-flag system, to avoid guessing and building the wrong shape.
6. **Phase F — Accessibility.** Audit first; spot checks in past sessions (focus traps,
   ARIA labels, reduced-motion CSS) suggest this may already be in reasonable shape.
7. **Phase G — Micro UX polish.** Broadest and most subjective phase — best done
   page-by-page with concrete before/after screenshots rather than a blanket pass.
8. ~~AI provider routing layer — architecture clarified, not yet built.~~ **STALE — this
   was completed in a later session than this backlog item was written.** Corrected
   2026-08-09 (Phase 3): the described approach (`user request → task/capability
   classification → routing policy/config → provider adapter → response → automatic
   fallback`, all configuration-driven, no provider names hardcoded) is exactly what's
   now built and runtime-tested — see the "Phase 3 — Intelligent Task Routing" entry
   under Done. Leaving this struck-through rather than deleted for the same reason as
   items 3 and 10 below.
9. **Pollinations image generation — architecture clarified, not yet built.** Confirmed
   this should be a distinct "image-generation capability," not shoehorned into the
   text-provider `AIProvider` interface. Pollinations' public endpoint
   (`image.pollinations.ai/prompt/...`) needs no API key, but embedding an unauthenticated
   third-party call directly from client code has real product tradeoffs (uptime
   dependency, no rate-limit control, no content-moderation guarantee on ALLROUNDER
   HELPER's side) worth being explicit about before shipping, even though it's now
   technically unblocked to build.
10. ~~Voice mode — not started.~~ **Done this session** — see Done section
    ("Voice input — implemented"). Struck through rather than deleted for the same
    reason as the routing item above.
11. ~~AI Assistant prompt-settings panel polish — not yet started.~~ **Done, including
    mobile layout (closed 2026-08-09).** Saved confirmation (real, tied to actual
    auto-save) and system-prompt character counter both added. Explicit Save button
    deliberately NOT added — see Done entry for why. Reset already existed. The
    mobile-viewport pass flagged as still open here was completed this session — see
    "`AiSettingsPage.tsx` mobile-viewport pass" under Done: audited source-level at all
    grid/flex breakpoints, genuinely no overflow bugs found.
12. **Full mobile audit beyond the header — largely done for the "unwrapped
    control" bug pattern (2026-08-09).** Two passes this session found and fixed 9
    real instances of the same bug shape (text/heading next to buttons or a
    fixed-width element with no `flex-wrap`) across AI Assistant, Settings,
    onboarding, and productivity/document/academic tool pages — see both "Mobile
    audit" entries above for the full list. Still genuinely open:
    - Real device/browser visual testing of every fix (no rendering tool here).
    - Mobile issues *other* than this specific pattern — data tables, multi-field
      forms, touch target sizing, viewport-height/keyboard behavior — not covered by
      either pass.

## Removed from backlog (investigated, not a real issue)

- ~~Performance: reduce largest JS chunk (~664KB).~~ Confirmed this chunk belongs to
  Mermaid's own lazy diagram-type sub-chunks and is not on the initial-load path. See
  Engineering Decisions for the verification method, in case this needs re-checking
  after a Mermaid version bump.

## Phase 5 — Final Security Recheck (continuation session)

- [x] Cloudflare model-path regex — re-verified against actual JS regex semantics
  (no trailing-newline anchor bypass, no `%`/traversal chars in the allowed class). Clean.
- [x] `api/ai/gemini.ts` — **real bug found and fixed:** server-side fallback model
  default was still the retired `gemini-2.0-flash` (Phase 2 only updated the client-side
  default in `GeminiProvider.ts`). Now `gemini-3.5-flash` on both sides. See Engineering
  Decisions for why this was masked in normal UI usage but real for direct API callers.
- [x] `openai.ts`/`mistral.ts`/`xai.ts`/`cerebras.ts`/`zai.ts` — hardcoded literal
  upstream URLs, no request-controlled path segment. Clean.
- [x] `api/contact.ts` — re-verified email regex/length caps/HTML escaping. Clean
  (one non-issue noted: `name` isn't independently CRLF-filtered, but Resend's JSON API
  means this codebase never builds raw SMTP headers itself, so there's no injection
  surface under our control).
- [x] Full-tree secrets grep (API key shapes, PEM headers) — no matches.
  `.env.example` re-read in full — placeholders only. No `.env.local`/`node_modules`/
  `dist` present. `.gitignore` correct.
- [x] Build/lint/test — `npm ping` re-checked once (still 403). No `node_modules`
  present, so a local `tsc` run would only produce unresolved-module noise, not real
  type-check results — not run, to avoid a misleading "verified" claim.

## Phase 5 — Deep Performance Audit progress (continuation session)

- [x] `ContactPage.tsx` — error text now `role="alert"`, success panel now `role="status"`.
- [x] `NotesPage.tsx` / `TodoListPage.tsx` / `AssignmentTrackerPage.tsx` — search inputs
  given `aria-label` (were placeholder-only). Not yet folded into a subphase ZIP — see
  Engineering Decisions for why.
- [x] `providerRegistry.ts` — re-confirmed clean, no fix needed.
- [x] AI routing/orchestration/attachments/speech/image-generation — reviewed; one real
  fix (pending-attachment object URL leak on `AiAssistantPage` unmount), rest confirmed
  clean. See Engineering Decisions for detail.
- [x] Document tools object-URL spot-check (7 pages + shared `fileUtils`) — clean.
- [x] `useLocalStorage.ts` + Todo/Assignment draft-vs-persisted-state check — clean.
- [x] PWA config (`vite-plugin-pwa` registration) — clean at the source level; runtime
  caching/update behavior still needs BROWSER VERIFICATION.
- [x] OCR/QR/Barcode — reviewed. **Real fix:** `QrScannerPage.tsx`'s live-camera
  `scanLoop` was allocating a brand-new `<canvas>` on every `requestAnimationFrame` tick
  (up to 60/sec); now reuses one canvas via a ref. `OcrTextExtractionPage.tsx`,
  `QrGeneratorPage.tsx`, `BarcodeGeneratorPage.tsx` — clean.
- [ ] Remaining performance audit: academic calculators, remaining productivity tools,
  creator tools, dashboard/analytics rendering.
- [ ] Remaining mobile-safety review, full regression audit, final security recheck,
  build/lint/test attempt, final Phase 5 packaging — not yet started this session.

## Notes for future sessions

- Don't re-run the "which tool pages lack SEO content" grep the naive way — match on
  `article={article}` / `article: {`, not on the literal string `ToolArticle`, or
  you'll get false positives (this happened once — see git history / prior session).
- Never fabricate testimonials, usage stats, or thinking-stage copy — this app is
  intentionally honest about being a single-provider, client-only tool with no backend
  analytics. Retention features should stay grounded in real local data.

## Phase 5 — Final Mobile-Safety + Regression + Release Gate (2026-08-10, release-gate session)

- [x] Final mobile-safety pass: audited all remaining `truncate` usages app-wide
  against the actual `min-w-0`/flex-shrink mechanism (not a blind grep). 11 genuine
  overflow bugs found and fixed across `ResultActionBar.tsx`, `CalendarPage.tsx` (×2),
  `FocusModePage.tsx`, `WeeklyPlannerPage.tsx`, `NotesPage.tsx`, `DashboardPage.tsx`
  (×5). See Engineering Decisions for the root-cause explanation and full file list.
- [x] Document Tools "validation error missing `role=alert`" item (left open from the
  2026-08-10 session, `ImageToPdfPage.tsx`/`MergePdfPage.tsx`/`QrGeneratorPage.tsx`/
  `QrScannerPage.tsx`) — re-verified against source. `QrGeneratorPage.tsx` and
  `QrScannerPage.tsx` already had `role="alert"` on their inline error text.
  `ImageToPdfPage.tsx` and `MergePdfPage.tsx` route their error state through the
  shared `ProcessingIndicator`, which already wraps its message in
  `role="status" aria-live="polite"`. All four confirmed clean — no fix needed. This
  closes the item flagged as genuinely open in the prior session.
- [x] Regression spot-check on the three highest-risk fixes from the prior session
  (Gemini fallback model, QR scanner canvas reuse, AI attachment URL cleanup) —
  all confirmed still correct, unregressed.
- [x] Final security/cleanliness sweep — re-confirmed no secrets, correct
  `.gitignore`, `.env.example` placeholders only, no `node_modules`/`dist`/
  `.env.local` present.
- [x] Build/lint/test re-attempted — npm registry still returns 403, no
  `node_modules` present. Honestly documented as environment-blocked rather than
  fabricated.
- [x] Documentation reconciled across `PROJECT_BACKLOG.md`, `ENGINEERING_DECISIONS.md`,
  `FINAL_AUDIT_REPORT.md`.
- [x] Final Phase 5 release ZIP packaged and inspected.

**Phase 5 status: COMPLETE**, with the following gates explicitly and honestly
recorded as environment-blocked rather than passed: build verification, lint
verification, test verification, and full visual/browser/device confirmation of every
accessibility and mobile fix made across all Phase 5 sessions. Everything else is
SOURCE VERIFIED.

## Phase 6 — Content Depth + 🔥 AI Animation + Category Pages (2026-08-16, in progress, this session had working npm registry access)

**Corrected finding vs. the master instructions' assumption:** individual tool pages
(all 14 academic, all document/creator/productivity pages) already have solid,
distinct 200–1,200 word articles wired through `ToolArticle`/`CalculatorLayout`
(SOURCE VERIFIED via word-count scan across all 98 page files — see
`/tmp` scan method: regex-extract the `const article = {...}` object per file,
count words in quoted strings). The real gap was category/index pages and the
homepage, which had zero educational content — just tool grids. Phases below were
re-scoped to fix the actual gap rather than mechanically re-writing already-strong
tool articles.

Completed this session (BUILD VERIFIED — `npm install && npm run build` succeeded,
exit 0, twice, after each batch of changes):

- [x] 🔥 AI Assistant flame animation: replaced the placeholder `flame-pulse-glow`
  with a layered CSS system (`ai-flame-wrap`/`ai-flame-aura`/`ai-flame-spark`) in
  `src/index.css`, wired around the AI icon in `AiAssistantPage.tsx` header. Pure
  CSS/DOM (conic-gradient aura + radial core pulse + 3 rising spark elements), no
  canvas/particle engine. Respects both `.reduce-motion` (existing preferences
  system) and `@media (prefers-reduced-motion: reduce)` by disabling animation and
  keeping a static glow. SOURCE VERIFIED, BUILD VERIFIED. Not yet BROWSER VERIFIED
  (no browser available in this environment).
- [x] Fixed a genuine pre-existing TS build error in `AttachmentBar.tsx`
  (`AlertCircle` icon was given a `title` prop, which `LucideProps` doesn't accept).
  Wrapped the icon in a `<span title=...>` to preserve the native tooltip and kept
  `aria-label` on the icon itself. Minimal, scoped fix. BUILD VERIFIED.
- [x] Added genuine, original, non-templated content + FAQ (with `faqJsonLd` schema)
  to four previously-empty index/landing pages, each written specifically for that
  category rather than reused paragraphs:
  - `src/pages/AcademicToolsPage.tsx`
  - `src/features/productivity/pages/ProductivityIndexPage.tsx` (also fixed a real
    copy bug here: header claimed "Eight tools" when there are actually 16 — now
    reads `{productivityTools.length}` dynamically instead of a hardcoded number)
  - `src/features/document/pages/DocumentToolsIndexPage.tsx` (verified the existing
    "processed locally, never uploaded" claim against source before keeping it —
    grepped all document-tool pages for `fetch`/`upload`/`FormData`; confirmed true)
  - `src/features/creator/pages/CreatorToolsIndexPage.tsx`
  - `src/pages/HomePage.tsx` — added a "why this exists" section + FAQ, placed
    *after* the hero/AI-assistant/category/featured-tools blocks per the UX
    ordering rule (tools must stay immediately reachable, long-form content goes
    last).
- [x] Regression-checked the three highest-risk Phase 5 items against current
  source (not against old reports): Gemini fallback (`gemini-3.5-flash`, confirmed
  in `api/ai/gemini.ts:36`), QR scanner canvas reuse (`scanCanvasRef` persists
  across animation frames in `QrScannerPage.tsx`; the second `document.createElement
  ('canvas')` in that file is a one-shot canvas for single-image upload handling,
  not a per-frame allocation — not a regression), and AI attachment blob-URL
  cleanup (`pendingAttachmentsRef` + `URL.revokeObjectURL` pattern intact in
  `AiAssistantPage.tsx`). All three: SOURCE VERIFIED, unregressed.
- [x] Checked `public/ads.txt` — already contains the exact required line
  (`google.com, pub-5736847555362725, DIRECT, f08c47fec0942fa0`). SOURCE VERIFIED,
  no change needed.
- [x] Checked `public/robots.txt` and sitemap reference — present and correct.
  SOURCE VERIFIED.
- [x] Checked all four legal pages (`PrivacyPolicyPage.tsx`, `TermsPage.tsx`,
  `DisclaimerPage.tsx`, `CookiePolicyPage.tsx`) plus `AboutPage.tsx` — these are
  short but complete, clear, and factually accurate (e.g. Privacy Policy correctly
  describes local-only calculator data, browser-stored productivity data, AdSense/
  Analytics cookie use). Per the master instructions' own rule ("do NOT artificially
  inflate legal pages to hit a word count"), left these unchanged. SOURCE VERIFIED
  as adequate, not rewritten.

**Explicitly NOT done yet in this session (genuine remaining work, not hidden):**

- Phase 0's full per-route inventory table (route / content status / word count /
  SEO status / a11y status / mobile status) has not been written out as a
  standalone document — only captured informally via the word-count scan above.
- No individual tool-page articles were rewritten this session, because the audit
  found them already adequate — if a future session wants to spot-check individual
  tool articles for genuine weakness (not just word count) rather than trusting this
  session's scan, that is still open.
- Phase 7 (full per-route SEO audit: titles/descriptions/canonicals/heading
  hierarchy one-by-one across all 78 routes) not yet done — only the index pages
  and homepage were touched.
- Phase 9/10/11 (full fresh accessibility/performance/security regression sweep
  across the *entire* app, not just the three named Phase-5 hotspots) not yet
  re-run in full this session.
- Phase 13 (final per-route inventory table) not written.
- No BROWSER VERIFIED or RUNTIME VERIFIED testing was performed — this environment
  has no browser. All verification this session is SOURCE VERIFIED + BUILD VERIFIED
  only.
- Per the master instructions, **no ZIP has been created this session** — work
  continues from this checkpoint. The final `allrounder-helper-FINAL-PRODUCTION.zip`
  will only be produced once the phases above are genuinely complete.

**Phase 6 status: IN PROGRESS. Checkpoint saved. Continue from "Explicitly NOT done
yet" list above in the next session.**

## Phase 1 — Complete Content Inventory & Gap Analysis (2026-08-16, continuation session)

Ran a corrected, full-repo scan (regex-extracted every `const article = {...}`
object per page file, counted words in quoted strings — see method note below)
across all 80 page files under `src/pages/**` and `src/features/**/pages/*`.

**Classification (A=Strong, B=Medium, C=Thin, D=Utility-only/intentionally concise,
E=Legal/trust):**

**A — Strong (leave alone, do not rewrite for word count):**
All 14 academic calculator pages (300–520 words + FAQ, e.g. `CgpaCalculatorPage`
447, `SgpaCalculatorPage` 519, `ScientificCalculatorPage` 515) — genuinely distinct,
formula-specific, source-verified via manual spot read of 3 of them.
All 16 productivity pages (370–1,200 words + FAQ) — `CalendarPage` (1,173) and
`FocusModePage` (1,198) are the deepest, appropriately so given their scope.
Most document tool pages (300–520 words + FAQ): Merge/Split/Compress/Rotate/
Rearrange/Delete/Extract PDF, OCR, PDF-to-Image, PDF-to-Text, QR Generator/Scanner,
Barcode Generator, Word-to-PDF, Image-to-PDF, Image Cropper, Image Metadata Viewer.
All 8 creator tool pages (340–680 words + FAQ).
The 5 index pages fixed last session (Academic/Productivity/Document/Creator +
Homepage) — now have genuine category-specific guidance + FAQ, not filler.

**B — Medium (adequate but the shortest in their category; genuine candidates for
a future light expansion, not urgent):**
`ImageResizerPage.tsx`, `ImageCompressorPage.tsx`, `ImageFormatConverterPage.tsx`,
`JpgPngConverterPage.tsx`, `WebpConverterPage.tsx` — each ~200–260 words (my first
scan pass mis-parsed these as near-zero due to a regex bug matching the wrong
closing brace; manually re-read all five in full — they are real, accurate,
useful, just the most concise of the document-tool set, appropriate for how
simple these particular conversions are to explain). No action needed now;
flagged as B not C.

**C — Thin (none found this pass on live content pages).** Nothing that needs
1,000+ words was found actually missing it and unaddressed after last session's
index-page work.

**D — Utility-only / intentionally concise (correct as-is, verified):**
`/dashboard`, `/settings`, `/analytics` — all three carry `Seo ... noindex`
(SOURCE VERIFIED, checked directly), correctly excluded from public
content-depth expectations since they're personal/private views, not
search-indexable landing pages.
`/offline`, `/404` (`NotFoundPage.tsx`) — correctly minimal, standard practice.
`ComingSoonCategoryPage`-based routes (`/blog`, `/finance-tools`) — correctly
short placeholder pages that honestly disclose "coming soon" rather than
faking depth for a category with no live tools yet. Left unchanged.
AI Assistant (`/ai-assistant`) and Settings (`/ai-assistant/settings`) — the
chat page is inherently an app UI, not an article page; it does not use the
`ToolArticle` pattern by design. Not yet audited for the "capabilities /
prompting / limitations / responsible use" educational content called for in
the master brief — this is a **real remaining gap**, tracked below as
next-highest priority.

**E — Legal/trust (verified complete & accurate last session, unchanged):**
`PrivacyPolicyPage`, `TermsPage`, `DisclaimerPage`, `CookiePolicyPage` — all
short, complete, factually accurate, correctly NOT inflated.

**Genuine bug found and fixed this session:** `AboutPage.tsx` claimed
"Productivity, Document Tools, Creator Tools, and Finance Tools are in active
development" — factually false; all three are fully live (16/24/9 tools
respectively per route inventory), only Finance Tools is actually pending.
This is exactly the kind of misleading claim the AdSense/trust review would
flag. Fixed to state the accurate current status. SOURCE VERIFIED, BUILD
VERIFIED.

**Content architecture conclusion:** the existing `ToolArticle` +
`CalculatorLayout`/`ImageTransformWorkspace`/`PdfPageWorkspace` pattern
(structured `article` object per page, rendered through one shared component)
is already the right architecture and is working well — no need for a new CMS
layer. It scales fine; the earlier assessment that content was systemically
thin was wrong. The real, now largely-closed gap was category-index pages,
which don't use `ToolArticle` (they're grids, not single-tool pages) and
needed their own bespoke but analogous treatment — which is what was applied
last session.

**Remaining highest-value gaps, in priority order for Phase 2 onward:**
1. AI Assistant page: add the capabilities/prompting/limitations educational
   content called for in the brief (not yet done — real gap, D-classified above
   only because it's an app UI, not because content is unnecessary).
2. Full per-route SEO metadata audit (title/description/canonical/heading
   hierarchy) — not yet done route-by-route, only spot-checked.
3. Full accessibility/performance/security regression sweep beyond the three
   named Phase-5 hotspots.
4. `ContactPage.tsx` not yet reviewed for accuracy/completeness this session.

**Method note (for future sessions):** don't trust a naive regex word-count
scan at face value — it under-counted 5 real pages due to brace-matching
issues. Always manually spot-read anything the script flags as near-zero
before concluding a page is actually thin.

No ZIP created this session, per packaging rule. BUILD VERIFIED after the
AboutPage fix (`npm run build`, exit 0).

## Phase 2 — Highest-Priority Gap Closure, started same session (2026-08-16)

- [x] AI Assistant page (`AiAssistantPage.tsx`) content expanded via the existing
  `PageInfoSection` (about/tips/faqs/related), sourced only from verified
  implementation details — not invented: read `chatModes.ts` to accurately
  describe the 7 real chat modes (General/Study/Coding/Social/Content
  Creator/Resume/Career) and `AttachmentBar.tsx` to confirm the exact
  supported attachment file types (.png/.jpg/.jpeg/.webp/.pdf/.txt/.md/.docx)
  before writing about them. Added a responsible-use FAQ entry ("should I
  trust the assistant's answers for graded work?") per the brief's
  requirement to explain limitations and encourage verification, without
  making unsupported capability claims. SOURCE VERIFIED, BUILD VERIFIED.
- [x] `ContactPage.tsx` reviewed — genuinely fine as-is (working form, accurate
  copy, no misleading claims found). No change needed.

**Remaining priorities for next session, in order:**
1. Full per-route SEO metadata audit (title/description/canonical/heading
   hierarchy) — not yet done route-by-route.
2. Full accessibility/performance/security regression sweep beyond the three
   named Phase-5 hotspots (Gemini fallback / QR canvas / AI attachment
   cleanup), which were already re-verified.
3. Internal-linking audit per the master brief's suggested link chains
   (CGPA→SGPA→GPA-to-Percentage→Semester Percentage, etc.) — not yet
   systematically checked across all pages, only the `related` links added
   to index pages/AI Assistant this session.
4. Final Phase 13-style per-route inventory table (not yet formally written,
   though the Phase 1 inventory above covers the same ground narratively).

No ZIP created — per packaging rule, the single final
`allrounder-helper-FINAL-ADSENSE-READY.zip` is only produced once all phases are
genuinely complete. BUILD VERIFIED after this batch (`npm run build`, exit 0).

## FINAL RELEASE SESSION — Phases 2–11 (2026-08-16)

All phases from the master execution plan completed and SOURCE VERIFIED /
BUILD VERIFIED as follows. No BROWSER VERIFIED or RUNTIME VERIFIED claims are
made anywhere — this sandbox has no browser, so all UI/visual/interaction
confirmation is NOT VERIFIED — ENVIRONMENT LIMITATION.

**Phase 2 — AI Assistant content: COMPLETE.** Expanded via `PageInfoSection`
in prior session — chat modes, attachment types, and prompting guidance all
sourced from actual implementation (`chatModes.ts`, `AttachmentBar.tsx`), plus
a responsible-use FAQ entry. No unsupported capability/accuracy/privacy claims.

**Phase 3 — Full SEO audit: COMPLETE.**
- Duplicate title/description scan across all 80 page files: zero true
  duplicates (one false positive from an `EmptyState` "Nothing planned" string,
  confirmed by direct inspection, not an SEO field).
- `Seo` component (single shared source for every page) confirmed to always
  emit: unique `<title>`, meta description, canonical link, OG tags, Twitter
  card, and conditionally `robots noindex` — so canonical/OG/robots correctness
  is structurally guaranteed rather than needing 80 manual checks.
- H1 audit: zero files with more than one `<h1>`; H1 is rendered centrally by
  `CalculatorLayout`/`StaticPageLayout` from a required `toolName`/`title` prop,
  so every page has exactly one, always distinct.
- Sitemap vs. route audit: every public route present in `sitemap.xml`; the
  only routes absent (`/dashboard`, `/settings`, `/ai-assistant/settings`,
  `/analytics`, the `*` catch-all) are exactly the ones correctly marked
  `noindex` in source — confirmed intentional, not an oversight.

**Phase 4 — Internal linking audit: COMPLETE**, 5 real gaps found and fixed:
- `GpaToPercentagePage.tsx` ↔ `SemesterPercentagePage.tsx` now cross-link
  (previously each linked to CGPA/Percentage but not each other).
- `AttendanceCalculatorPage.tsx` now links to Study Planner and Exam Countdown
  (previously only linked within Academic Tools) — closes the exact chain the
  brief named.
- `NotesPage.tsx` ↔ `OcrTextExtractionPage.tsx` now cross-link — closes the
  "PDF tools ↔ OCR ↔ Notes" chain the brief named.
- Verified already-correct (no changes needed): CGPA↔SGPA↔GPA-to-Percentage
  chain, Pomodoro↔FocusMode↔StudyPlanner↔HabitTracker chain, PDF tool
  cluster (Merge/Split/Extract), Creator sizing cluster
  (AspectRatio↔DPI↔Resolution↔SocialMediaSizeGuide).
All links added were genuinely useful cross-references a student would want,
not link-farming — each addition is 1–2 links, not dozens.

**Phase 5 — Trust/content accuracy audit: COMPLETE.** Grepped the full
`src/pages` + `src/features` tree for superlative/fake-claim patterns
(thousands/millions of users, "best AI", "#1", guarantees, testimonials,
"trusted by", rating claims). Zero genuine hits — every match was a false
positive (the word "generated" describing real generated content like QR
codes/images, not a claim about scale or authority). Spot-verified the one
borderline claim found in Phase 1 (`AnalyticsPage.tsx`: "nothing here is
estimated") against its actual computation (`useMemo`/`reduce` over real local
activity data, not a placeholder) — accurate as written. AboutPage inaccuracy
from the prior session remains fixed and unregressed.

**Phase 6 — Content depth gap re-check: COMPLETE, no changes made.** Per your
explicit instruction not to mass-rewrite A-tier pages: re-confirmed the Phase 1
classification stands. No B-tier page was expanded this session because none
showed a genuine information gap beyond being concise — they remain accurate
and complete for what their tool actually does (five simple image-format
tools: resize/compress/format-convert/JPG-PNG/WebP). No C-tier pages exist.
D/E-tier pages left untouched, correctly.

**Phase 7 — AI flame animation final check: COMPLETE, no changes needed.**
Re-read `ai-flame-aura`/`ai-flame-core`/`ai-flame-spark` in `src/index.css` and
their usage in `AiAssistantPage.tsx` header. Confirmed: flame-shaped conic
aura + inner glow pulse + 3 upward rising sparks (not waves/ripples/rings),
matches the electric/violet/emerald brand gradient, wrapped only around the
existing AI icon (no full-background effect), `pointer-events: none` on all
decorative layers (verified — doesn't intercept clicks), and both
`.reduce-motion` and `@media (prefers-reduced-motion: reduce)` disable all
animation and fall back to a static glow. Matches the brief's requirement
exactly; left unchanged.

**Phase 8 — Full regression: COMPLETE**, all 10 named items re-checked against
current source (not documentation) this session:
1. Gemini fallback = `gemini-3.5-flash` — confirmed, `api/ai/gemini.ts:36`.
2. Gemini model-path validation — confirmed anchored:
   `^[a-zA-Z0-9.\-]{1,100}$` regex + `encodeURIComponent`, rejects path
   injection, applied before the value is interpolated into the upstream URL.
3. AI pending-attachment object URLs cleaned up via a ref-backed
   `useEffect` cleanup (`URL.revokeObjectURL` over `pendingAttachmentsRef`) —
   confirmed intact.
4. QR scanner reuses `scanCanvasRef` across animation frames — confirmed; the
   second `document.createElement('canvas')` in that file is a one-shot
   canvas for single-image upload handling, not a per-frame allocation (this
   was already correctly distinguished in the prior session).
5. Mobile `min-w-0` fixes — spot-checked `ResultActionBar`, `CalendarPage`,
   `FocusModePage`, `WeeklyPlannerPage`, `NotesPage`, `DashboardPage` still
   present; full grep sweep not re-run this pass (low risk — nothing touched
   these files this session).
6. FocusMode timeout/interval cleanup — confirmed `clearInterval` present.
7. `AttachmentBar.tsx` no longer passes `title` directly to a Lucide icon —
   confirmed (fixed two sessions ago, wrapped in `<span title=...>`).
8–9. Accessibility/security fixes — no files touched this session removed any
   `aria-*`/`role=`/validation logic; all edits were additive (new content,
   new links) or one-line fixes (AboutPage copy).
10. Performance fixes — no new timers, intervals, canvases, or object URLs
   were introduced this session; all changes were static JSX/data.

**Phase 9 — Security: COMPLETE, no issues found.**
- Secrets scan (API key patterns, hardcoded tokens) across `src`/`api`/`public`:
  zero hits outside `process.env`/`import.meta.env` references.
- `.env.example` contains placeholder-only entries (empty values), confirmed.
- `.gitignore` correctly excludes `node_modules`, `dist`, `dist-ssr`, `.env`,
  `.env.local`.
- `api/contact.ts` re-read in full: type allowlist, 200/320/5000-char length
  caps, email regex validation, `escapeHtml` on user input before it reaches
  the outgoing email body, 10s abort timeout — all present and correct.
- `api/ai/gemini.ts` re-read in full: server-only API key, anchored model-name
  validation before URL interpolation, 55s abort timeout — all present.
- `public/ads.txt` contains the exact required line, confirmed again.
- `public/robots.txt` and sitemap reference confirmed correct again.

**Phase 10 — Build/quality verification: COMPLETE.**
`npm install` and `npm run build` both run and succeeded (exit 0) after every
batch of changes this session (5 separate successful build runs across Phases
2–9). No lint or test scripts are configured in `package.json` beyond the
build's own `tsc -b` type-check step, which passed with zero errors. No
BROWSER VERIFIED or RUNTIME VERIFIED claims made — this environment has no
browser; that remains NOT VERIFIED — ENVIRONMENT LIMITATION, same as every
prior session.

**Phase 11 — Final documentation: this section.** `PROJECT_BACKLOG.md` now
reflects the actual final state above. `ENGINEERING_DECISIONS.md` and
`FINAL_AUDIT_REPORT.md` updated to match (see those files) — stale claims from
before the Phase 1 correction (e.g. any earlier assumption that tool pages
were systemically thin) have been corrected there rather than left standing.

## FINAL ZIP

All phases 2–11 above are genuinely complete to the limits of this sandboxed
environment (no browser = no BROWSER/RUNTIME verification possible; everything
else is SOURCE VERIFIED and/or BUILD VERIFIED). Per the release condition,
producing the one final ZIP now: `allrounder-helper-FINAL-ADSENSE-READY.zip`.
Pre-package checklist (all confirmed before zipping): `npm run build` exit 0
against this exact final tree; no `node_modules`/`dist`/`.env.local`/secrets
included; `package.json`, `src/`, `api/`, `public/` at root, no nested project
folder; extracted copy inspected post-zip to confirm structure and spot-check
the flame CSS, Gemini fallback string, and `ads.txt` are present in the
extracted files.

## Phase 7 — AI Identity, Website Knowledge, Language Fix, Provider Consistency (2026-08-16)

New file `src/features/ai/logic/siteKnowledge.ts` generates an ALLROUNDER
HELPER identity + live tool catalog + language-matching instruction, built
from the existing `academicTools`/`productivityTools`/`documentTools`/
`creatorTools` registries (no hardcoded duplicate tool list — stays in sync
automatically). `promptBuilder.ts` now always prepends this block ahead of the
chat-mode or user-customized system prompt, for every provider, since all
providers share one message-building call site. This fixes the root cause of
the reported mixed-language issue: no system prompt previously ever instructed
any model to match the user's language, and selecting a chat mode fully
replaced the system prompt, dropping platform identity entirely.

Chat layout (user right / AI left) and the 🔥 flame animation were both
re-verified against source this session: already correct, unchanged.

Full detail and file list: see `FINAL_AUDIT_REPORT.md` Phase 7 entry.

Verification: SOURCE VERIFIED + BUILD VERIFIED. Actual model output with the
new prompt is NOT VERIFIED — ENVIRONMENT LIMITATION (no connected provider, no
browser, in this sandbox).

Final consolidated release ZIP (updated to include this phase):
`allrounder-helper-FINAL-ADSENSE-READY.zip`.





## Session — 2026-08-17 (continued) — AI character integration

**Licensing note:** an earlier upload in this session (a green-screen MP4) carried a
visible stock-marketplace preview watermark and was NOT used. The user then supplied a
proper asset set (`allrounder-helper-ai-mascot-assets.zip` + individual PNGs) with no
watermarks, 512x512 transparent PNGs, confirmed as newly generated rather than a stock
preview. Only this clean asset set was integrated.

**Character integration:**
- Added `src/assets/ai-character/allrounder-ai-avatar.png` (+ optimized 96px/192px WebP
  variants, 3.4KB/8.8KB) to the project's existing asset architecture.
- `ChatMessageBubble.tsx`: AI message avatar now renders the actual character image
  instead of a generic Sparkles icon. Layout unchanged — AI stays LEFT, user stays RIGHT
  (this was already correct, verified not regressed). Avatar gets a subtle pulse
  (`animate-flame-glow`, reusing the existing keyframe rather than adding a new one)
  only while `message.isStreaming` is true — tied to real state, not a timer.
- `AiAssistantPage.tsx` header: replaced the Sparkles icon inside the existing
  `.ai-flame-wrap`/`.ai-flame-aura`/`.ai-flame-spark` system (built in a prior session)
  with the character image. The aura/spark elements now only render while
  `isGenerating || isThinking` is true, instead of animating constantly — so the
  power-up effect is now genuinely state-driven rather than decorative-always-on.
- No changes to the flame CSS itself — the existing `prefers-reduced-motion` and
  `.reduce-motion` handling (verified present at both the global catch-all and the
  flame-specific level) applies unchanged to the reused classes.
- Empty-state problem-first starter chips ("I have exams coming up...") were already
  implemented in `promptLibrary.ts` from a prior session — confirmed present, not
  rebuilt.
- AI identity/site-knowledge/provider/retry architecture: untouched.

**Not verified:** no browser/rendering environment available in this session, so the
visual result (avatar positioning, animation timing) was verified by code + successful
production build + confirming the asset is present in `dist/assets/`, not by an actual
screenshot/interaction test. Flagging this explicitly rather than claiming a visual
check that didn't happen.

Build: PASS. Lint: PASS (0 errors, same 6 pre-existing warnings).

**Files changed:** `src/assets/ai-character/*` (new), `src/features/ai/components/ChatMessageBubble.tsx`,
`src/features/ai/pages/AiAssistantPage.tsx`.

## Session — 2026-08-17 (continued) — Regression fix + character power-up motion

**Genuine regression found and root-caused:** the previous session's `noindex`/sitemap
fix for `/blog` and `/finance-tools` had been silently reverted. Cause: that session ran
`unzip -oq` against the *uploaded* zip (the user's original copy from an earlier message)
into the working tree, which overwrote the already-fixed `ComingSoonCategoryPage.tsx`
and `sitemap.xml` with their pre-fix versions. The character-asset files survived only
because they weren't present in that older archive to overwrite. Re-applied both fixes
and confirmed by direct grep (not by trusting prior docs): `noindex` prop present on
`ComingSoonCategoryPage.tsx`'s `<Seo>` call, `sitemap.xml` at 71 URLs with neither route
present. Going forward this working tree is treated as authoritative; uploaded zips are
not re-extracted over it.

**Character power-up motion (previously missing):** added `.ai-character-avatar` /
`.ai-character-avatar-active` to `index.css` — a GPU-friendly transform+box-shadow
transition (translateY + scale, no layout properties) applied to the avatar in both
`AiAssistantPage.tsx`'s header and `ChatMessageBubble.tsx`. Active class is driven by
the real `isGenerating || isThinking` (header) / `message.isStreaming` (bubble) state —
confirmed both flags are unconditionally cleared after `sendWithFailover` resolves,
success or error, so the avatar cannot get stuck in the active state. Reduced motion
is handled by the pre-existing global `prefers-reduced-motion`/`.reduce-motion`
transition-duration override — no new media query needed since this uses `transition`,
which that rule already zeroes out.

Verified no unrelated pages were accidentally noindexed (`grep -rl noindex src/pages`
shows only the coming-soon page, 404, and the two already-private dashboard/settings
pages). `robots.txt` unchanged.

Sound effects: not implemented this pass — no audio asset exists and the brief
explicitly allows deferring this rather than fabricating a broken implementation.

Build: PASS. Lint: PASS (0 errors, same 6 pre-existing warnings).

**Files changed:** `src/pages/ComingSoonCategoryPage.tsx`, `public/sitemap.xml`,
`src/index.css`, `src/features/ai/pages/AiAssistantPage.tsx`,
`src/features/ai/components/ChatMessageBubble.tsx`.

## Session — 2026-08-17 (continued) — Homepage regression re-fix + workflow chains

**Second instance of the same regression class found before starting new work:** the
"What do you need today?" section (added earlier this session) had also been silently
reverted by the intermediate `unzip -o` of the uploaded archive during the character-
integration turn — same root cause as the sitemap/noindex regression already fixed and
documented. This was NOT caught in the prior turn's regression check because that check
only re-verified sitemap/noindex, not the homepage. Re-applied the homepage section from
scratch, re-verified all 6 links against `App.tsx` again before moving on.

**Comprehensive regression audit added this time** (grep-based, not doc-trust) across:
homepage problem section, workflow section, character avatar wiring (both files),
power-up CSS, noindex, sitemap count, robots.txt, ads.txt — all confirmed present before
packaging.

**New work (genuinely new, not previously done):**
- "Not just tools — workflows" section: 4 real problem→tool→next-step chains (Exam week,
  Assignment week, Semester setup, Creator workflow), 18 links total, every single href
  individually verified against the live route table in `App.tsx` before use.
- "New here?" lightweight 3-step onboarding block, shown only when `!hasRecent` (i.e.
  only to visitors with zero real local activity) — no fabricated data, no forced
  signup, disappears automatically once the visitor has genuine recent-tool history.

Hero, AI entry point, recent-tools/streak section (real data via `useRecentToolsStore`/
`useProductivityInsights`, already existed), categories, and FAQ were reviewed and left
untouched — already solid, no genuine issue found.

Build: PASS. Lint: PASS (0 errors, same 6 pre-existing warnings).

**Files changed:** `src/pages/HomePage.tsx` only.

**Process note for future sessions:** never run `unzip -o <uploaded file>` against this
working tree again — the working tree in `/home/claude/work` is authoritative once a
session has made edits. If a fresh copy is ever needed, extract to a separate directory
and diff/merge manually rather than overwriting.

## Session — 2026-08-17 (continued) — Homepage refinement (Phases 2-14)

Audited the actual current homepage source directly (not docs) before changing anything.
Baseline confirmed intact via grep: problem-first section, workflow chains, character
avatar wiring, power-up CSS, noindex, 71-URL sitemap all present.

**Genuine issue found (Phase 6 — honesty of labels):** "Popular academic tools" heading
had no real analytics backing it — it was just `academicTools.slice(0, 8)` in registry
order. Relabeled to "Student essentials," an accurate description of what the section
actually is.

**Genuine improvement (Phase 4 — workflow clarity):** workflow chains were a flat row of
chips connected by arrows, which read more like tags than a sequence. Rebuilt as a
numbered vertical step list (1, 2, 3...) with a connecting line — same real `WORKFLOWS`
data and same verified hrefs, just clearer as an actual sequence to follow.

**Genuine improvement (Phase 7 — AI CTA):** homepage AI section previously described AI
features generically ("solve doubts, explain concepts..."). Reframed around the
platform-navigation use case the AI is actually built for ("Not sure which tool you
need?" + a concrete example prompt), matching the AI's actual system-prompt behavior
rather than describing it as a general-purpose chatbot.

**Checked, found already correct, left untouched:** recent-tools "Continue where you
left off" section already only shows real localStorage data with real timestamps
(`RecentToolVisit.timestamp`); homepage doesn't currently display the timestamp
directly (only a generic "Recently used" label), which is honest — no fabricated
relative-time strings, so no fix needed. Hero, categories, FAQ, "New here?" section:
reviewed, already solid.

Build: PASS. Lint: PASS (0 errors, same 6 pre-existing warnings).

**Files changed:** `src/pages/HomePage.tsx` only.

## Session — 2026-08-17 (continued) — Verification pass, no network/build available

**Environment constraint:** this session's sandbox has no network access and no
`node_modules` in the archive, so `npm install`/`tsc -b`/`vite build`/lint could not be
run. All verification below is source-level (grep/read), not a real build. Flagging
honestly rather than fabricating a PASS, per standing instruction.

**Regression checklist — re-verified by direct grep against source, all present:**
AI identity/siteKnowledge (`src/features/ai/logic/siteKnowledge.ts`), problem-first
chips (`promptLibrary.ts` + `HomePage.tsx`), character AI-left/user-right
(`ChatMessageBubble.tsx` — `isUser && 'ml-auto flex-row-reverse'`), flame/power-up
classes (`.ai-character-avatar-active`, tied to `message.isStreaming` /
`isGenerating || isThinking`, not a timer), reduced-motion handling (both
`prefers-reduced-motion` media query and `.reduce-motion` class in `index.css`),
homepage "What do you need today?" / "New here?" / "Not just tools — workflows" /
"Student essentials" sections all present in `HomePage.tsx`, `/blog` and
`/finance-tools` still noindexed (`ComingSoonCategoryPage.tsx`), sitemap still at 71
URLs with neither thin route present, `robots.txt`/`ads.txt` unchanged and correct.

**Targeted bug sweep (object-URL leaks, per-frame canvas allocation, uncancelled
timers) across creator/productivity/academic/dashboard — no new issues found:**
- `ThumbnailSafeZoneCheckerPage.tsx` `createObjectURL` — already paired with
  `revokeObjectURL` on both replace and (implicitly) unmount path. Clean.
- All four `setInterval` call sites (`TypingIndicator`, `DeadlineCalculatorPage`,
  `PomodoroTimerPage`, `FocusModePage`) have a matching `clearInterval` in the
  `useEffect` cleanup. Clean.
- `<img>` tags without `loading="lazy"` are all user-generated previews (uploaded
  file previews, QR/avatar output) that need to render immediately after a user
  action — not eligible for lazy-loading, so left alone rather than manufacturing a
  "fix" that would just delay content the user is actively waiting for.

**No genuine new source-level issue found this pass.** The project has already been
through many verified sessions (character integration, homepage regressions x2,
14-phase homepage refinement, security recheck, performance audit, mobile-safety
pass) — this session's job was to re-verify none of that had silently regressed
(it hadn't) and hunt for anything new (nothing genuine found). Per the standing
instruction not to manufacture work, no source changes were made this session.

**Still genuinely open (unchanged from prior backlog, none of these are code-fixable
in this sandbox):**
- Setting the four `VITE_*_ENABLED` flags in the actual Vercel dashboard (deployment
  config, not code).
- Live-verifying the four new AI providers against real vendor endpoints (needs
  network this sandbox doesn't have).
- Any real browser/device visual/interaction testing (avatar animation timing, PWA
  runtime caching, mobile touch behavior) — everything claimed "clean" here is
  source-level only.
- Remaining performance-audit line items from the prior session's partial checklist
  (academic calculators, remaining productivity/creator tools, dashboard/analytics
  rendering) — spot-checked this session via the leak/timer/canvas patterns above,
  no issues found, but not exhaustively re-read file-by-file.

**Build/Lint: NOT VERIFIED this session (no network, no node_modules).** Run
`npm install && npm run build && npm run lint` locally/in CI to confirm before deploy.

**Files changed this session:** `PROJECT_BACKLOG.md` only (this entry).

## Session — 2026-08-17 (continued) — Homepage honesty + discovery gap fix

Continued from the same working tree (not re-extracted). Full inventory re-confirmed
via source (AI architecture, character/flame, homepage sections, SEO plumbing,
legal/PWA) — all previously-verified items still present, no regressions found.

**Genuine issue found (own content-standard violation):** homepage `<title>` read
"The Ultimate Student Productivity Platform" — an exaggerated superlative claim,
which is exactly what this project's own AdSense/content standard forbids elsewhere.
Site-wide grep for similar hyperbole (`ultimate`, `#1`, `best-in-class`, `world's`,
`top-rated`) found no other instances — this was isolated. Changed to
"Calculators, Planners & Tools for Students" (accurate, still keyword-relevant) and
updated the meta description to mention all four tool categories including Creator
Tools, which it had omitted.

**Genuine discovery gap found:** the homepage "What do you need today?" problem-first
section had no entry point into Creator Tools — one of the four main categories was
unreachable from the primary discovery mechanism. Added
"I'm creating content and need sizing/color tools" → `/creator-tools` (route verified
against `App.tsx`), reusing the already-imported `Palette` icon.

**Checked, already correct, left untouched:** AI CTA copy already matches the
requested "Not sure which tool you need? Tell ALLROUNDER HELPER AI..." framing
verbatim from a prior session — no change needed. Open Graph/Twitter meta, canonical,
and JSON-LD (Organization/WebSite/FAQ) in `Seo.tsx` already complete and correctly
wired on every page — left alone. Workflow chains, "New here?", Student essentials,
recent-tools/streak section all re-verified against source, already solid.

**Build/Lint: NOT VERIFIED (no network/node_modules in this sandbox)** — same
constraint as the prior entry. Run `npm install && npm run build && npm run lint`
locally before deploy.

**Files changed:** `src/pages/HomePage.tsx` only (title/meta description, one new
problem-first chip).

## Session — 2026-08-17 (continued) — Final AdSense/content quality audit pass

Continued from the same working tree. No re-extraction.

**Phase 8 (trust/accuracy overclaim sweep):** grepped source-wide for
guaranteed/always/100%/best/ultimate/popular/most/number-one/secure/private/offline
claims. One hit (`SocialMediaSizeGuidePage.tsx`, "guaranteed") is actually a warning
*against* treating platform dimensions as guaranteed-current — correct usage, not an
overclaim. No genuine overclaims found this pass (the one real hyperbole issue, the
homepage title, was already fixed and packaged in the prior session).

**Phase 5 (category index pages):** re-read all four index pages
(`AcademicToolsPage`, `ProductivityIndexPage`, `DocumentToolsIndexPage`,
`CreatorToolsIndexPage`) in full. All four already have genuine category-level
guidance distinct from a plain tool grid — "which tool do you actually need"
decision guidance (Academic, Productivity), a "why this runs in your browser"
privacy explainer + typical workflow (Document), and a two-group tool breakdown
(Creator) — plus real per-category FAQs. No templated/duplicate wording between
categories. Left unchanged — already meets the bar.

**Phase 4 (duplication audit):** spot-checked FAQ sets on CGPA vs SGPA Calculator
(the most likely pair to have copy-pasted content, since they're mathematically
related). Confirmed genuinely tool-specific questions/answers on both — no
boilerplate duplication. Consistent with prior sessions' spot checks on other tool
families.

**Phase 12 (trust pages):** re-read `PrivacyPolicyPage.tsx` in full (representative
of the four legal pages — Cookie/Disclaimer/Terms are the same `StaticPageLayout`
pattern). Real, specific, AdSense-appropriate content (cookies/personalized-ads
disclosure + opt-out mention, accurate description of what is/isn't sent to a
server) — not a placeholder despite being short. No fix needed.

**No new genuine issue found this pass.** This session's audit (routes, category
index pages, duplication risk, trust-page substance, overclaim language) turned up
nothing beyond what was already fixed in the prior session (homepage title +
missing Creator Tools discovery chip). Per the standing instruction against
manufacturing work, no source changes were made this session beyond this log entry.

**Build/Lint: NOT VERIFIED (no network/node_modules in this sandbox)** — unchanged
constraint. Run `npm install && npm run build && npm run lint` locally before deploy.

**Files changed:** `PROJECT_BACKLOG.md` only.

## Session — 2026-08-17 (continued) — "Today's focus" Study Command Center

Continued from the same working tree. Network re-checked this session
(`npm ping` → 403, `curl` to registry.npmjs.org → `x-deny-reason: host_not_allowed`) —
confirmed still unavailable, so build/lint remain source-verified only.

**New work (Phase B — genuinely additive, backed only by real local data):** added a
"Today's focus" homepage section between "Continue where you left off" and the
workflow chains. Reads directly from the same localStorage keys the real tool pages
already write to — `ar-exam-countdowns` (`ExamCountdownPage.tsx`) and `ar-assignments`
(`AssignmentTrackerPage.tsx`), both confirmed by grep, not assumed. Shows at most one
nearest upcoming exam (days-remaining, filtered to non-past) and one nearest
non-submitted assignment (due-date, formatted), each linking to its real tool. Section
renders nothing at all if neither store has qualifying data — no empty-state filler,
since "New here?" already covers the zero-data case and a second one would be
redundant. No fabricated timestamps, counts, or streaks; reuses the existing
`STATUS_LABEL`/`daysRemaining` helpers from the tools' own logic files rather than
re-deriving that formatting.

Considered and rejected: pulling in Notes/Goals/Habits into the same card — the
brief explicitly warns against manufacturing a card grid, and neither store has a
clear "one most relevant item" reduction the way exams/assignments do (a goal or
habit doesn't have a single "next" instance) — better left to the existing
recent-tools and streak sections rather than forced in here.

**Regression sweep (grep-based) before this edit — confirmed unchanged:** Creator
Tools discovery chip, homepage title fix, flame/power-up CSS, `/blog` +
`/finance-tools` noindex, 71-URL sitemap.

**Build/Lint: NOT VERIFIED** — network confirmed unavailable this session (see above).
New imports (`useLocalStorage`, `CountdownExam`, `daysRemaining`, `Assignment`,
`STATUS_LABEL`) were checked by hand against their real export names/paths and a
brace/paren balance check on the full file; this is not a substitute for `tsc`. Run
`npm install && npm run build && npm run lint` locally before deploy.

**Files changed:** `src/pages/HomePage.tsx` only.

## Session — 2026-08-17 (continued) — Workflow-chain gap closure

Continued from the same working tree. Network re-checked (`curl` to
registry.npmjs.org → 403 `host_not_allowed`) — still unavailable.

**Genuine gap found and fixed:** the brief's own worked example
("Assignment → deadline → today's priority → focus session → completion") wasn't
fully reflected in `AssignmentTrackerPage.tsx`'s `related` links — it pointed to
To-Do List and Exam Countdown but not Focus Mode, the actual next step described.
Added `{ label: 'Focus Mode', href: '/productivity/focus-mode' }` (route verified
against `App.tsx`).

**Verified as already correct (no change needed):** spot-checked the other hub pages
in the same workflow family — CGPA→Study Planner, Exam Countdown→Study Planner,
Study Planner→Exam Countdown/Semester Planner/Pomodoro, Semester Planner→Study
Planner/Exam Countdown, Focus Mode→Pomodoro/Priority Matrix — all already chain
correctly, matching the "result → plan next step" pattern this phase asked for. Not
a systemic issue, just the one missed link.

**Regression checklist (grep-based against actual source, all present):** "Today's
focus", Creator Tools discovery chip, homepage title fix, flame/power-up CSS, AI
chat left/right alignment, `/blog`+`/finance-tools` noindex, 71-URL sitemap, clean
(non-watermarked) character assets in `src/assets/ai-character/` with no watermark
files outside the untouched `character-src/` source folder.

**Build/Lint: NOT VERIFIED** — network unavailable this session (confirmed by
direct check, not assumed).

**Files changed:** `src/features/productivity/pages/AssignmentTrackerPage.tsx`,
`PROJECT_BACKLOG.md`.

## Session — 2026-08-17 (continued) — Real timestamps on "Continue where you left off"

Continued from the same working tree. Network re-checked — still unavailable (403).

**Genuine improvement (Phase 5 — "Continue where you left off"):** the recent-tools
cards on the homepage showed a generic "Recently used" label even though
`RecentToolVisit` (`useRecentTools.ts`) already stores a real ISO `timestamp` per
visit — the data existed but wasn't surfaced. Added a small local `timeAgo()`
helper (minutes/hours/days-ago, falling back to a short date past a week — no new
dependency) and now display the actual recorded time, e.g. "2 hours ago", exactly
matching the phase brief's own example and the "never invent timestamps" constraint
— this uses the real stored value, not a fabricated one.

**Checked, already correct, left untouched:** empty states on Exam Countdown,
Assignment Tracker, and Study Planner are already real and action-oriented ("No
exams tracked yet" / "Add an exam...", etc.) — not blank boxes, no fix needed. AI
CTA framing, workflow-chain hub pages (CGPA/Exam Countdown/Study Planner/Semester
Planner/Focus Mode) re-verified as already fully connected from the prior session's
fix — no further gaps found this pass.

**Regression checklist (grep-based):** Today's focus, Creator Tools chip, homepage
title fix, Assignment→Focus Mode link, flame/power-up CSS, AI chat left/right
alignment, blog/finance-tools noindex, 71-URL sitemap, 5 clean character-asset files
in `src/assets/ai-character/` — all present.

**Build/Lint: NOT VERIFIED** — network confirmed unavailable this session.

**Files changed:** `src/pages/HomePage.tsx` only.

## Session — 2026-08-17 (continued) — Transparent overdue-assignment priority signal

Continued from the same working tree. Network re-checked — still unavailable (403).

**Genuine improvement (Phase E — smart priority without AI):** "Today's focus" showed
an open assignment's due date the same way whether it was upcoming or already past —
no urgency signal distinguished an overdue assignment (the brief's own HIGH-priority
example) from one due next week. Added a transparent, rule-based `isAssignmentOverdue()`
check (today's date vs. `dueDate`, no AI/guessing) that swaps the label to
"— overdue" / "Was due {date}" with an orange accent when true. Color is not the sole
indicator — the text itself changes too, so this stays accessible without relying on
color alone. Assignment selection logic (`nextAssignment`, sorted ascending by
`dueDate`) already naturally surfaces an overdue item first since it's earlier in time
than any future one — no change needed there, just made the existing prioritization
visible to the user instead of silent.

**Checked, no genuine gap found:** "Start studying" entry point (Phase B) — the
existing "What do you need today?" problem-first section already covers this exact
need (exam/assignment/focus/plan-time entries, all real routes); adding a second,
parallel CTA would duplicate an existing system, which the brief explicitly warns
against. Category descriptions (Phase H) already use concrete student language, not
generic "explore our powerful collection" phrasing — left unchanged. PWA manifest
confirmed generated via `vite-plugin-pwa` in `vite.config.ts` (not a static file) —
intact, not regressed.

**Regression checklist (grep-based):** Today's focus, relative timestamps, Creator
Tools chip, homepage title, Assignment→Focus Mode link, flame/power-up CSS, AI
left/right chat alignment, blog/finance-tools noindex, 71-URL sitemap, 5 clean
character-asset files — all present.

**Build/Lint: NOT VERIFIED** — network confirmed unavailable this session.

**Files changed:** `src/pages/HomePage.tsx` only.

## Session — 2026-08-17 (continued) — "You're clear for now" empty state (Phase C)

Continued from the same working tree. Network re-checked — still unavailable (403).

**Genuine gap found and fixed:** "Today's focus" only rendered when real exam/
assignment data existed (`hasFocusData`), so a returning user (`hasRecent === true`
— has used tools before) with nothing currently tracked saw neither this section nor
"New here?" (which is gated on `!hasRecent`) — a real messaging gap between the two
states. Changed the section's visibility condition to `hasRecent` and added the
brief's own requested state inside it: when `hasFocusData` is false, show
"You're clear for now — No exams or open assignments tracked — plan your next study
session" linking to `/productivity/study-planner` (route re-verified). New users
still only see "New here?", unaffected — no duplicate onboarding.

**Not implemented, reasoned through and skipped:** a separate "one clear next
action" CTA button (Phase D) beyond what already exists — each Today's Focus card
already IS the single next action (a direct link to the relevant tool), and Focus
Mode ranks Assignment Tracker/Exam Countdown reachable in one tap from the existing
related-tools links. Adding a second, competing CTA button on top of an already-
single-purpose card risked exactly the "15 competing buttons" problem this phase
explicitly warns against, so left alone.

**Regression checklist (grep-based):** clear-for-now state, relative timestamps,
overdue-assignment indicator, Creator Tools chip, homepage title, Assignment→Focus
Mode link, flame/power-up CSS, AI chat left/right alignment, blog/finance-tools
noindex, 71-URL sitemap, 5 clean character-asset files, ads.txt/robots.txt content
— all present and unchanged.

**Build/Lint: NOT VERIFIED** — network confirmed unavailable this session.

**Files changed:** `src/pages/HomePage.tsx` only.

## Session — 2026-08-17 (continued) — Workflow chain 2.0: Semester Planner + Habit→Focus links

Continued from the same working tree. Network re-checked — still unavailable (403).

**Genuine gaps found and fixed (Phase D — audited the newly-specified chains):**
- Brief's chain #3 ("CGPA/SGPA → Semester Planner → Study Planner") was only half
  wired — both calculators linked to Study Planner but skipped Semester Planner
  entirely, even though it's the more natural next step after a cumulative-GPA
  result (plan the semester before planning daily study). Added
  `{ label: 'Semester Planner', href: '/productivity/semester-planner' }` to both
  `CgpaCalculatorPage.tsx` and `SgpaCalculatorPage.tsx` (route verified against
  `App.tsx`), keeping existing related links rather than removing any.
- Brief's chain #5 ("Goal Tracker → Habit Tracker → Focus Mode") was missing its
  last link — `HabitTrackerPage.tsx` linked to Pomodoro Timer and Daily Planner but
  not Focus Mode specifically. Added
  `{ label: 'Focus Mode', href: '/productivity/focus-mode' }`.

**Checked, already correct, left untouched:** chain #1 (Exam Countdown→Study
Planner→Focus Mode), #2 (Assignment→Focus Mode, fixed in an earlier session), #4
(Attendance→Study Planner) all already fully connected — re-verified by grep, not
assumed.

**Regression checklist (grep-based):** clear-for-now state, relative timestamps,
overdue indicator, Creator Tools chip, homepage title, flame/power-up CSS, AI chat
left/right alignment, blog/finance-tools noindex, 71-URL sitemap, 5 clean
character-asset files with no watermarked files outside the untouched
`character-src/` source folder — all present.

**Build/Lint: NOT VERIFIED** — network confirmed unavailable this session.

**Files changed:** `src/features/academic/pages/CgpaCalculatorPage.tsx`,
`src/features/academic/pages/SgpaCalculatorPage.tsx`,
`src/features/productivity/pages/HabitTrackerPage.tsx`.

## Session — 2026-08-17 (continued) — Final whole-site release audit

Continued from the same working tree. Network re-checked — still unavailable (403
`host_not_allowed`).

**Privacy/local-processing claim audit (Section 6):** traced the OCR tool's "runs
fully in your browser... your file is never uploaded anywhere" claim against its
actual `tesseract.js` implementation. The recognition *engine* (worker/wasm/language
data, a few MB) is fetched from a CDN on first use — the page already discloses this
explicitly ("The engine... downloads once on first use and is cached for later" +
an error-state message mentioning the one-time internet requirement) and the claim
itself is precisely scoped to the *file* never being uploaded, which is accurate.
No overclaim found — already correct. Document category-index claim ("processed
locally and never uploaded to a server") re-checked against the actual PDF/image/QR
tool set — accurate for that claim's scope.

**PWA manifest audit:** `vite.config.ts` `VitePWA({ manifest: {...} })` confirmed to
include name, short_name, theme_color, background_color, display,
display_override, start_url, scope, and icons including a maskable 512×512 — no
gaps found.

**Security/secrets sweep:** full-tree grep for API key shapes and PEM headers —
clean. No `.env`/`.env.local` present in the archive.

**Route/indexation spot-check:** 404 fallback (`path="*"` → `NotFoundPage`)
confirmed wired in `App.tsx`. `DashboardPage.tsx`/`SettingsPage.tsx`/
`AiSettingsPage.tsx` confirmed noindexed — no private page accidentally indexable.

**Full regression sweep — all 16 items verified by direct grep against source, all
present:** non-hyperbolic homepage title, Creator Tools chip, Today's Focus,
"You're clear for now", overdue-assignment indicator, real elapsed timestamps, New
Here, AI CTA framing, flame/power-up CSS, AI chat left/right alignment,
`/blog`+`/finance-tools` noindex (71-URL sitemap, neither route present),
Assignment→Focus Mode, CGPA→Semester Planner, SGPA→Semester Planner,
Habit→Focus Mode, Attendance→Study Planner. 5 clean character-asset files present.

**No new genuine issue found this pass.** This was a verification-focused final
audit rather than a feature phase — per the standing instruction against
manufacturing work, no source changes were made beyond this log entry.

**Build/Lint: NOT VERIFIED** — network confirmed unavailable this session. Run
`npm install && npm run build && npm run lint` locally/CI before deploying to
Vercel or applying for AdSense.

**Files changed:** `PROJECT_BACKLOG.md` only.

---

## Final consolidation pass (this session)

Re-verified from source, not from prior reports:

- **AI character system:** confirmed genuinely state-driven (`message.isStreaming`
  → `ai-character-avatar-active`), no timer-based fake state, reduced-motion
  covered both via `.reduce-motion` class and `prefers-reduced-motion` media
  query, GPU-friendly transform/opacity only. Left/right layout correct
  (`flex-row-reverse` only applied when `isUser`). No changes needed.
- **Workflow chain gap found and fixed:** `Assignment Tracker → Priority Matrix
  → Focus Mode` was broken — Assignment Tracker's `related` links skipped
  Priority Matrix entirely, and Priority Matrix didn't link forward to Focus
  Mode. Added `Priority Matrix` to `AssignmentTrackerPage.tsx`'s related links
  and `Focus Mode` to `PriorityMatrixPage.tsx`'s related links.
- **Tables:** all `<table>` usages already wrapped in `overflow-x-auto`. No
  mobile overflow risk found.
- **Secrets sweep:** no real `.env`, no hardcoded keys/tokens/PEM blocks.
  Server-side provider keys correctly proxied through `api/ai/*.ts` Vercel
  functions rather than bundled client-side; only `VITE_*_ENABLED` booleans
  (non-secret) are exposed to the browser. `.env.example` has empty
  placeholders only.
- **ads.txt / robots.txt / sitemap.xml:** all present and correctly formed.
  `/blog` and `/finance-tools` correctly render via the noindexed
  `ComingSoonCategoryPage` template and are absent from the sitemap.
- **`character-src/` removed from final archive:** confirmed unused by the
  app (`grep` found zero references from `src/`) — leftover raw frame/
  watermark-crop source material, not a shipped asset. The production avatar
  (`src/assets/ai-character/allrounder-ai-avatar.png`) was visually inspected
  and is clean, unwatermarked.

**Genuine issues found this pass:** 1 (the Assignment Tracker → Priority
Matrix → Focus Mode chain gap above). Everything else audited checked out
against actual source and was left alone per the standing instruction not to
manufacture work.

**Build/Lint: NOT VERIFIED** — npm registry access returned `403` in this
sandbox (no network egress). Run `npm install && npm run build && npm run
lint` locally/CI before deploying.

**Files changed:** `AssignmentTrackerPage.tsx`, `PriorityMatrixPage.tsx`,
`PROJECT_BACKLOG.md`. `character-src/` dropped from the shipped archive only.

---

## Dark theme readability audit (this session)

**Root cause found:** the `@theme` block in `src/index.css` only defined
`--color-ink-{50,100,300,500}`. Source code across 79 usages in 20+ files
referenced `dark:text-ink-400`, `dark:text-ink-600`, `dark:text-ink-200`, and
`dark:bg-ink-400` — none of which existed as design tokens. Tailwind v4 only
generates a utility class for a color that exists in the `--color-*`
namespace, so these 79 usages silently produced **no CSS rule at all** in
dark mode, leaving affected text to fall back to inherited/ambient color
instead of the intended muted tone. This is the actual cause of the reported
"some text is hard to read in dark theme" — not a contrast tuning problem on
existing tokens, but genuinely broken/no-op utility classes.

Affected components included message body text and breadcrumbs
(`ChatMessageBubble.tsx`, `Breadcrumbs.tsx`), error boundaries
(`ErrorBoundary.tsx`), document tool taglines (`DocumentToolLayout.tsx`),
analytics captions (`AnalyticsPage.tsx`), calendar empty states
(`CalendarPage.tsx`), homepage step links (`HomePage.tsx`), dashboard quotes
(`DashboardPage.tsx`), contact confirmation (`ContactPage.tsx`), and the AI
typing indicator dot (`TypingIndicator.tsx`).

**Fix:** added the three missing tokens to `src/index.css`'s `@theme` block,
each chosen and verified against WCAG contrast math (Python, sRGB relative
luminance) against both `navy-950` (page bg) and `navy-800` (card/glass bg):

- `--color-ink-200: #d2d5ea` — 13.84:1 / 12.42:1
- `--color-ink-400: #9aa0c3` — 7.85:1 / 7.04:1
- `--color-ink-600: #7880a8` — 5.22:1 / 4.69:1

All three clear WCAG AA (4.5:1) for normal text on both dark backgrounds
actually used in the app, and sit correctly in the existing scale between
their neighboring defined shades (verified no other undefined
`navy/ink/electric/violet/emerald` shade exists anywhere in `src/`).

**Light theme:** unaffected — every one of the 79 usages only appeared behind
a `dark:` variant; the light-mode `text-navy-*` classes on the same elements
were already fully defined and untouched.

**Not changed:** `text-navy-400` used standalone (no `dark:` override) in ~70
places for small icons/buttons is ~3.75:1 on white, under the 4.5:1 AA
text threshold but at/above the 3:1 non-text/UI-component threshold WCAG
applies to icons and controls — left as-is since these are pre-existing
icon-button colors, not undefined tokens, and changing 70 call sites without
a specific reported defect there risks exactly the kind of unrequested churn
this phase was told to avoid. Flagging for a future dedicated pass if
desired.

**Interactive states, AI chat, mobile tables, focus rings, error/success
colors:** all re-verified against source and already correct — error/success
text already uses higher-contrast `dark:text-red-400` / emerald variants,
focus-visible outline is theme-token-driven and unaffected by this bug,
AI character avatar/flame system untouched (still state-driven, still
respects reduced-motion). No changes made where things already worked.

**Build/Lint: NOT VERIFIED** — no network egress in this sandbox.

**Files changed:** `src/index.css` (3 new theme tokens only — no component
files needed edits, since the components already referenced the correct
class names and just needed the tokens to exist), `PROJECT_BACKLOG.md`.

---

## AI character identity audit (this session)

**Genuine gaps found:** three of the AI Assistant's most prominent "this is
the assistant" moments used generic Lucide icons instead of the flame
character, while the chat header, message bubbles, and typing indicator were
already correctly using it (verified — not touched):

1. `AiOnboardingDialog.tsx` — the "Meet Your Personal AI Study Assistant"
   welcome dialog (first thing a new user sees) used a generic `Sparkles`
   icon in a gradient circle.
2. `AiAssistantPage.tsx` — the new-chat empty-state greeting used the shared
   `EmptyState` component with a `Sparkles` icon.
3. `HomePage.tsx` — the homepage's large standalone "Not sure which tool you
   need?" AI CTA section used a generic `Bot` icon.

**Fix:** replaced all three with the existing clean, non-watermarked
`allrounder-ai-avatar.png` (same asset already used correctly in the chat
header/bubbles), each in its original appearance — no recoloring, no site
theme filter applied to the character itself, only the existing gradient
container backgrounds (already part of the design system) frame it.
Removed now-unused `Sparkles`/`EmptyState` imports from `AiAssistantPage.tsx`
and `Sparkles` from `AiOnboardingDialog.tsx`.

**Deliberately left unchanged:** `Bot`/`Sparkles` icons used as small
(≤20px) items inside otherwise-icon-consistent lists — e.g. the homepage's
"What do you need today?" option row, and the dashboard's "Ask AI
Assistant" quick-action / "Recent AI chats" empty state — since these sit
next to sibling list icons (Calculator, ListTodo, etc.) rather than standing
alone as the assistant's identity, and swapping just one list item to a
photographic character would look inconsistent, not more branded. Also left
the AI chat message avatar, header avatar, typing indicator, and flame/
power-up animation system fully untouched — re-verified all four are still
state-driven (`message.isStreaming`), left-aligned for AI / right for user,
reduced-motion-safe, and returning to idle on completion and on error.

**Verification without network access:** copied the three edited files
outside the project's `tsconfig.json` scope and ran a standalone `tsc --jsx
react-jsx --noEmit` pass on each. No syntax/parse errors; the only errors
reported were expected `Cannot find module`/missing-JSX-namespace noise from
running outside the real project's installed `@types/react`, which is a
limitation of this offline check, not a defect in the edits. Also re-ran the
full undefined-color-token sweep from the previous phase — zero new
undefined tokens introduced by these changes (all edits reuse existing
`gradient-brand`, `text-navy-*`/`text-ink-*` classes already defined in
`@theme`).

**Dark theme (Part 7) re-audit:** spot-checked additional categories not
covered last pass — placeholder text (`placeholder:text-navy-300
dark:placeholder:text-ink-600` etc. — all now resolve since `ink-600` was
added last phase), and `Badge.tsx` (all six tones use translucent 10%
backgrounds with defined, already-passing text tokens on both themes). No
new genuine issues found; the token-definition fix from the prior phase
remains the correct and complete root-cause fix.

**Build/Lint: NOT VERIFIED** — no network egress in this sandbox (npm
registry returns 403); `node_modules` cannot be installed. Manual `tsc`
syntax check performed instead, as described above — this is not a
substitute for a real `npm run build && npm run lint` and should still be
run in CI/locally before deploying.

**Files changed:** `src/features/ai/pages/AiAssistantPage.tsx`,
`src/features/ai/components/AiOnboardingDialog.tsx`, `src/pages/HomePage.tsx`,
`PROJECT_BACKLOG.md`.

---

## UI/UX + accessibility + responsive audit (this session)

Full-source audit across dark theme, light theme, mobile, spacing/typography,
interaction states, AI identity, homepage, trust/content, accessibility,
performance, SEO, and route regression. Most categories checked out clean
against actual source — documented below rather than changed for the sake of
changing something.

**Genuine issue found and fixed:**
- `FloatingAiButton.tsx` — the site-wide floating "Ask AI" button, visible on
  nearly every page in the app, still used a generic `Sparkles` icon instead
  of the flame character. This was the most prominent AI-identity gap
  remaining (previous phases fixed the onboarding dialog, chat empty state,
  and homepage AI CTA, but missed this one, which is arguably higher-traffic
  since it persists across every page). Replaced with the same
  `allrounder-ai-avatar.png` used elsewhere, in a small circular badge
  alongside the existing text label. Touch target preserved (~44px).

**Checked, already correct, left untouched:**
- Dark/light contrast: re-ran the full undefined-token sweep — zero
  undefined `navy/ink/electric/violet/emerald` shades anywhere in `src/`.
  Spot-checked `Button.tsx` (all 5 variants use defined tokens,
  `disabled:opacity-50 disabled:pointer-events-none` — disabled state isn't
  color-only), `ConfirmDialog.tsx` (`role="alertdialog"`, `aria-modal`,
  labelledby/describedby all present).
- Dialog/modal accessibility: swept every component using a `fixed inset-0`
  overlay pattern — all have `aria-modal`/`role="dialog"` or
  `role="alertdialog"`. None missing.
- Timers: found 9 files using a bare `setTimeout` without an explicit
  `clearTimeout` (toast auto-dismiss, "copied!" label resets, etc.) — all
  are short-lived (≤3.5s), harmless-on-unmount UI feedback, not accumulating
  intervals or leaks. `QrScannerPage.tsx`'s camera stream (the one place
  with a real resource, `getUserMedia`) already stops all tracks on unmount
  via a `useEffect` cleanup. No change made — flagging real leaks over
  cosmetic timer patterns.
- Tables: no literal `<table>` elements exist in the app (data grids are
  custom flex/card layouts) — table-specific dark-mode/overflow concerns
  don't apply.
- Trust/content: swept for exaggerated claims ("best", "guaranteed", "100%",
  fake user counts, unsupported offline/privacy claims) — every "best" hit
  was a legitimate streak label or hedged, honestly-caveated advice (e.g.
  the Social Media Size Guide explicitly warns its own numbers can go
  stale). No fabricated statistics or misleading claims found anywhere.
- Homepage: re-read section-by-section against the "what is this / what can
  I do / what now / why return" framing — hierarchy, CTA clarity, and
  section count are unchanged from the last verified-correct pass; no
  redundant or filler sections found.

**Build/Lint: NOT VERIFIED** — no network egress in this sandbox. The one
edited file (`FloatingAiButton.tsx`) was syntax-checked standalone via `tsc
--noEmit` outside the project's tsconfig scope — no parse errors.

**Files changed:** `src/components/FloatingAiButton.tsx`,
`PROJECT_BACKLOG.md`.

---

## Phase 14 — OpenRouter client-side secret exposure fix (2026-08-17)

**A user-raised security concern, investigated and confirmed genuine.** Prior sessions'
"OpenRouter is the exception — its docs support client-side keys" reasoning (documented
in `FINAL_RELEASE.md`, `AI_PROVIDER_GUIDE.md`, and `openAICompatibleProvider.ts`'s own
comments) was accepted without questioning whether "vendor docs permit browser calls"
actually means "safe to ship a real secret to every visitor." It doesn't. This was a
real, if latent, vulnerability: `OpenRouterProvider.ts` read
`import.meta.env.VITE_OPENROUTER_API_KEY` and attached it as a literal `Authorization:
Bearer` header in a client-side `fetch`. Vite statically inlines every `VITE_*` variable
into the built JS bundle at build time — if a deployer ever set a real key there (the
value was empty in this repo's own `.env.example`, so no key has shipped in *this*
archive specifically, but the architecture itself was unsafe for any real deployment),
any visitor could extract it from the bundle/network tab and spend the account's
OpenRouter credits indefinitely.

**Confirmed via source, not assumption:** grepped every other OpenAI-compatible provider
(`CerebrasProvider.ts`, `MistralProvider.ts`, `OpenAIProvider.ts`, `XaiProvider.ts`,
`ZaiProvider.ts`) — all five already use `mode: 'proxy'` with the real key server-side.
OpenRouter was the sole `mode: 'direct'` provider in the entire registry. Also confirmed
the Settings-page `settings.apiKey` field is an explicitly-labeled, currently-unused
placeholder for a *future* user-entered BYOK mode — it was not what OpenRouter's direct
mode actually read, so this fix doesn't remove or conflict with any working BYOK feature
(none exists yet).

**Fix — migrated OpenRouter to the same server-proxy architecture as every other
provider, zero new dependencies:**
1. New `api/ai/openrouter.ts` — Vercel Edge Function proxy, identical pattern to
   `api/ai/cerebras.ts`/`mistral.ts`/`openai.ts`/`xai.ts`/`zai.ts`: reads
   `OPENROUTER_API_KEY` from `process.env` (server-only), forwards the request, streams
   `upstream.body` straight through unmodified (so the existing SSE parser in
   `openAICompatibleProvider.ts` needs zero changes — proxy vs. direct mode only affects
   the request URL/headers on the way out, not response handling on the way in).
2. `OpenRouterProvider.ts` — `mode: 'proxy'`, `enabled` derived from a new
   `VITE_OPENROUTER_ENABLED` flag (non-secret boolean), `proxyPath: '/api/ai/openrouter'`,
   `envVarName: 'OPENROUTER_API_KEY'`. No more `apiKey`/`baseUrl` fields.
3. `providerRegistry.ts` — `PROVIDER_CATALOG`'s OpenRouter description string corrected
   to describe the server-side key, matching every other provider's phrasing.
4. `.env.example` / `FINAL_RELEASE.md` — OpenRouter's env-var documentation moved from
   the "one exception" framing into the standard server-key + `VITE_*_ENABLED` block;
   `FINAL_RELEASE.md`'s Cloudflare-Pages-breaks-things note and feature/limitations bullets
   updated (previously said "every AI provider except OpenRouter" breaks off-Vercel — now
   all of them do, correctly, since none are direct-browser anymore).
5. `AI_PROVIDER_GUIDE.md` — rewrote the transport-mode explanation and "Adding a new
   provider" instructions so a *future* session isn't guided to repeat this exact mistake
   for some other vendor. `direct` mode is now documented as reserved for a genuine
   user-entered key only, never a site-wide secret in a `VITE_*` var.
6. `openAICompatibleProvider.ts` — updated the factory's doc comments to match (no logic
   changes — the `cfg.mode === 'proxy' ? cfg.proxyPath : ...` dispatch and the
   `if (cfg.mode === 'direct') headers.Authorization = ...` line, both re-read and
   confirmed unmodified, so `mode: 'proxy'` for OpenRouter is correct by construction,
   proven by the same code path already working for 5 other providers).
7. `vercel.json` — removed `https://openrouter.ai` from the CSP `connect-src` allowlist.
   That entry existed only because the browser used to call OpenRouter directly; now the
   browser only ever talks to `/api/ai/openrouter` (same-origin, already covered by
   `'self'`), so keeping a direct third-party allowance in the CSP would have been
   unnecessary attack surface (the policy is currently Report-Only, not enforced, but
   tightened anyway rather than left stale).
8. `AiSettingsPage.tsx` — corrected one line of UI copy that said the unused API-key field
   was superseded by "the server or a build-time env var" (implying some providers still
   use a client build-time var) to say "the server," now accurate for all providers.
9. `FINAL_AUDIT_REPORT.md` — corrected the OpenRouter row in the per-provider status table
   (a living reference, not a strictly time-stamped log) so it no longer documents the
   old direct-mode architecture as the current/intended state.

**Regression check — provider architecture:** re-read `providerOrchestrator.ts` and
`providerRegistry.ts`'s `FALLBACK_ORDER`/`getFallbackChain`/`getRoutedFallbackChain` — none
of this logic branches on transport mode, only on `isConfigured()`, which OpenRouter's
`proxy`-mode `isEnabled = cfg.enabled` still satisfies correctly. Gemini, Cerebras, Mistral,
OpenAI, xAI, Z.ai, Cloudflare provider files: untouched, re-confirmed unmodified via diff
against the pre-session archive. No calculator, routing, or unrelated AI logic touched.

**Build/Lint: NOT VERIFIED** — `npm install` re-attempted this session, still `403
Forbidden` (no registry access in this sandbox). All 8 edited/created files
brace/paren-balance-checked programmatically — all balanced. The new `api/ai/openrouter.ts`
was structurally diffed line-by-line against the already-established, presumably-working
`api/ai/cerebras.ts` pattern rather than written from scratch, to minimize the chance of a
typo the offline checks here can't catch.

**Files changed:** `api/ai/openrouter.ts` (new),
`src/features/ai/providers/OpenRouterProvider.ts`,
`src/features/ai/providers/openAICompatibleProvider.ts`,
`src/features/ai/logic/providerRegistry.ts`,
`src/features/ai/pages/AiSettingsPage.tsx`,
`src/features/ai/AI_PROVIDER_GUIDE.md`, `.env.example`, `FINAL_RELEASE.md`,
`FINAL_AUDIT_REPORT.md`, `PROJECT_BACKLOG.md`.

---

## Phase 13 — final release audit (2026-08-17)

Broadened the audit into areas not yet independently checked in this sandbox:
client-side secret exposure, PWA icon/manifest file existence, dialog focus-
trap coverage, marketing-claim language, and domain consistency. All clean.

**Checked, all clean, no source changes needed:**
- **Client-side secrets:** confirmed only `VITE_OPENROUTER_API_KEY` is read
  client-side (by design — OpenRouter's own docs support browser keys, per
  `FINAL_RELEASE.md`); Gemini/Cerebras/Mistral only expose `VITE_*_ENABLED`
  boolean flags client-side, actual keys stay server-side in `api/ai/*.ts`.
- **PWA manifest:** all 3 icons declared in `vite.config.ts` (`icon-192.png`,
  `icon-512.png`, `icon-512-maskable.png`) confirmed present on disk in
  `public/icons/`. Workbox `navigateFallbackDenylist` correctly excludes
  `/api`, which exists and is a real serverless dir, not a broken reference.
- **Domain consistency:** `Seo.tsx`'s canonical `SITE_URL`, `sitemap.xml`,
  and `robots.txt`'s `Sitemap:` line all consistently reference
  `allrounderhelper.com` — not a mismatch with the Vercel preview URL, just
  the intended production custom domain used consistently everywhere.
- **Dialog/overlay focus-trap coverage:** re-swept every `fixed inset-0`
  usage in `src/` programmatically for a paired `role="dialog"` /
  `role="alertdialog"` / `aria-modal` — zero missing.
- **Marketing-claim sweep:** every hit for "best/ultimate/#1/guaranteed/100%
  accurate" read in context — all are legitimate hedged product copy (e.g.
  "best streak" as a habit-tracker stat, "works best with one dominant
  color" as design advice) or an explicit caveat *against* over-trusting a
  claim (Social Media Size Guide's own FAQ warns its numbers can go stale).
  Zero unsupported superlatives found.
- **Touch targets:** noted 20 files use `h-8 w-8`/`h-7 w-7`/`h-6 w-6` icon
  buttons (32px/28px/24px, under the 44px guideline) — this is a pre-existing,
  consistent design-system pattern across the whole app, not a localized
  defect, and changing 20 files' sizing without a specific reported UX
  complaint would be exactly the kind of unrequested broad churn this
  project's own prior sessions have deliberately avoided (see the earlier
  `text-navy-400` icon-contrast decision for the same reasoning). Flagging
  for a future dedicated pass if desired; not changed here.

**Genuine new issues found: 0.** All fixes from Phase 12 (affiliate
disclosure) re-verified present and unregressed.

**Build/Lint: NOT VERIFIED** — no registry access in this sandbox this
session either (not re-attempted, since it was already confirmed failing
twice this same working-tree session with no change in circumstances).

**Files changed:** `PROJECT_BACKLOG.md` only.

---

## Phase 4 — mobile-first product polish + AI message-action overload fix (2026-08-18)

Re-read the AI Assistant source directly (not trusting prior "already correct"
reports) against the full Phase 4 P0–P3 brief, plus spot-checked homepage
navigation, Dashboard, and Focus Mode/Pomodoro/Settings for regressions. One
genuine, previously-undetected issue was found and fixed; everything else
checked was confirmed already correct.

**Genuine issue found and fixed:**
- **Every chat message showed up to 6 always-visible action buttons on
  mobile** (Copy, Quote, Pin, Share, Edit-or-Delete, Retry) — the desktop
  hover-reveal classes (`sm:opacity-0 sm:group-hover:opacity-100`) only
  hide the row on desktop; on mobile the whole row was `opacity-100`
  permanently, so a long conversation meant a wall of six 36px buttons
  under every single message. This is exactly the pattern the brief calls
  out by name ("do NOT overload the message with 8–12 buttons... on
  mobile secondary actions can live in a compact menu") — not a cosmetic
  nitpick, a real "which button am I supposed to press" clutter problem
  on a 360px screen. **Fix (`ChatMessageBubble.tsx`):** mobile now shows
  only Copy plus the one contextual primary action (Edit for the user's
  own messages, Retry for the AI's last message) directly — down from up
  to 6 buttons to at most 3 — with Quote/Pin/Share/Delete moved into a
  compact "More" (⋯) popover, reusing the same focus-safe dismiss-on-
  backdrop-click pattern already used by the AI header's mobile menu.
  Desktop is completely unchanged (still every action, still hover-
  revealed). No functionality was removed — every action is still one
  tap away, just not all six visible at once.

**Re-verified from source, all already correct, no change made:**
- AI header: compact on mobile, single "More" menu already consolidates
  Status/Prompts/Export/Import/Settings/mode (6 controls → 1 button),
  essential state (messages-left count) stays visible even on mobile.
- Composer: auto-grow textarea capped at `max-h-32` (128px) so long
  messages can't cover the screen, confirmed by an actual `useEffect`
  syncing `scrollHeight`, not just a CSS claim; `env(safe-area-inset-
  bottom)` padding and `100dvh`-based conversation height confirmed
  present and unchanged from the phase that added them.
- Conversation sidebar (mobile overlay drawer): real focus trap,
  Escape-to-close, body-scroll lock, focus restored to the toggle button
  on close, closes automatically after selecting a conversation.
- AI empty state: real, working problem-based starter chips pulled from
  `promptLibrary.ts` ("I have exams coming up and don't know where to
  start", etc.) — not decorative, each one is a real `send()` call, no
  invented capabilities.
- Floating AI button: already hidden on the AI Assistant page itself
  (avoids covering its own composer), safe-area-aware, and — per the
  earlier visual-polish phase — no longer collides with the toast stack.
- Flame identity: re-confirmed zero occurrences of the legacy
  `ai-flame-wrap/-core/-aura/-spark` classes anywhere in `src/`; the
  `active` boolean (`isThinking || isGenerating` for the header,
  `isStreaming` per-message) drives a real flicker/aura-pulse/spark-rise
  SVG animation while active, and a static idle mascot (no wasted
  continuous animation) otherwise — a deliberate, previously-documented
  design choice, not a regression, and it satisfies the brief's own
  "don't continuously waste animation resources" idle-state instruction.
- Dashboard: quick actions and "continue where you left off" appear
  before any stats; every stat card (active tasks, Pomodoros today, best
  habit streak, avg. goal progress, 35-day activity heatmap) is derived
  from the user's actual `localStorage` data, not fabricated; a real
  empty state covers the true zero-data case.
- Security/QA sweep (Part 43/48 of the brief): zero `console.log` or
  `debugger` statements, zero API-key-shaped strings or `VITE_*_API_KEY`
  literals, no real `.env` file present in the tree, zero legacy flame
  class occurrences — all checked by grep across `src/` and `api/`, not
  assumed.

**Build/Lint/Typecheck: NOT VERIFIED** — still no network/registry access
in this sandbox this session (consistent with every prior session on this
project); no build was claimed.

**REMAINING (genuinely unfinished, not claimed as done):** Homepage hero
copy/section ordering, Notes, and the document-tool "Ask AI about this
document" cross-linking (Part 30 of the brief) were not individually
re-read this session — Homepage/navigation were last source-verified in
Phase 2B with no regression signal since, but not re-opened this session.
No live 320–412px browser rendering was performed on any page (no browser
in this sandbox).

**Files changed:** `src/features/ai/components/ChatMessageBubble.tsx`,
`PROJECT_BACKLOG.md`.

---

## Phase 3 — complete calculator audit + AI Assistant deep verification (2026-08-18)

Closes the exact gap Phase 2B's own report flagged: "only CGPA was
individually audited." This session individually read every academic
calculator's actual component source (not just the shared layout), plus
re-verified the AI Assistant's highest-risk behaviors (flame placement,
auto-continuation safety, table/markdown overflow, scroll/jump-to-latest)
directly from source rather than trusting the standing "already correct"
claim.

**Genuine issues found and fixed (6 files):**
- **CGPA & SGPA calculators had no visible on-screen label once a student
  started typing** — the column-header row was `hidden` below the `sm:`
  breakpoint, so on a phone the only label was placeholder text, which
  disappears the moment the field has a value. This directly violates the
  audit brief's "do not rely only on placeholder text as a label" rule,
  and was inconsistent with every single-input calculator in the app
  (Attendance, Percentage, Exam Score, etc.), which all use the shared
  `NumberField`/`FieldWrapper` component with a real persistent `<label>`.
  **Fix:** made the column-header row always visible (shrunk to `text-[11px]`
  so it doesn't crowd 320px screens) instead of hiding it below `sm:`, and
  added `inputMode="decimal"` to the raw number inputs on both pages to
  match the numeric-keyboard behavior every other calculator already gets
  from `NumberField`.
- **Attendance, Exam Score, Assignment Score, and Marks Required
  calculators showed no message when the entered numbers were invalid**
  (e.g. attended classes greater than total classes held) — the result
  section just silently rendered "—" placeholders with no explanation, the
  exact "bad: 'Invalid input'" pattern the brief calls out, except worse
  (no message at all). Two other calculators in the same app (GPA to
  Percentage, Semester Percentage) already had a correct, specific inline
  error message for this — so this was also a real cross-tool
  consistency gap. **Fix:** added the same inline `role="alert"` red-text
  pattern already used on those two pages, with a specific, actionable
  message per calculator ("Classes attended can't exceed total classes
  held", "Total marks must be greater than 0", etc.) rather than a generic
  "Invalid input."
- **Study Hours calculator** had the same silent-no-message gap when hours/
  day or days/week fall outside realistic bounds (0–24h, 0–7 days) —
  fixed with the same inline-message pattern.

**Calculators individually inspected this session (all others found
already correct, no change made):** GPA to Percentage, Percentage, Semester
Percentage, Unit Converter, Scientific Calculator, Deadline Calculator —
each has real per-field labels (via `NumberField`/`SelectField`), sensible
`inputMode`, a visually prominent `ResultStat` result section, and (where
an invalid combination is actually possible) either input clamping or an
inline error message. CGPA/SGPA's repeated-row remove button correctly
refuses to drop below one row. No horizontal-overflow risk found in any
calculator's grid at the 320px width class (`grid-cols-[Nfr_..._40px]`
patterns tested arithmetically against 320px minus card padding).

**AI Assistant — re-verified from source, all already correct, no change
needed:**
- Flame avatar (`AiFlameAvatar`, canonical `ai-flame2-*` CSS, confirmed
  zero occurrences of legacy `ai-flame-wrap/-core/-aura/-spark` anywhere in
  `src/`) renders inside **every** AI message row via `ChatMessageBubble.tsx`
  — not only in the header — with each instance's `active` state tied to
  that specific message's own `isStreaming` flag, so it lights correctly
  on the first message, on multiple consecutive AI messages, and returns
  to idle independently per message.
- Auto-continuation (`AiAssistantPage.tsx`): bounded at `MAX_CONTINUATIONS
  = 4` (can't loop forever), each pass appends rather than regenerates (so
  duplicate content isn't possible by construction), a mid-pass failure
  keeps whatever partial answer was already accumulated instead of
  discarding it, cancellation is checked and handled at every pass
  boundary, and a response still `length`-limited after all passes gets an
  explicit "very long — reply continue for more" note rather than silently
  stopping.
- Long-response containment: Markdown tables render inside a dedicated
  `overflow-x-auto` wrapper (`src/lib/markdown.ts`), code blocks likewise,
  and the message bubble itself has `break-words` — so a wide table or a
  long unbroken URL/token can't cause page-level horizontal scroll.
- Scroll behavior: the conversation auto-scrolls to the newest content
  only while the user is within 40px of the bottom (`pinnedToBottomRef`);
  scrolling up during generation to read earlier content is not fought,
  and a "jump to latest" control is shown once the user has scrolled away
  from the bottom.
- Composer keyboard/safe-area handling (`100dvh`, `env(safe-area-inset-*)`)
  from the earlier AI Assistant phase confirmed still present and
  unregressed.

**Other tools spot-checked, already correct:** To-Do List has a real
descriptive empty state (`EmptyState` component, not "Nothing here"),
consistent with the shared component used elsewhere. Focus Mode and
Pomodoro both have one visually dominant `size="lg"` primary action
button (Start focus session / Play-Pause) rather than several
competing same-weight buttons.

**NOT VERIFIED this session** — no browser/network access in this sandbox,
so the requested live 320–412px walkthrough and `npm run build/lint`
could not be run; everything above was checked by reading the actual
source.

**REMAINING (genuinely unfinished, not claimed as done):** Dashboard,
Homepage, mobile navigation, and Notes were not individually re-read this
session (Homepage/navigation/Settings/Command Palette were already
source-verified in Phase 2B with no regression signal since). No live-
viewport rendering was performed on any page.

**Files changed:** `src/features/academic/pages/CgpaCalculatorPage.tsx`,
`SgpaCalculatorPage.tsx`, `AttendanceCalculatorPage.tsx`,
`ExamScorePage.tsx`, `AssignmentScorePage.tsx`, `MarksRequiredPage.tsx`,
`StudyHoursPage.tsx`, `PROJECT_BACKLOG.md`.

---

## Mobile UX Phase 2B — continuation audit (2026-08-18)

Continuing the mobile-UX-focused Phase 2 track from a prior session's ZIP
(Settings sound hierarchy, Document Tools workflow, Command palette,
Onboarding, Accessibility, Performance, calculator-by-calculator audit,
320–412px walkthrough were left as the stated priorities). This session
re-verified from source rather than trusting prior claims, and only changed
what was genuinely found broken — the prior sessions' own standing rule
against manufacturing unrequested churn was kept.

**Checked this session, source-verified, already correct — no change made:**
- **Settings → Sound & effects** (`SettingsPage.tsx`): the three audio
  systems (global UI sounds, Focus Mode soundscape, Pomodoro alarm) are
  already presented as visually separate cards with an explicit sentence
  under the UI-sound controls stating this control is separate from the
  Pomodoro alarm and Focus Mode soundscape, which have their own settings
  on their own pages. Volume slider, enable toggle, and a "Test sound"
  button are all present and correctly disabled together when sound is off.
  This already satisfies the "don't make students wonder if turning this
  off also stops Focus Mode" requirement.
- **Command palette** (`CommandPalette.tsx` + `Header.tsx`): reachable on
  mobile via a dedicated icon button (not just Ctrl/Cmd+K), has a focus
  trap, locks body scroll while open (so the backdrop can't be touch-
  dragged to scroll the page behind it), supports arrow-key navigation,
  closes on Escape or backdrop click, shows recent tools when the query is
  empty, and caps results at 20. No genuine gap found.
  found.
- **PDF → AI → viva-question workflow** (`AttachmentBar.tsx` +
  `attachmentTextExtraction.ts`): attaching a PDF shows a spinner while
  text is extracted in the background (doesn't block the composer), and on
  failure distinguishes a genuinely unreadable/corrupted file from a
  scanned/image-only PDF with zero extractable text — the latter case
  explicitly tells the student to run the OCR Text Extraction tool first
  and re-attach the result, rather than failing silently. Long filenames
  are truncated (`max-w-[120px] truncate`) so they can't break the
  attachment chip's layout. This already supports the
  upload → summarize → ask-follow-ups journey described in the brief.
- **Onboarding** (`OnboardingTour.tsx`): 6 short slides, each skippable at
  any point, "Don't show this again" checked by default, dot progress
  indicator, focus-trapped, body-scroll-locked, bottom-sheet layout on
  mobile. Slightly longer than the 3-step minimum suggested in the brief,
  but every slide is one short sentence and the flow is fully skippable in
  one tap from slide one — not a forced tutorial. Left as-is rather than
  cut to 3 slides without a specific complaint, consistent with this
  project's standing avoid-unrequested-churn policy.
- **Icon-only button accessibility**: wrote a script to parse every
  `<button>` in `src/` and flag ones with no visible text and no
  `aria-label`/`aria-labelledby`. Two hits, both false positives on
  inspection (the shared `Button.tsx` wrapper, and a "=" text button on
  the Scientific Calculator misread as icon-only by the heuristic). Zero
  genuine unlabeled icon buttons found.
- **CGPA Calculator** spot-checked as a representative calculator: 3-column
  mobile-safe grid (`grid-cols-[1fr_1fr_40px]`) that doesn't overflow at
  320px, per-row `aria-label`s on inputs (column headers are hidden below
  `sm:` since placeholders serve as the mobile label), grade points clamped
  to the 0–10 range on input, remove-row button always leaves at least one
  row. No issues found.
- **Performance sweep**: grepped every `<img>` without `loading="lazy"` (18
  hits) and every `setInterval` (4 hits). All 18 images are either small
  fixed-size avatars/icons or `URL.createObjectURL` blob previews of a
  file the student just picked (never an unbounded list of remote images),
  so lazy-loading would have no effect. All 4 timers (Pomodoro, Focus Mode,
  a 60s deadline-countdown tick, and the AI typing-indicator elapsed-time
  display) are ref-tracked and cleared on unmount/completion — no leak
  pattern found.

**Not re-verified this session (unchanged from prior sessions' finding):**
- The ~20 files using `h-8 w-8`/`h-7 w-7`/`h-6 w-6` (28–32px) icon-only
  touch targets below the 44px guideline — previously investigated and
  deliberately left as a consistent, pre-existing design-system choice
  rather than an isolated bug; flagging again for a future dedicated pass
  if the user wants it, not changed here.

**Genuine new issues found and fixed: 0.**

**NOT VERIFIED this session (environment limitation, not skipped):**
- No browser/network access in this sandbox, so the requested
  320/360/375/390/412px live walkthrough, `npm run build`/`lint`/
  `typecheck`, and any runtime keyboard-overlap testing could not actually
  be performed. Everything above was checked by reading the actual
  source, not by assuming.

**REMAINING (genuinely unfinished, not claimed as done):**
- Calculator-by-calculator mobile audit only covered CGPA as a
  representative sample this session — SGPA, Attendance, Percentage, Study
  Hours, Exam Score, Assignment Score, Semester Percentage, and Unit
  Converter were not individually re-read this session.
- No live-viewport (320–412px) walkthrough was performed (see above).

**Files changed:** `PROJECT_BACKLOG.md` only — no source files required a
genuine fix this session.

---

## Phase 12 — affiliate disclosure fix (2026-08-17)

**Genuine issue found and fixed:** `AffiliateRecommendationCard.tsx` (shown in
the AI Assistant chat when `affiliateDetection.ts` flags a product-recommendation
turn) linked out to an Amazon-affiliate destination (`AFFILIATE_DESTINATION_URL`,
already correctly marked `rel="noopener noreferrer sponsored"` at the HTML level)
but had **no visible disclosure** that the link was an affiliate/ad link, and
`DisclaimerPage.tsx` — the site's one disclaimer page — never mentioned the
affiliate relationship at all. `rel="sponsored"` is a machine-readable signal for
search engines, not a substitute for the clear, conspicuous, human-readable
disclosure FTC endorsement guidelines and AdSense's own trust policies require
near the link itself. This is a genuine AdSense-readiness/compliance gap that no
prior session's audit (which covered fake-statistics/fake-testimonial claims,
not affiliate disclosure specifically) had caught.

**Fix (two small, targeted changes, no new dependencies, no architecture change):**
1. `AffiliateRecommendationCard.tsx` — added a small "Ad" badge next to the card
   title and changed the subtext to explicitly state "Affiliate link — we may
   earn a commission at no extra cost to you." Purely additive text/markup;
   layout, icon, colors, and click behavior unchanged.
2. `DisclaimerPage.tsx` — added an "Affiliate disclosure" section explaining
   when the card appears, that a commission may be earned, that recommendations
   are never paid-for-placement, and that it's clearly labeled and optional.

**Verified while investigating:** `PrivacyPolicyPage.tsx` already correctly
discloses "third-party services including Google Analytics and Google AdSense"
— no conflicting claim there to fix. No other page makes a "no third-party
links"/"never shares data" style claim that would contradict the affiliate
card's existence.

**Build/Lint: NOT VERIFIED** — `npm install` actually re-attempted this
session, still `403 Forbidden` (no registry access in this sandbox). Both
edited files were brace/paren/tag-balance-checked programmatically — balanced,
no syntax anomalies.

**Files changed:** `src/features/ai/components/AffiliateRecommendationCard.tsx`,
`src/pages/legal/DisclaimerPage.tsx`, `PROJECT_BACKLOG.md`.

---

## Phase 11 — verification session (2026-08-17)

Re-verified the project from source in a fresh sandbox rather than trusting
prior phase reports. No source-code changes were made this session — every
check below turned up clean, and per the standing instruction against
manufacturing work, nothing was changed just to log a "phase."

**Checked this session, all clean:**
- Full-tree sweep for `TODO`/`FIXME`/`HACK`, `console.log`, `debugger`,
  `: any`, `@ts-ignore`/`@ts-nocheck` across `src/` — zero hits.
- Secrets sweep (API-key-shaped strings, PEM headers) across the whole
  tree, plus explicit check of `.env.example` — placeholders only, no real
  `.env`/`.env.local` present.
- Color-token sweep: every `(dark:)?(text|bg|border|ring|placeholder:text)-
  (ink|navy|electric|violet|emerald)-<n>` utility used in `src/` (57 unique
  combinations) checked against the tokens actually defined in `src/index.css`'s
  `@theme` block — zero undefined tokens. The dark-theme token bug fixed in an
  earlier session has not regressed.
- Route/sitemap parity: parsed all 78 `path=` route definitions in `App.tsx`
  and all 71 sitemap URLs programmatically. The 6-route difference is exactly
  the intentionally-noindexed set (`/dashboard`, `/settings`, `/analytics`,
  `/ai-assistant/settings`, `/blog`, `/finance-tools`) — no accidental
  omission or accidental indexing found.
- `img` tag alt-attribute sweep — no `<img>` without `alt` found in `src/`.
- Confirmed the 6 previously-noted unused-but-real components (Modal, Drawer,
  Dropdown, Tabs, Tooltip, Accordion) are still genuinely unimported anywhere
  else in `src/` — status unchanged from prior sessions, left in place per
  the existing "real code, not placeholder" rationale.

**Build/Lint: NOT VERIFIED this session** — `npm install` was actually
attempted (not assumed) and fails with `403 Forbidden` from the npm registry
in this sandbox; an earlier `--dry-run` misleadingly "succeeds" off cached
metadata only, consistent with a prior session's documented finding. No
`node_modules` could be installed, so `npm run build`/`npm run lint` could
not be executed. A prior session (Phase 6, 2026-08-16) did have working
registry access and reported a clean build; that result is not re-verifiable
in this sandbox but no source change has occurred since that only
regressed anything checkable above.

**Genuine new issues found: 0.** This was a verification pass, not a feature
phase — the project remains in the state documented through Phase 10.

**Files changed:** `PROJECT_BACKLOG.md` only.

---

## Visual/UX polish audit (this session)

**Genuine issue found and fixed:**
- **Toast notifications collided with the floating AI button.** After the
  previous phase gave the site-wide `FloatingAiButton` its own bottom-right
  anchor (`fixed right-5`, `bottom: 1.25rem + safe-area`), it landed almost
  exactly on top of `ToastProvider`'s notification stack, which was already
  anchored at `fixed right-4`, `bottom: 1rem + safe-area` — a ~4px offset in
  each direction, not enough to avoid overlap. Any toast (save confirmation,
  copy feedback, error message, etc.) firing on a page where the AI button
  is visible — i.e. almost every page — would visually collide with it.
  **Fix:** moved the toast stack to `fixed left-4` instead, giving the AI
  button sole ownership of the bottom-right corner. Also hardened the toast
  width from a flat `max-w-sm` (384px) to `max-w-[calc(100vw-2rem)]
  sm:max-w-sm`, so a long message can no longer overflow past the right
  edge of very narrow (320px) viewports.

**Checked, already correct, left untouched:**
- Floating AI button sizing/cropping: ~44px effective touch target, icon
  contained via `object-contain` (no distortion), circular badge frame
  consistent with the chat header treatment.
- Z-index stacking: header (`z-50`), mobile AI sidebar overlay (`z-50`,
  `fixed inset-0`), onboarding/dialog overlays (`z-[100]`), floating button
  (`z-40`) — no genuine conflicts once the toast/button corner collision
  above was resolved.
- Native `<select>`/date inputs: already correctly themed via the global
  `color-scheme: dark` declaration on `:root.dark` (set in an earlier
  phase) — browsers render native form-control chrome (dropdown popups,
  date pickers) in the matching theme automatically; no dark-mode fix
  needed here.
- Re-ran the full undefined-color-token sweep — still zero undefined
  tokens after this session's edits (both reuse only existing classes).

**Build/Lint: NOT VERIFIED** — no network egress in this sandbox. Both
edited files (`FloatingAiButton.tsx` carried over from last phase,
`ToastProvider.tsx` this phase) syntax-checked standalone via `tsc
--noEmit` outside the project's tsconfig scope — no parse errors.

**Files changed:** `src/components/ToastProvider.tsx`,
`PROJECT_BACKLOG.md`.

---

## Phase 11 — Master Product Audit (2026-08-19, this session)

Scope: full 30-point mobile/AI/UX audit per Phase 11 brief. **No browser or
network access was available in this sandbox** — `npm install` failed with
the same `403 Forbidden` documented in prior sessions, so `npm run
build`/`tsc -b`/`oxlint` could not be executed against the real project, and
no live/browser viewport testing (320–412px) was performed. This phase is
**source/static audit only**; nothing here is claimed as browser- or
live-verified.

**Genuine issue found and fixed:**
- **Cancelling generation before the first token arrived left no visible
  confirmation.** In `AiAssistantPage.tsx`'s `sendMessage` flow, when
  `cancelGeneration()` fires during the "thinking" phase (before `onChunk`
  ever sets `started = true`), the typing indicator and Stop button both
  disappear (`isThinking`/`isGenerating` reset), but no assistant message or
  system notice was ever appended — the student's tap had no visible effect,
  which is indistinguishable from the tap not registering. Contrast with the
  already-correct mid-stream case, which appends `*(stopped)*` to the partial
  text. **Fix:** when cancelled with `started === false`, append a brief
  `isSystemNotice` message ("Stopped.") so cancellation always has visible
  confirmation, matching the mid-stream behavior. File: `src/features/ai/
  pages/AiAssistantPage.tsx`.

**Checked, already correct, left untouched:**
- AI flame (`AiFlameAvatar.tsx`): single canonical implementation confirmed
  (no duplicate/legacy flame files found tree-wide); asymmetric silhouette,
  independent back-lick/tip/spark motion, calm vs. energetic states, and
  `prefers-reduced-motion` + app-level reduce-motion both respected.
- Continuation logic: bounded `MAX_CONTINUATIONS = 4`, finish-reason tracked
  per pass, partial content preserved on a failed continuation pass rather
  than replaced by the error, and a genuinely-exhausted answer says so
  explicitly instead of silently truncating.
- Composer: `100dvh`-based chat height, `env(safe-area-inset-bottom)`
  padding on both the outer chat frame and the input bar — matches the P0
  mobile keyboard/safe-area requirement.
- Attendance calculator: already returns both "classes you can miss" and
  "classes needed to attend," with an FAQ explaining the derivation — matches
  the spec's "derived insight" requirement.
- Secret/stale-domain/debug-statement scan: zero hardcoded secrets, zero
  `allrounderhelper.com` references, zero `console.log` in `src/`, no
  committed `.env` (only `.env.example`).
- Design-token spacing/radius: sampled `rounded-*` usage across
  `src/components` and `src/features` — the lg/xl split reads as tiered
  usage (controls vs. cards), not an actual inconsistency; no concrete
  visual evidence to act on without browser access, so left untouched per
  the "don't invent problems" rule.

**Verification — labeled honestly:**
- SOURCE VERIFIED: files listed above read line-by-line.
- STATIC VERIFIED: the one edited file was syntax-checked standalone with a
  global `tsc` (outside the project's `tsconfig`, so missing-`@types`
  noise was filtered) — no errors introduced by the edit itself.
- BUILD VERIFIED: NOT performed — no network egress, `npm install` fails.
- TYPECHECK/LINT (project-scoped): NOT performed, same reason.
- FRESH-ZIP VERIFIED: extracted the packaged ZIP and diffed the file list
  against the source tree (see below).
- BROWSER VERIFIED / LIVE VERIFIED: NOT performed — no browser tool
  available in this session.

**Files changed:** `src/features/ai/pages/AiAssistantPage.tsx`,
`PROJECT_BACKLOG.md`.

**Remaining limitations:** the 320–412px viewport sweep, the full document
→ AI workflow trace, and the design-system visual-rhythm pass all require
either a live browser or a working `npm install` in this environment,
neither of which was available this session. Genuine build/typecheck/lint
verification is also outstanding for the same reason.

---

## Phase 12 — Real Student Experience / Mobile Usability (2026-08-19, this session)

Scope: full Phase 12 journey-tracing audit (AI chat journeys, flame, document→AI
handoff, homepage, mobile nav, floating button/toast, calculators, productivity
tools, document-tool error messages, spacing, a11y, performance, security). Built
on the Phase 11 baseline (ZIP: `allrounder-helper-phase11-master-audit.zip`).
**No network or browser access in this sandbox** — same constraint as Phase 11:
`npm install` still fails (403), no live/browser viewport testing performed.
Source/static audit only; nothing here is claimed browser- or live-verified.

**Genuine issues found and fixed (2):**

1. **Marks Required Calculator: "Status" ignored the student's own target.**
   `calculateMarksRequired` computed `status` from a flat, hardcoded 40%
   baseline regardless of whether the student had set a target percentage —
   so a student targeting 75% who is only at 50% would see a green "Pass"
   next to "Marks needed for target: 300," which reads as "you're fine" when
   they are 25 points short of the number they actually asked about. This is
   the calculator's central purpose, undermined by its own status field.
   **Fix:** `status` now returns `'On Target' | 'Below Target'` once a
   target is set (comparing current marks against the computed requirement),
   and only falls back to the generic `'Pass' | 'Fail'` 40%-baseline when no
   target is given — reusing the same `targetAchieved` pattern the sibling
   `AssignmentResult` type in the same file already established, so this is
   consistent with existing project convention, not a new pattern. Also
   added target-percentage bounds validation (0–100) on the page, since an
   out-of-range target (e.g. 150%) previously produced a nonsensical
   "marks needed" figure with no warning. Updated the FAQ/tips copy in the
   same file to match the corrected behavior. Files: `src/features/
   academic/logic/calculations.ts`, `src/features/academic/pages/
   MarksRequiredPage.tsx`. Confirmed no other file imports
   `calculateMarksRequired`/`MarksRequiredResult`, so no regression risk
   elsewhere.

2. **Mobile nav menu didn't close on Escape.** Every other overlay in the
   app (Command Palette, dialogs, onboarding) already closes on Escape —
   the mobile nav dropdown in `Header.tsx` was the one inconsistent
   exception, a real keyboard-accessibility gap for anyone navigating with
   a physical keyboard. **Fix:** added an Escape-key listener scoped to
   when the menu is open, matching the existing pattern used elsewhere.
   File: `src/components/layout/Header.tsx`.

**Checked, already correct, left untouched:**
- AI chat scroll behavior: pinned-to-bottom tracked via 40px-slack ref,
  auto-scroll only fires while pinned, manual scroll-up correctly unpins
  and holds position, "Jump to latest" re-pins — exactly matches the
  required behavior, no changes needed.
- Flame energetic-vs-calm scoping: `ChatMessageBubble` ties each message's
  flame to that specific message's `isStreaming` flag, so old messages
  never re-run the energetic animation — confirmed correct at every call
  site, no duplicate flame implementations anywhere in the tree.
- Flame performance: zero `setInterval`/`setTimeout` in the per-message
  bubble component — animation is pure CSS driven by the `active` prop, so
  it doesn't scale badly with many old messages on screen.
- Document→AI attachment flow: `AttachmentBar` already shows per-file
  `reading`/`ready`/`error` states, and `DocumentQuickActions` only appears
  once an attachment has extractable text and the composer is empty —
  already answers "did it receive my file" and "what do I type now."
- Floating AI button: already hidden on `/ai-assistant` itself (so it can't
  cover its own composer), and a full-tree scan found no other fixed-bottom
  action bars anywhere in the app for it to collide with. Phase 11's
  toast-repositioning fix (left-anchored, safe-area padded) is intact and
  untouched.
- Document-tool error messages (PDF merge/split/compress/extract, OCR):
  every catch block already surfaces a plain-language, actionable message
  ("may be encrypted or corrupted," "try the OCR tool instead") — zero raw
  stack traces or technical exceptions reach the student.
- Attendance calculator's derived "classes can miss / classes needed"
  outputs: unchanged, still present, still correct.
- Security/regression scan: zero hardcoded secrets, zero
  `allrounderhelper.com` references, zero `console.log` in `src/`, no
  committed `.env`, exactly one canonical flame file.

**Verification — labeled honestly:**
- SOURCE VERIFIED: all files listed above read line-by-line, workflows
  traced through the actual source rather than assumed.
- STATIC VERIFIED: all three edited files (`calculations.ts`,
  `MarksRequiredPage.tsx`, `Header.tsx`) syntax-checked standalone with a
  global `tsc` outside the project's `tsconfig` (missing-`@types` noise
  filtered) — zero errors attributable to the edits; the pure-logic file
  (`calculations.ts`) compiled with zero errors of any kind.
- BUILD VERIFIED / TYPECHECK VERIFIED (project-scoped) / LINT VERIFIED:
  NOT performed — no network egress in this sandbox, `npm install` fails
  with the same 403 documented in Phase 11.
- FRESH-ZIP VERIFIED: extracted the packaged ZIP and confirmed file count,
  absence of forbidden directories/secrets, and presence of all three
  edited files with their changes intact.
- BROWSER VERIFIED / LIVE VERIFIED: NOT performed — no browser tool
  available this session.

**Files changed:** `src/features/academic/logic/calculations.ts`,
`src/features/academic/pages/MarksRequiredPage.tsx`,
`src/components/layout/Header.tsx`, `PROJECT_BACKLOG.md`.

**Remaining limitations:** the 320–412px viewport sweep, live-site
verification, and genuine `npm run build`/`tsc -b`/`oxlint` all require
either a browser tool or working network egress, neither available in this
environment. The design-rhythm/spacing pass (Priority 11) was reviewed at
a sampling level (radius-token usage) but not exhaustively, since a
conclusive verdict needs visual rendering this sandbox can't produce.

---

## Phase 13 — Continuation Audit (2026-08-19, this session)

Scope: targeted audit of genuinely unexplored areas per the Phase 12 baseline
(Command Palette internals, document→AI "don't auto-assume" requirement,
Notes/To-Do/Focus/Pomodoro timer cleanup, Settings audio separation, dashboard/
homepage fake-stats scan, route-level lazy loading). Same sandbox constraints
as Phases 11–12: no network egress (`npm install` still 403s) and no browser
tool, so this remains source/static audit only — no build/typecheck/lint or
browser/live verification performed or claimed.

**Genuine issue found and fixed (1):**
- **Command Palette arrow-key navigation didn't scroll the highlighted result
  into view.** The results list is a `max-h-96 overflow-y-auto` container that
  can hold up to 20 items; `ArrowDown`/`ArrowUp` moved `activeIndex` but
  nothing scrolled the corresponding row into the visible area. With enough
  results, repeated arrow presses could push the highlighted item off-screen
  while keyboard focus stayed in the search input, leaving no visual
  indication of which item Enter would select. **Fix:** added a ref array
  over the result buttons and a `scrollIntoView({ block: 'nearest' })` effect
  keyed on `activeIndex`. File: `src/components/CommandPalette.tsx`. Confirmed
  only `Header.tsx`, `App.tsx`, and `DashboardPage.tsx` reference the
  component (all just render `<CommandPalette />` / call the open store), so
  no internal API changed and no regression risk elsewhere.

**Checked, already correct, left untouched:**
- Command Palette otherwise: focus trap (`useFocusTrap`), body-scroll lock,
  Escape-to-close, `Cmd/Ctrl+K` toggle — all already correct.
- Document→AI handoff: `DocumentQuickActions` already asks "What would you
  like me to do with this?" rather than assuming summarization, and selecting
  a quick action only fills the composer (`setInput`) — it never auto-sends.
  Matches the Phase 13 brief's explicit requirement without any change needed.
- Pomodoro and Focus Mode timers: both use a ref-held `setInterval` cleared in
  the effect's cleanup function; Focus Mode's `visibilitychange` and
  `fullscreenchange` listeners and soundscape are also cleaned up correctly.
  No leaks found.
- Notes/To-Do delete confirmation: still present in both, unregressed since
  Phase 8.
- Settings audio separation: the UI-sounds toggle explicitly states it is
  "separate from the Pomodoro Timer's alarm sound and Focus Mode's background
  soundscape, which each have their own settings on those pages" — the three
  systems remain clearly distinguished, no ambiguous merged control.
  Also re-confirmed the CGPA/SGPA per-row `aria-label` + column-header
  pattern (flagged in the Phase 13 brief as previously-confirmed-legitimate)
  — left untouched as instructed.
- Dashboard/Homepage: scanned for fabricated statistics
  (`Math.random`-derived numbers presented as real data) — found none; 78
  routes confirmed on route-level lazy loading (`React.lazy`) in `App.tsx`,
  unchanged from prior phases.

**Verification — labeled honestly:**
- SOURCE VERIFIED: all files above read directly.
- STATIC VERIFIED: `CommandPalette.tsx` syntax-checked standalone via a
  global `tsc` outside the project's `tsconfig` — the one error reported
  (`Cannot find namespace 'React'` on a pre-existing, unrelated line using
  the same `React.KeyboardEvent` pattern found elsewhere in the codebase) is
  the expected missing-`@types/react` noise from running outside the real
  project, not a defect introduced by this edit; the lines actually changed
  produced no errors.
- TYPECHECK VERIFIED (project-scoped) / LINT VERIFIED / BUILD VERIFIED: NOT
  performed — no network egress in this sandbox, same as Phases 11–12.
- FRESH-ZIP VERIFIED: extracted the packaged ZIP and confirmed file count, no
  forbidden directories/secrets, and the edited file's change intact.
- BROWSER VERIFIED / LIVE VERIFIED: NOT performed — no browser tool this
  session.

**Files changed:** `src/components/CommandPalette.tsx`, `PROJECT_BACKLOG.md`.

**Remaining limitations:** unchanged from Phase 12 — the 320–412px viewport
sweep, live-site verification, and genuine `npm run build`/`tsc -b`/`oxlint`
all require a browser or working network egress, neither available here.

---

## Phase 14 — Continuation Audit (2026-08-19, this session)

Scope: regression-checked Phases 8–13 fixes, then audited genuinely
unexplored areas — AI chat markdown/code/table/long-URL overflow handling,
ConfirmDialog focus-trap default-focus safety, a target-dependent-status
pattern sweep across all calculators (the class of bug Phase 12 found in
Marks Required), PWA manifest/icon integrity, toast `aria-live` semantics,
and a full security/stale-domain/debug-statement re-scan. Same sandbox
constraints as Phases 11–13: no network egress, no browser tool — source/
static audit only.

**Genuine issues found: 0.** Every area investigated this session was
already correct:

- AI chat reading experience: long words/URLs contained via `min-w-0
  break-words` at both the message-row and bubble level; code blocks and
  Mermaid diagrams scroll horizontally within their own `overflow-x-auto`
  container rather than breaking page layout; markdown tables are already
  wrapped in `overflow-x-auto` at generation time (`src/lib/markdown.ts`).
  Nothing here needed a fix.
- `ConfirmDialog`: `useFocusTrap` auto-focuses the *first* focusable
  element in the dialog, which for every destructive-action dialog is the
  Cancel button (DOM order: Cancel, then the danger/confirm button) — so an
  accidental Enter-key press cancels rather than confirms deletion. Focus
  also correctly restores to the previously-focused element on close.
  Already the safe pattern; left untouched.
- Swept `calculations.ts` for the same "ignores the student's target"
  pattern Phase 12 found in Marks Required — Attendance and Assignment
  Score already compare against the actual target; the only generic
  fixed-band scales in the file (letter grade, semester performance) are
  legitimate fixed grading scales, not target comparisons. No other
  instance of the bug class exists.
- PWA: `vite-plugin-pwa` manifest config (icons, maskable icon, theme
  color, standalone display) verified against `public/icons/` — every
  referenced icon file actually exists on disk. Sitemap/OG/Twitter
  metadata all correctly point at the `.vercel.app` production domain, zero
  stale `.com` references anywhere in the tree.
- `ToastProvider`: notification region already uses
  `role="region" aria-live="polite"` — screen readers are already notified
  of toasts correctly.
- Security re-scan: zero hardcoded secrets, zero `console.log`/`debugger`
  in `src/`, no real `.env`, exactly one canonical flame file — unchanged
  from every prior phase's scan.

**Regression check — all prior fixes confirmed still present and intact:**
Phase 8 (Notes/To-Do delete confirmation), Phase 9 (document quick-actions
fill-not-send), Phase 10 (MCQ template, follow-up cap), Phase 11 (silent-
cancellation fix), Phase 12 (Marks Required target-aware status, mobile-nav
Escape), Phase 13 (Command Palette scroll-into-view).

**Verification — labeled honestly:**
- SOURCE VERIFIED: every file listed above read directly.
- STATIC VERIFIED: security/stale-domain/debug-statement scans run via
  grep across the full source tree; icon-file existence checked directly
  against `public/icons/`.
- TYPECHECK VERIFIED (project-scoped) / LINT VERIFIED / BUILD VERIFIED:
  NOT VERIFIED — no network egress in this sandbox, `npm install` still
  fails with the same 403 documented since Phase 11.
- FRESH-ZIP VERIFIED: N/A this session — no source changed, so no new ZIP
  was produced; the Phase 13 ZIP (`allrounder-helper-phase13-final.zip`)
  remains the current verified deliverable.
- BROWSER VERIFIED / LIVE VERIFIED: NOT VERIFIED — no browser tool
  available this session.

**Files changed:** `PROJECT_BACKLOG.md` only — this was a verification
pass with zero genuine defects found, so no source files were touched, and
per the standing "don't invent bugs" rule, none were manufactured to
produce a diff.

**Remaining limitations:** unchanged from prior phases — the 320–412px
viewport sweep, live-site verification, and genuine `npm run build`/
`tsc -b`/`oxlint` all require a browser or working network egress, neither
available in this environment.

**Note on phase numbering:** this file contains multiple unrelated earlier
sessions that reused the same phase numbers (e.g. an "OpenRouter secret
exposure" Phase 14 and a "verification session" Phase 11, both dated
2026-08-17, predate this continuation-prompt series and are unrelated to
the "Phase 11–14" entries dated 2026-08-19 above). This session did not
rewrite or renumber that history — only appended in the numbering scheme
the current continuation-prompt series uses. Future sessions should match
entries by date and heading text, not by phase number alone.

---

## 2026-08-19 — Phase 15: Production-readiness / reliability / workflow audit

**Scope:** Full re-inspection of the actual uploaded source (284 files) against
Priorities A–O (localStorage reliability, AI conversation lifecycle, error
recovery, offline behavior, routing/deep links, first-use UX, destructive-
action correctness, calculator edge cases, date/time, PWA lifecycle,
accessibility, bundle structure, AI provider failover, security).

**Actually changed:**
- `src/lib/markdown.ts` — real, exploitable XSS. Markdown image/link syntax
  (`![alt](url)` / `[label](url)`) interpolated the captured `alt` and `url`
  text directly into `alt="…"` / `href="…"` / `src="…"` HTML attributes
  without escaping quote characters, before being rendered via
  `dangerouslySetInnerHTML` in `MarkdownRenderer.tsx`. A crafted string such
  as `![" onerror="alert(1)](x)` breaks out of the `alt` attribute and adds
  a live `onerror` handler that executes on render — reachable via any AI
  response (a compromised/malicious provider, or a prompt-injected document
  being summarized), and via imported/merged conversation JSON. Added
  `escapeAttr()` (escapes `"`/`'` only, since `&`/`<`/`>` are already
  neutralized earlier in `inline()`) and applied it to both the alt text and
  the post-`safeUrl()` URL for both images and links. `safeUrl()`'s
  protocol allowlist was already correct and is unchanged; this closes the
  separate attribute-breakout path that existed independent of protocol
  filtering.

**Already correct — VERIFIED, NO CHANGE:**
- `useLocalStorage` — SSR-safe, malformed-JSON-safe, type-mismatch-safe,
  quota/private-mode write failures caught and swallowed.
- `useConversations` — soft-delete/restore/permanent-delete, duplicate
  (independent IDs, not shared references), import (always a new copy),
  merge, blob-URL revocation on delete/clear-context, active-conversation
  cleared correctly when the open conversation is deleted.
- `providerOrchestrator.sendWithFailover` — timeout+retry+failover chain,
  stream-reset signal between attempts to prevent duplicated partial text,
  defensive catch around providers that throw instead of resolving an error
  result, cancellation vs. timeout correctly distinguished.
- Server-side AI proxy pattern (`api/ai/*.ts`) — OpenRouter and all other
  providers keep real keys server-side only; no `VITE_*` secret exposure
  found anywhere in `src/`.
- Calculator division-by-zero guards — every page (`PercentageCalculator`,
  `MarksRequired`, `AssignmentScore`, `ExamScore`, `SemesterPercentage`)
  gates its `useMemo` result behind `total > 0`; `calculateCGPA`/
  `calculateAttendance` guard `totalCredits === 0` / `target === 100`
  internally. CGPA grade/credit inputs are clamped at entry (0–10, ≥0).
- `MermaidDiagram` — `securityLevel: 'strict'`, no separate sanitization
  needed.
- Lazy-route chunk-load failures (the `vite:preloadError` class of bug) —
  already caught by the existing `ErrorBoundary` around the route
  `Suspense` boundary, which surfaces a "Reload page" action; this recovers
  correctly since a reload fetches the current `index.html`/chunk map.
- Regression check — all prior fixes (Phases 8–14: Notes/To-Do delete
  confirmation, document quick-actions fill-not-send, MCQ template,
  follow-up cap, silent-cancellation fix, Marks Required target-aware
  status + 0–100 bounds, mobile-nav Escape, Command Palette
  scroll-into-view, OpenRouter server-side proxy) confirmed still present
  and intact by direct source inspection.

**Verification — labeled honestly:**
- SOURCE VERIFIED: every file referenced above read directly from the
  actual uploaded ZIP (284 files, matches the prior baseline).
- STATIC VERIFIED: `grep`-based scans across `src/` and `api/` for hardcoded
  secrets, `console.log`/`debugger` statements, and unsafe
  `dangerouslySetInnerHTML` usage; both instances found were reviewed by
  hand (one fixed above, one already safe).
- TYPECHECK / LINT / BUILD: NOT VERIFIED — `npm install` fails with
  `403 Forbidden` against the npm registry in this sandbox (no network
  egress), so neither `tsc -b`, `oxlint`, nor `vite build` could be run
  against real dependencies.
- FRESH-ZIP VERIFIED: this session's final ZIP was extracted fresh and its
  file tree/count compared against the working copy before being presented.
- BROWSER / LIVE: NOT VERIFIED — no browser tool available this session.

**Files changed:** `src/lib/markdown.ts`, `PROJECT_BACKLOG.md`.

**Remaining limitations:** unchanged from prior phases — real
`npm run build`/`tsc -b`/`oxlint` and the 320–412px viewport sweep still
require working network egress or a browser, neither available here.

---

## 2026-08-19 — Phase 16: Security, data integrity & production hardening

**Scope:** No new project ZIP was uploaded for this phase; continued directly from the
Phase 15 working source (284 files, confirmed on disk before starting). Focus areas per
the phase brief: deep Markdown/rendering security, conversation import/export integrity,
localStorage corruption resilience, AI race conditions, date/time correctness.

**Actually changed:**
- `src/features/ai/components/ChatMessageBubble.tsx` (`AttachmentThumb`) — real XSS,
  reachable via "Import chat". `previewUrl` is documented and intended to always be a
  same-session `blob:` object URL created by `URL.createObjectURL` (see
  `AttachmentBar.tsx`) — never user-typed. But `ChatMessage.attachments` flows through
  "Import chat" (`importConversation`) with no validation on the `attachments` array, and
  React does not sanitize `href`/`src` protocol values. A crafted import file with
  `attachments: [{ previewUrl: 'javascript:...', ... }]` would render a thumbnail whose
  `<a href>` executes attacker JS in the app's origin on click. Fixed at the one place this
  value reaches the DOM: `AttachmentThumb` now requires `previewUrl.startsWith('blob:')`
  before rendering it as a link/image `src`, otherwise falling back to the existing
  "(expired)" chip — the same UI already used for legitimately-stale blob URLs, so no new
  UI state was introduced.
- `src/features/ai/logic/useConversations.ts` — two related data-integrity gaps:
  1. `importConversation` validated only that each message's `content` was a string. A
     message with a missing/invalid `role` or `createdAt` (plausible in a hand-edited or
     older-format export) would pass through unchanged; `mergeConversations` later sorts
     messages with `a.createdAt.localeCompare(b.createdAt)`, which throws a `TypeError` on
     `undefined`. The first time a student merged such an imported conversation with
     another, the merge action would fail with an uncaught exception (event-handler errors
     aren't caught by the route `ErrorBoundary`, so it would fail silently with no visible
     feedback).
  2. More generally, `useLocalStorage`'s read-time validation only checks the top-level
     value is an array — it never validated individual conversation/message shape. A
     manually edited or partially-corrupted `localStorage` entry could crash sorting
     (`visible`, `mergeConversations`) or spreading (`appendMessage`'s
     `[...c.messages, message]` when `messages` isn't actually an array) anywhere in the
     hook.
  Added `sanitizeMessage`/`sanitizeConversation` — a flat, single-shape per-field repair
  (not a versioned migration system) that fixes/defaults `role`, `createdAt`, `updatedAt`,
  `messages` (array-or-empty), `folder`, `pinned`/`archived` (coerced boolean), and drops
  only entries with no usable `id`. Applied both to `importConversation`'s normalization
  and, via a small `setConversations` wrapper around the raw storage setter, to every read
  and write path in the hook — so a corrupted entry self-heals on the next write instead of
  crashing. Deliberately does **not** touch `isStreaming`/`pinned`/`attachments` beyond
  type-coercion, since resetting those on every read would break live-streaming UI state.
- `src/features/academic/logic/calculations.ts` (`evaluateScientificExpression`) — the
  post-substitution validation regex was a character class `[0-9+\-*/().\s%@sqrt@]` where
  `sqrt` was written as individual characters `s`,`q`,`r`,`t` rather than matched as the
  literal 4-character `@sqrt@` placeholder token, so those four letters were incidentally
  accepted anywhere in the expression, not just as part of the intended placeholder. Given
  the fully restricted remaining alphabet (digits/operators/whitespace/`%`/`@` only, no
  other letters), this was not reachable as real code execution — `new Function`'s input
  here is always the student's own keypad-entered expression, evaluated in their own tab,
  with no path for cross-user or imported content to reach it — but tightened anyway as
  cheap defense-in-depth: the placeholder is now stripped by matching the actual `@sqrt@`
  token before the character-class check runs.

**Already correct — VERIFIED, no change:**
- Full project-wide scan for `dangerouslySetInnerHTML`/`innerHTML`/`outerHTML`/`eval`/
  `new Function` found exactly the two known `dangerouslySetInnerHTML` sites
  (`MarkdownRenderer`, already fixed in Phase 15; `MermaidDiagram`, `securityLevel: strict`)
  plus the one `new Function` addressed above — no other instances anywhere in `src/`.
- Date/time: `dateKey`/`todayKey` implementations across `calendarDateUtils.ts`,
  `dailyPlannerTypes.ts`, `habitTypes.ts`, and `focusModeTypes.ts` all consistently build
  keys from local `getFullYear()`/`getMonth()`/`getDate()` — none use `toISOString()`
  (which would shift the date near local midnight for any timezone ahead of UTC, e.g.
  India). `habitTypes.ts`'s streak-gap calculation also correctly parses stored date keys
  with an explicit `T00:00:00` local-time suffix rather than letting the bare `YYYY-MM-DD`
  form parse as UTC midnight.
- AI streaming/race-condition handling (`providerOrchestrator.sendWithFailover`,
  `AiAssistantPage`'s cancellation/abort wiring, `Stopped.` confirmation) — re-traced
  against the specific race scenarios in this phase's brief (switch-conversation-mid-stream,
  delete-during-stream, stop-then-late-response, retry-double-append); the existing
  abort-signal + response-target-conversation-id design already isolates these correctly.
- Server-side AI proxy pattern (`api/ai/*.ts`) — re-confirmed, no `VITE_*` secret exposure.
- PWA update/cache lifecycle — unchanged from Phase 15's finding: `vite:preloadError`-class
  chunk-load failures are already caught by the route-level `ErrorBoundary`, which offers a
  working "Reload page" recovery action.

**Verification — labeled honestly:**
- SOURCE VERIFIED: every file referenced above read directly; no new project ZIP was
  uploaded this phase, so work continued on the verified Phase 15 source (284 files,
  recount confirmed before starting).
- STATIC VERIFIED: project-wide grep sweep for HTML-injection/eval-like patterns and
  hardcoded secrets; both real findings above were confirmed by hand-tracing the actual
  data flow (import → render) rather than from the grep match alone.
- TYPECHECK / LINT / BUILD: NOT VERIFIED — `npm install` re-attempted this session and
  still fails with `403 Forbidden` against the npm registry (no network egress).
- FRESH-ZIP VERIFIED: this session's final ZIP was extracted fresh and its file tree/count
  compared against the working copy before being presented.
- BROWSER / LIVE: NOT VERIFIED — no browser tool available this session.

**Files changed:** `src/features/ai/components/ChatMessageBubble.tsx`,
`src/features/ai/logic/useConversations.ts`, `src/features/academic/logic/calculations.ts`,
`PROJECT_BACKLOG.md`.

**Remaining limitations:** unchanged — real `npm run build`/`tsc -b`/`oxlint` and the
320–412px viewport sweep still require network egress or a browser, neither available here.

---

### 2026-08-19 — Phase 17: Production Resilience, Security Regression & Release Readiness

**Actually changed:**

- **Malformed `attachments` field could permanently crash a conversation (data-integrity /
  DoS bug).** `sanitizeMessage`/`sanitizeConversation` (the storage-read repair boundary
  added in Phase 16.2) validated `role`/`createdAt` but passed the `attachments` field
  through completely unvalidated. Every real consumer of `message.attachments`
  (`ChatMessageBubble`'s `.filter(...)` calls, `attachmentsWithText`/`hasAttachmentText` in
  `attachmentTypes.ts`, used by `promptBuilder.ts` and `AiAssistantPage.tsx`) assumes it is
  either `undefined` or a genuine array of attachment objects, with no defensive check of
  their own. A corrupted localStorage record (manual edit, extension interference, a future
  serialization bug) or a hand-edited "Import chat" JSON file could set `attachments` to any
  JSON value — a string, a plain object, a number. The first `.filter()` call on that value
  throws, the route-level `ErrorBoundary` catches it and shows "Reload page," but reloading
  re-reads the same corrupted record from storage and crashes again — an unrecoverable loop
  for that conversation with no in-app way out. Root cause: the Phase 16.2 sanitizer's field
  coverage didn't extend to `attachments`. Fix: added `sanitizeAttachments()`, applied in both
  `sanitizeMessage` (the storage-read path) and `importConversation` (the untrusted-import
  path, which built its message shape independently rather than through `sanitizeMessage`).
  Non-array values become `undefined`; individual array items missing a string `id`/`name`
  are dropped rather than repaired, since every other field is legitimately optional and
  there's no safe default for e.g. `previewUrl`/`status`. Existing valid attachments
  (including live, still-`blob:` ones) round-trip unchanged — this only removes what was
  already unusable. No effect on the Phase 16.1 `blob:`-only render guard in
  `ChatMessageBubble.tsx`, which stays in place as defense-in-depth for whatever survives
  sanitization.
- **Unbounded "Import chat" file read (DoS hardening).** `importChat()` in
  `AiAssistantPage.tsx` read the entire selected file via `FileReader` and `JSON.parse`
  before any validation. A real export is plain text with no embedded images (attachment
  previews are session-local `blob:` URLs, never serialized), so it's realistically at most a
  few MB; a much larger file is virtually certain to be the wrong file, and reading/parsing
  it fully can freeze the tab. Added a 20MB pre-read size check with a clear toast, mirroring
  the existing `MAX_ATTACHMENT_SIZE` pattern in `attachmentTypes.ts`. Legitimate exports are
  unaffected.

**Already correct (re-traced this phase, not just re-asserted):**

- Markdown → HTML pipeline (`src/lib/markdown.ts`): traced `inline()`/`renderTable()` by
  hand for hostile `alt`/URL values (quote-breaking, `javascript:`/`data:`/`vbscript:`
  protocols, encoded/whitespace-padded protocols). `&`/`<`/`>` are escaped before the
  image/link regexes run, `escapeAttr()` correctly covers the remaining quote characters
  without double-encoding, and `safeUrl()`'s allowlist still rejects every non-`http(s)`/
  `mailto`/`tel`/`#`/`/` scheme tested. (Note: `safeUrl()` does allow bare `/`-prefixed
  values, which also matches protocol-relative `//host` — that's an open-redirect-style
  concern, not script execution, and was already an intentional tradeoff to allow internal
  links; left unchanged.)
- `ChatMessageBubble.tsx`'s `blob:`-only attachment preview guard (Phase 16.1) — confirmed
  still the single DOM boundary for `previewUrl`, still enforced.
- `MermaidDiagram.tsx` — `securityLevel: 'strict'`, render is cancellation-safe (`cancelled`
  flag prevents a stale render from committing after unmount/code change).
- AI race-condition matrix (switch-conversation-mid-stream, delete-during-stream,
  stop-then-late-response, retry, continuation-stop, navigate-away, reload-during-generation)
  — re-read `providerOrchestrator`/`AiAssistantPage` abort wiring against this phase's
  scenario list; request-identity + `AbortController` design still isolates all of them.
  VERIFIED — NO CHANGE.
- Routing/chunk failure: `App.tsx` wraps `Suspense`(lazy routes) inside `ErrorBoundary`; a
  failed dynamic import surfaces the boundary's "Reload page" UI rather than a blank screen.
  VERIFIED — NO CHANGE.
- PWA config (`vite.config.ts`): `registerType: 'autoUpdate'`, sensible manifest/icons,
  `navigateFallbackDenylist` correctly excludes `/api`. No lifecycle change made.
- Marks Required target-aware status/bounds (Phase 12): re-confirmed the calling page
  (`MarksRequiredPage.tsx`) still guards `total > 0` before the calculator ever runs, so the
  division-by-zero path can't be reached from the UI. VERIFIED — NO CHANGE.
- `useLocalStorage`: read path already discards unparseable/shape-mismatched JSON and falls
  back to the initial value instead of throwing; write path already fails silently (try/catch)
  on quota/private-mode errors rather than crashing or falsely reporting success anywhere in
  this hook itself. VERIFIED — NO CHANGE.
- `previewUrl`/object-URL lifecycle: `revokeMessageBlobUrls` is called on message delete,
  conversation permanent-delete, and `clearContext` — confirmed no path leaves a `blob:` URL
  referenced only by now-discarded state without revocation.

**Verification — labeled honestly:**
- SOURCE VERIFIED: fresh ZIP extracted this session, file count re-confirmed at 284 against
  the Phase 16 baseline before any changes; all files discussed above read directly from the
  current source.
- STATIC VERIFIED: hand-traced data flow (not just grep) for the Markdown/attachment/
  sanitizer findings above; targeted greps confirmed no other call sites read
  `message.attachments` without going through the now-sanitized value.
- TYPECHECK: NOT VERIFIED — no network egress in this environment (`npm install` returns
  `403`, confirmed again this session), so `tsc -b` can't run against real installed types.
- LINT: NOT VERIFIED — same reason (`oxlint` not installed, no `node_modules`).
- BUILD: NOT VERIFIED — same reason (`vite build` unavailable without dependencies).
- FRESH-ZIP VERIFIED: final ZIP extracted fresh and its file tree/count compared against the
  working copy before being presented.
- BROWSER: NOT VERIFIED — no browser tool available this session.
- LIVE: NOT VERIFIED — no live deployment accessible from this environment.

**Files changed:** `src/features/ai/logic/useConversations.ts`,
`src/features/ai/pages/AiAssistantPage.tsx`, `PROJECT_BACKLOG.md`.

**Remaining limitations:** unchanged — real `npm run build`/`tsc -b`/`oxlint` and a real
browser/viewport sweep still require network egress or a browser tool, neither available in
this session.

---

### 2026-08-19 — Phase 18: Production Hardening, Release Validation & Final Unexplored-Risk Audit

**Actually changed:**

- **Exported chat JSON silently embedded dead session-local `blob:` URLs (data-integrity bug,
  Priority C).** `exportChat('json')` in `AiAssistantPage.tsx` serialized the raw `active`
  conversation object via `JSON.stringify(active, ...)`, which includes each attachment's
  `previewUrl` verbatim. `previewUrl` is created via `URL.createObjectURL()` and is only ever
  valid for the lifetime of the Blob in the current tab (`AttachmentBar.tsx`); the code
  already carried a comment above the *import* size-limit claiming "attachment previewUrls
  are session-local blob: URLs and are never serialized into the export" — that claim was
  false for the actual export path, just true for every other path that touches attachments.
  Re-importing that JSON (same session or a different one, immediately or after a reload)
  goes through `importConversation` → `sanitizeAttachments`, which only checks that `id`/
  `name` are strings — it has no way to know a `blob:`-prefixed string is stale, so the dead
  URL is stored as if it were live. `ChatMessageBubble`'s render guard only checks the
  `blob:` prefix (Phase 16.1), which a stale blob URL still satisfies, so the browser
  attempts to load it and the thumbnail renders permanently broken with no recovery path
  short of manually removing the attachment. Root cause: the export path bypassed every
  existing sanitization boundary by shipping the live in-memory object directly. Fix: export
  now maps over `active.messages` and strips each attachment's `previewUrl` before
  stringifying, so an imported attachment falls back to its existing non-preview "download"
  treatment instead of a broken image. No other attachment fields were touched; `id`/`name`/
  `size`/`type`/`text`/`status` all still round-trip. Existing stored conversations are
  unaffected — this only changes what a *future* export contains.
- **"Import backup" (Settings → Data management) had no pre-read file-size guard (DoS
  hardening, Priority D, mirrors the Phase 17 AI-import fix).** `importData()` in
  `SettingsPage.tsx` ran `FileReader` + `JSON.parse` on the full selected file unconditionally
  before any validation — the same pattern Phase 17 fixed for "Import chat," just not carried
  over to this second, independent import flow. A genuine backup (produced by this app's own
  "Export all data," bounded by this origin's localStorage quota) is realistically small, but
  nothing stopped a student from picking the wrong file — any large unrelated JSON, or a
  large file of another type entirely — and freezing the tab while it's fully read and parsed
  before the "not a recognizable backup" error can even fire. Fix: added the same 20MB
  pre-read size check and toast used by `importChat` in `AiAssistantPage.tsx`, before the
  `FileReader` is created. Legitimate backups are far under this and are unaffected.

**Already correct (re-traced this phase, not just re-asserted):**

- Markdown escaping / `safeUrl()` allowlist (Phase 15), Mermaid `securityLevel: 'strict'`,
  attachment `blob:`-only render guard (Phase 16.1), conversation/message/attachment
  sanitization on storage read (Phase 16.2/17), 20MB "Import chat" size guard (Phase 17),
  scientific-calculator expression validation (Phase 16.3) — all re-read directly against
  current source, all still present and correct. VERIFIED — NO CHANGE.
- `providerOrchestrator.sendWithFailover` — re-traced timeout/retry/failover, `AbortController`
  wiring, the `reset` signal that clears stale buffered text across a retry/failover, and the
  defensive catch that converts an unexpected provider throw into a normal error result so
  `isThinking`/`isGenerating` can never get stuck on. VERIFIED — NO CHANGE.
- AI race-condition matrix (`generateResponse` in `AiAssistantPage.tsx`): the conversation `id`
  and `assistantId` are captured as plain local values at the start of the call and passed
  explicitly into every `appendMessage`/`updateMessage`, never re-read from `activeId` state —
  so switching conversations, soft-deleting the source conversation, or navigating away mid-
  stream cannot misdirect an update. Permanently deleting the conversation mid-stream makes
  the subsequent update a harmless no-op (`.map` finds no matching id). VERIFIED — NO CHANGE.
- `useLocalStorage` top-level shape validation (array-vs-object, typeof match) and silent
  write-failure fallback — re-confirmed still in place. VERIFIED — NO CHANGE.

**Verification — labeled honestly:**
- SOURCE VERIFIED: fresh ZIP extracted this session; file count re-confirmed at 284 against
  the Phase 17 baseline before any changes; every file discussed above read directly from
  current source, not from prior reports.
- STATIC VERIFIED: hand-traced the export→import→render data flow for the `previewUrl`
  finding end to end (creation in `AttachmentBar.tsx` → export in `AiAssistantPage.tsx` →
  `sanitizeAttachments`/`importConversation` in `useConversations.ts` → render guard in
  `ChatMessageBubble.tsx`); targeted greps confirmed no other export path exists.
- A brace-balance sanity check was run on both edited files (open/close counts match) as a
  minimal syntax sanity check — this is not a substitute for a real typecheck.
- TYPECHECK: NOT VERIFIED — no network egress in this environment (`npm install` returns
  `403`, confirmed again this session), so a real `tsc -b` can't run against installed types.
  A global standalone `tsc` binary exists but pointing it at individual files without
  `node_modules` produces thousands of unrelated "cannot find module 'react'" errors and
  is not meaningful — not run as a claimed check.
- LINT: NOT VERIFIED — same reason (`oxlint` not installed, no `node_modules`).
- BUILD: NOT VERIFIED — same reason (`vite build` unavailable without dependencies).
- FRESH-ZIP VERIFIED: final ZIP extracted fresh this session and its file tree/count compared
  against the working copy before being presented.
- BROWSER: NOT VERIFIED — no browser tool available this session.
- LIVE: NOT VERIFIED — no live deployment accessible from this environment.

**Files changed:** `src/features/ai/pages/AiAssistantPage.tsx`,
`src/pages/dashboard/SettingsPage.tsx`, `PROJECT_BACKLOG.md`.

**Remaining limitations:** unchanged — real `npm run build`/`tsc -b`/`oxlint` and a real
browser/viewport sweep still require network egress or a browser tool, neither available in
this session. Priorities G (routing/lazy-load), H (PWA lifecycle), I (document pipeline), J/K
(calculator math/date edge cases), L (accessibility after state transitions), and N
(performance/memory) were not re-traced this phase beyond what earlier phases already
verified — Phase 18 focused on the two genuinely new findings above (Priorities C and D) and
re-confirming the AI race-condition/orchestrator design (Priorities E/F) rather than repeating
every earlier area from scratch, per the phase's own "unexplored risk" framing.

## 2026-08-19 — Phase 19: Production release / resilience / security regression audit

**Scope:** Full re-inspection of the actual uploaded source (284 regular files, 49
directories — re-confirmed against the Phase 17/18 baseline before any work) against
Priorities A–S (release baseline, real toolchain, Markdown/XSS regression, import/export
trust boundary, import DoS, localStorage resilience, AI failure matrix, AI request
identity, PWA update safety, routing/deep links, calculator edge cases, date/time,
accessibility after actions, file upload safety, performance/memory, first-use
experience, student trust, secondary security scan).

**Actually changed:** none. No genuine bug was found this phase.

**Already correct (re-traced this phase, not just re-asserted):**
- `safeUrl()` in `src/lib/markdown.ts` — re-tested against `javascript:`, `data:`,
  `vbscript:`, encoded/whitespace-padded protocols, and protocol-relative `//host`
  values. Behavior is unchanged from Phase 18: the allowlist correctly rejects every
  script-executing protocol; the bare-`/`-prefix rule still also matches `//host`, which
  is a documented, intentional open-redirect-style tradeoff (not script execution) to keep
  internal relative links working — left unchanged, consistent with the Phase 18 note.
  `escapeAttr()` quote-breakout fix (Phase 15) still applied to both image and link
  attributes. VERIFIED — NO CHANGE.
- `evaluateScientificExpression()` in `src/features/academic/logic/calculations.ts` — the
  Phase 16.3 character-class fix (matching the literal `@sqrt@` token rather than a stray
  `s`/`q`/`r`/`t` character class) is still in place; hand-traced additional hostile inputs
  (bare `sqrt(` typed directly instead of via `√`, injected identifiers, `constructor`/
  `prototype` strings) and confirmed all are rejected by the restricted character-set check
  before `new Function` ever runs. VERIFIED — NO CHANGE.
- Conversation/message/attachment sanitization (`useConversations.ts`) — confirmed
  `sanitizeConversation`/`sanitizeMessage`/`sanitizeAttachments` are applied on every
  storage read and on every mutator's `prev`, so a Settings-backup import writing a
  malformed `ar-ai-conversations` value directly to `localStorage` (it does not go through
  the sanitizer at write time) is still caught and repaired the next time that key is read.
  VERIFIED — NO CHANGE.
- 20MB pre-read size guards on both "Import chat" (`AiAssistantPage.tsx`) and Settings
  "Import backup" (`SettingsPage.tsx`) — still present; Settings import still rolls back
  every key it had already written if a later key's `localStorage.setItem` throws, so a
  partial/failed backup import cannot leave a half-applied state. VERIFIED — NO CHANGE.
- `previewUrl` export/import round-trip — export still strips `previewUrl` from attachments
  before serializing (Phase 18); `ChatMessageBubble.tsx`'s `blob:`-only render guard is
  still the single DOM boundary for whatever `previewUrl` value survives import.
  VERIFIED — NO CHANGE.
- Object-URL lifecycle across the document tools (`ImageTransformWorkspace.tsx`,
  `ImageCropperPage.tsx`, `ImageToPdfPage.tsx`, `ImageMetadataViewerPage.tsx`,
  `OcrTextExtractionPage.tsx`, `QrScannerPage.tsx`, `fileUtils.ts`'s `downloadBlob`) —
  every `createObjectURL` call site has a matching `revokeObjectURL` on replace/unmount/
  clear. VERIFIED — NO CHANGE.
- Pomodoro/Focus timer cleanup (`PomodoroTimerPage.tsx`, `FocusModePage.tsx`) — both
  `setInterval` calls are cleared in their effect's cleanup function. VERIFIED — NO CHANGE.
- PWA config (`vite.config.ts`) — `registerType: 'autoUpdate'`, `navigateFallbackDenylist`
  still excludes `/api`, manifest/icons unchanged. VERIFIED — NO CHANGE.
- Provider orchestrator failover/abort wiring and AI request-identity matrix — re-read
  against this phase's scenario list (stop-then-late-response, retry, continuation-stop,
  reload-during-generation); design unchanged from Phase 18. VERIFIED — NO CHANGE.

**Verification — labeled honestly:**
- SOURCE VERIFIED: fresh ZIP extracted this session; regular-file count re-confirmed at 284
  (49 directories) against the Phase 18 baseline before any inspection.
- STATIC VERIFIED: hand-traced the Markdown/URL-attribute pipeline, the scientific
  calculator's expression sanitizer, and the import/export/sanitization chain end to end
  against this phase's adversarial-input checklist.
- TYPECHECK: NOT VERIFIED — no network egress in this environment (`npm install` returns
  `403 Forbidden` from the registry, confirmed again this session), so `tsc -b` cannot run
  against real installed types.
- LINT: NOT VERIFIED — same reason (`oxlint` not installed, no `node_modules`).
- BUILD: NOT VERIFIED — same reason (`vite build` unavailable without dependencies).
- FRESH-ZIP VERIFIED: final ZIP will be extracted fresh after packaging and its file
  tree/count compared against the working copy.
- BROWSER: NOT VERIFIED — no browser tool available this session.
- LIVE: NOT VERIFIED — no live deployment accessible from this environment.

**Files changed:** `PROJECT_BACKLOG.md` only.

**Remaining limitations:** unchanged — real `npm run build`/`tsc -b`/`oxlint` and a real
browser/viewport sweep still require network egress or a browser tool, neither available in
this session. This phase re-traced Priorities C, D, E/F, G (AI), K, N, and the PWA config
in depth; Priorities J (routing/deep links beyond chunk-failure recovery), L (date/time
streak edge cases), M (accessibility live-region/focus audit), and P (first-use empty
states) were re-read at a lighter level than Phase 15's original full pass and were not
found to have regressed, but were not re-traced with the same depth as the areas above.

## 2026-08-20 — Phase 20: Final production readiness / release engineering / deep UX audit

**Scope:** Priorities A–S from the Phase 20 brief — release-blocking functionality across
every major route, persistence-failure resilience, data corruption/recovery, import/export
fidelity, AI Assistant lifecycle, AI provider failure matrix, document/OCR reliability,
calculator edge cases, date/time, routing/deployment resilience (including Vite's
`vite:preloadError` dynamic-import-failure path), PWA update lifecycle, offline
classification, accessibility after actions, first-use experience, performance/memory,
final security regression, and AI/untrusted-content boundaries.

**Actually changed — one real bug found and fixed:**

- **False "Saved" confirmation on persistence failure (Notes and AI Settings).**
  - *Issue:* `useLocalStorage` wrote to `localStorage` inside a `try/catch` that silently
    swallowed any failure (quota exceeded, private-browsing restrictions, storage
    disabled) and returned only `[value, setValue]` — callers had no way to know a write
    had failed.
  - *Realistic scenario:* A student writing a long note in a browser with storage nearly
    full, or in a private/incognito tab that blocks `localStorage.setItem`, would see the
    Notes page's "Saved" indicator turn green — and AI Settings' "Saved" confirmation fire
    — exactly as if persistence had succeeded, even though the write had silently failed
    and the content only existed in that tab's memory. Closing the tab would lose it with
    no warning ever shown.
  - *Root cause:* the write-failure was caught and discarded at the lowest layer, so
    every consumer's "Saved" UI was necessarily optimistic rather than reflecting the
    actual outcome.
  - *Fix:* `useLocalStorage` now also returns a `persistError` boolean reflecting whether
    the most recent write threw, reset to `false` on the next successful write. The
    in-memory value is still preserved either way (existing behavior, unchanged) — only
    the signal of what happened is now honest. `NotesPage` now has a `saveStatus` of
    `'error'` (shown as "Not saved — this browser's storage is full or unavailable" in
    red, `role="alert"`) instead of unconditionally reporting `'saved'` after its debounced
    autosave. `useAISettings` forwards the same `persistError` from its
    `useLocalStorage` call, and `AiSettingsPage`'s "Saved" pill now renders in red as
    "Not saved — storage full or unavailable" when the underlying write failed, instead of
    always showing the green "Saved" state.
  - *Why the fix is safe:* purely additive at the hook boundary — `useLocalStorage`'s
    return value grew from a 2-tuple to a 3-tuple, which is source-compatible with every
    existing `[value, setValue]` destructuring call site (58 call sites checked; none
    relied on a fixed-length tuple type). No persistence behavior changed — writes still
    happen the same way and still fail closed (in-memory state preserved on error); only
    two call sites that already displayed an unconditional "Saved" claim were updated to
    read the new signal.
  - *Files changed:* `src/hooks/useLocalStorage.ts`, `src/features/productivity/pages/NotesPage.tsx`,
    `src/features/ai/logic/useAISettings.ts`, `src/features/ai/pages/AiSettingsPage.tsx`.

**Already correct (re-traced this phase, not just re-asserted):**
- Full route table in `App.tsx` — every route (academic tools, productivity, document
  tools, creator tools, AI, dashboard/settings, legal pages) has a real component behind
  it via `lazy()`, and a wildcard `*` → `NotFoundPage` catches unmatched paths. No dead
  routes or missing components found.
- Chunk-load-failure recovery — a failed dynamic `import()` (e.g. a stale chunk hash after
  a new deployment) rejects the promise `lazy()` is waiting on, which React re-throws
  during render; this is caught by the top-level `ErrorBoundary`, which shows "Something
  went wrong" with a "Reload page" button that re-fetches a fresh `index.html` and correct
  chunk hashes. No explicit `vite:preloadError` listener exists, but none is needed for
  correctness here — the render-time throw already reaches the boundary. VERIFIED — NO
  CHANGE.
- Conversation/message/attachment sanitization, 20MB import guards + rollback, export
  `previewUrl` stripping, `blob:`-only preview rendering, `safeUrl()` allowlist + attribute
  escaping, Mermaid strict mode, scientific-calculator expression sanitizer, object-URL
  cleanup across all document tools, Pomodoro/Focus timer cleanup, Notes/To-Do delete
  confirmations — all re-spot-checked, all unchanged and correct. VERIFIED — NO CHANGE.
- Secondary security scan (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`)
  — same three legitimate, already-guarded call sites as prior phases (Markdown renderer,
  Mermaid SVG output, the scientific-calculator evaluator behind its character-set filter);
  no client-side credentials or `.env` values found in source.

**Verification:**
- SOURCE VERIFIED: worked from the actual current project source (284 regular files, 49
  directories, unchanged from Phase 19) — not from historical reports.
- STATIC VERIFIED: hand-traced the routing table, the persistence-failure path (root
  cause found here), and re-confirmed the security/import/export chains against this
  phase's checklist.
- TYPECHECK: NOT VERIFIED — `npm install` still returns `403 Forbidden` from the registry
  in this environment (re-checked this session with both a dry-run, which succeeded
  offline, and a real install, which failed) — no installed types to run `tsc -b` against.
- LINT: NOT VERIFIED — same reason, `oxlint` is not installed.
- BUILD: NOT VERIFIED — same reason, `vite build` unavailable without dependencies.
- FRESH-ZIP VERIFIED: final ZIP extracted fresh after packaging; file count/tree, forbidden
  directories, and required config files checked against the working copy.
- BROWSER: NOT VERIFIED — no browser tool available this session.
- LIVE: NOT VERIFIED — no live deployment accessible from this environment.

**Release assessment: RELEASE-READY WITH ENVIRONMENTAL VERIFICATION PENDING.** Six phases
of adversarial security/reliability auditing (15–20) have found and fixed every genuine
defect surfaced, including one this phase (a real but non-catastrophic trust issue, not a
security vulnerability). No release-blocking defect remains at the source level. What's
still missing is purely environmental: a real `tsc -b`/`oxlint`/`vite build` run and a real
browser/viewport pass, both blocked by this sandbox having no network egress and no
browser tool — not by anything found wrong in the source.

**Files changed:** `src/hooks/useLocalStorage.ts`,
`src/features/productivity/pages/NotesPage.tsx`, `src/features/ai/logic/useAISettings.ts`,
`src/features/ai/pages/AiSettingsPage.tsx`, `PROJECT_BACKLOG.md`.

**Remaining limitations:** real `npm run build`/`tsc -b`/`oxlint` and a real browser/
viewport sweep still require network egress or a browser tool, neither available in this
session. Priorities J (routing/deep links), L (date/time), M (accessibility), N (first-use
empty states), and O (performance) were re-read this phase but not re-traced with full
adversarial depth, consistent with Phase 19's note that they were last given a full pass in
earlier phases.

## 2026-08-20 (continued) — Phase 21: Final production release, AdSense, SEO & monetization audit

**Scope:** Full AdSense/ads.txt/publisher-config audit, SEO route audit (titles, canonicals,
robots, sitemap, structured data, stale-domain scan), Contact form re-verification
(previously flagged high-priority), Google Analytics implementation check, Amazon
affiliate/monetization audit, blog/content inventory (actual counts, not historical
claims), plus regression re-checks of persistence (Phase 20), security (Phase 15–19), and
AI/import-export systems.

**Actually changed:** none. No genuine source bug found this phase.

**AdSense status (source-level):**
- Single `adsbygoogle.js` script in `index.html`, `client=ca-pub-5736847555362725`. No
  duplicate or conflicting scripts found anywhere in `src/`.
- `public/ads.txt` contains exactly one entry: `google.com, pub-5736847555362725, DIRECT,
  f08c47fec0942fa0` — publisher ID matches the script tag. No duplicate/conflicting
  entries.
- No manually-placed `<ins class="adsbygoogle">` ad-slot elements exist in any page. This
  was investigated, not assumed to be a bug: it is consistent with a site awaiting AdSense
  approval (verification script + ads.txt present, ad units deferred until after review) —
  left unchanged per the brief's explicit instruction not to manufacture AdSense changes.
  This is a genuine open question that only Google's review can resolve, not a source
  defect. VERIFIED — NO CHANGE.
- Legal pages (Privacy Policy, Terms, Disclaimer, Cookie Policy, About, Contact) all exist,
  are routed, are in the sitemap, and render via `StaticPageLayout` (which itself renders
  `<Seo>` — the earlier grep for pages missing `<Seo>` was a false positive: SEO is applied
  by shared layout components, not per-page).
- "AdSense implementation verified" / "AdSense-ready" — **not** "AdSense approved"; Google
  approval was not and cannot be confirmed from source.

**SEO status:**
- `public/robots.txt` allows all crawling and points to the correct sitemap URL; no
  accidental `Disallow` rules found.
- `public/sitemap.xml` contains 71 URLs, all on the correct production domain
  (`https://allrounderhelper.vercel.app`), matching `Seo.tsx`'s `SITE_URL` constant.
- Every route was checked for a unique title/description/canonical: calculator, document,
  creator, and productivity tool pages get this via their respective shared layout
  components; static pages via `StaticPageLayout`. No page found rendering without `<Seo>`.
  `noindex` is applied correctly and narrowly — only to the AI Assistant, AI Settings,
  Dashboard, Settings (all personal/client-state-only pages) and to the two placeholder
  category pages (see below) — not to any real content page.
- Stale-domain scan: the only non-production domain reference found
  (`allroundercalculator.pages.dev` in `Footer.tsx`) is an intentional external outbound
  link to a genuinely separate sister project ("ALLROUNDER CALCULATOR"), rendered with
  `target="_blank" rel="noopener noreferrer"` — not a leftover self-reference to an old
  deployment of this project. Left unchanged. No `localhost`, Netlify, or Cloudflare Pages
  self-references found anywhere in source.
- Structured data: only `BreadcrumbList` JSON-LD found anywhere in source. No fake
  `AggregateRating`/`Review` schema exists (checked explicitly — a real AdSense/schema
  policy risk if present; it is not).

**Monetization status:**
- **Blog:** `/blog` is a `ComingSoonCategoryPage` — a real, honest "launching in the next
  release" placeholder listing 5 planned article titles, correctly marked `noindex`. There
  are zero actual articles in the current source. The Phase 21 brief's reference to
  "approximately 18 original articles" does not match the current project — no historical
  entry for that figure exists anywhere in this project's own `PROJECT_BACKLOG.md`,
  `ENGINEERING_DECISIONS.md`, or `FINAL_AUDIT_REPORT.md`, consistent with the backlog's own
  standing warning that historical phase numbers/content can be reused from unrelated
  sessions. Reporting the actual current count rather than the historical claim, per this
  phase's explicit instruction.
- **Finance Tools:** `/finance-tools` is the same `ComingSoonCategoryPage` pattern —
  correctly `noindex`ed, no fabricated calculators.
- **Amazon affiliate:** there is no Amazon product page, product data, or category
  infrastructure inside ALLROUNDER HELPER itself. Product recommendations are handled by a
  client-side keyword detector (`affiliateDetection.ts`) that, only when an AI Assistant
  turn is genuinely about product recommendations (laptops, headphones, creator gear,
  etc.), shows an `AffiliateRecommendationCard` linking out to a **separate sister
  project's** `/amazon-products` page (`artisticaura001.vercel.app`, the same "ARTISTIC
  AURA" project linked from the footer). The card is correctly labeled "Ad", uses
  `rel="noopener noreferrer sponsored"` (correct per Google's guidance for
  affiliate/sponsored links), and carries an explicit disclosure: "Affiliate link — we may
  earn a commission at no extra cost to you." This is real, correctly disclosed, and
  intentionally out-of-scope for this project's own routes/sitemap. VERIFIED — NO CHANGE.

**Contact form — re-verified as explicitly high-priority per the brief:**
- The form is real, not cosmetic. `ContactPage.tsx` POSTs to `/api/contact`, a Vercel Edge
  Function (`api/contact.ts`) that relays through Resend's REST API using a server-only
  `RESEND_API_KEY` (never sent to or readable by the browser). It validates email format
  and non-empty message server-side, escapes all fields before HTML interpolation in the
  outgoing email, applies a 10s timeout, and returns distinct error codes for auth failure
  (502), rate limiting (429), a down email service (502), and timeout (504). The client
  only shows the "sent" confirmation after a real `res.ok` response, shows a real error
  message otherwise (network failure vs. server-reported error are distinguished), and a
  direct `mailto:` fallback is always visible. This is a genuinely working contact form,
  not the broken/cosmetic one an earlier audit flagged. VERIFIED — NO CHANGE (not
  regressed).

**Google Analytics status:**
- Single GA4 property (`G-7X64SK8678`) configured once in `index.html` with
  `send_page_view: false` on init to avoid double-counting, since `RouteAnalytics.tsx`
  (mounted once inside `BrowserRouter`) fires a manual `page_view` on every route change —
  including the initial load — with a `useRef` guard against React StrictMode's double
  effect invocation in development. `trackPageView()` no-ops safely if `gtag` never loaded
  (e.g. blocked by an ad blocker) rather than throwing. No debug/development configuration,
  no PII collected beyond standard GA4 page fields. Cannot confirm live data is actually
  being received by the property — that requires the GA dashboard, an external check.
  VERIFIED — NO CHANGE.

**Already correct (re-traced this phase, not just re-asserted):**
- Phase 20's `persistError` fix (`useLocalStorage`, `NotesPage`, `useAISettings`,
  `AiSettingsPage`) — all 4 call sites still wired correctly. VERIFIED — NO CHANGE.
- Phase 15's Markdown `escapeAttr()`/`safeUrl()` pipeline — still applied to both image and
  link attribute generation. VERIFIED — NO CHANGE.
- Conversation/attachment sanitization, import size guards, export preview-URL stripping —
  spot-checked, unchanged.

**Verification:**
- SOURCE VERIFIED: worked from the actual current project source (284 regular files, 49
  directories — re-confirmed before any work this phase).
- STATIC VERIFIED: AdSense/ads.txt/publisher-ID consistency, full sitemap/robots/canonical
  audit, stale-domain scan, structured-data scan, Contact form request/response chain, and
  Analytics SPA-pageview wiring were all hand-traced end to end.
- TYPECHECK: NOT VERIFIED — `npm install` again returned `403 Forbidden` from the registry
  this session (re-tested).
- LINT: NOT VERIFIED — same reason.
- BUILD: NOT VERIFIED — same reason.
- FRESH-ZIP VERIFIED: final ZIP extracted fresh after packaging; byte-identical to the
  working copy, file count/tree matched, no forbidden directories, no secrets, all required
  config files present.
- BROWSER: NOT VERIFIED — no real browser/viewport tool available this session.
- LIVE: **partially checked, not fully verified.** A single `web_fetch` of
  `https://allrounderhelper.vercel.app` succeeded and returned the expected HTML shell
  (correct title, meta description, Open Graph/Twitter tags, theme color, PWA meta tags) —
  confirming the domain resolves and serves the correct static shell. This is a plain HTTP
  fetch, not a real browser: no JavaScript executed, no client-rendered content visible, no
  console-error check, no interactivity or navigation testing. `ads.txt`/`robots.txt`
  direct fetches were not reachable through this session's fetch-tool restrictions (only
  URLs already surfaced by a prior search or fetch can be fetched). Treat as
  LIVE: PARTIALLY VERIFIED (domain + shell only) rather than full live verification.

**Files changed:** `PROJECT_BACKLOG.md` only.

**Remaining limitations / external verification still required:** real
`npm run build`/`tsc -b`/`oxlint`, a real browser/viewport sweep, and full live-site
interaction testing all remain blocked by this sandbox's lack of network egress and browser
tooling — not by anything found wrong in the source. Additionally, the following are
inherently external and cannot be completed from source: Google AdSense account/site
approval, Google Search Console indexing verification, sitemap submission confirmation,
live Google Analytics data-reception confirmation, and Amazon affiliate account-level
policy compliance (the on-site disclosure and link attributes are correct; account-level
Amazon Associates program compliance is outside what source can confirm).

**Release assessment: B — PRODUCTION READY WITH EXTERNAL VERIFICATION PENDING.** No
source-level release blocker was found across seven audit phases (15–21). AdSense
infrastructure, SEO metadata, the Contact form, and Analytics are all genuinely
implemented and internally consistent. What remains is entirely external: a real
build/lint/typecheck run, a real browser pass, and Google-side approvals/verifications
that no amount of source inspection can substitute for.

## 2026-08-20 (continued) — Phase 22: Final AdSense readiness, content quality, public UX audit

**Scope:** Full content inventory across all public pages, Blog/Finance "Coming Soon"
strategy audit, tool-page content-quality spot checks, internal-linking/navigation audit,
trust/credibility review, and a targeted security/persistence regression, per the Phase 22
brief's explicit anti-filler and source-of-truth instructions.

**Actually changed:** none — zero source and zero content changes. Justified below, not
merely asserted.

**Content inventory (counted, not estimated):**
- 64 total feature/tool pages under `src/features/`. 58 of them (91%) render a full,
  genuine per-tool article via the shared `ToolArticle`/`CalculatorLayout`/
  `DocumentToolLayout`/`CreatorToolLayout` pattern: intro, why-it-matters, a numbered
  how-it-works sequence, 2+ worked examples, common mistakes, tips, and an FAQ section
  that also emits real `FAQPage` JSON-LD (only when the visible FAQ content actually
  matches, not fabricated schema).
- The remaining 6 productivity-family pages (Notes, Study Planner, Calendar, Focus Mode)
  plus one creator tool (DPI Calculator) use the equivalent `PageInfoSection` component
  with the same structure. AI Assistant, AI Settings, Analytics, and the three category
  index pages (Productivity/Document/Creator) intentionally have no per-tool article —
  correct, since they are either app-state UI (correctly `noindex`ed) or navigational
  index pages that instead carry their own real description text.
- Spot-checked several pages (e.g. `CompressPdfPage`) for genuineness: content is
  specific to the actual tool and problem (e.g. explains upload-size caps on learning
  portals causing rejected PDF submissions), not generic filler or keyword-stuffed
  boilerplate.
- No duplicate tool slugs found across academic/document/creator registries.
- **Conclusion: the site is not thin.** The characterization inherited from Phase 21 (that
  Blog/Finance being placeholder is "one of the most important remaining weaknesses") was
  about the Blog specifically, not the site's overall content sufficiency — the tool
  pages alone constitute a large, genuinely useful body of original content.

**Blog / Finance "Coming Soon" — re-audited, left unchanged, confirmed correctly handled:**
- Both routes render an honest "Launching in the next release" placeholder (no false
  claim of being a working blog or finance-tools section).
- Both are `noindex`ed and **excluded from `sitemap.xml`** (verified: no `blog`/`finance`
  entries in the sitemap).
- Neither is linked from header/footer navigation or the Command Palette — verified via
  direct grep, zero matches in either. A student browsing normal navigation would never
  land on an empty placeholder; the pages are only reachable by a visitor typing the URL
  directly. This is exactly the low-risk handling Priority I of the brief asks for, so no
  change was made.
- Per the brief's explicit anti-filler rule and its instruction to only add content that
  "fills a genuine gap": given the tool pages already provide substantial, genuine content
  site-wide, and given the material risk of a single AI-authoring pass producing content
  that reads as generic or insufficiently vetted, no blog articles were manufactured this
  phase. This is a deliberate decision, not an oversight — recorded honestly as a content
  gap that remains, distinct from the site being "thin" overall.

**AdSense/SEO — re-verified, no change:**
- Publisher ID / `ads.txt` / script consistency, `robots.txt`, `sitemap.xml` (71 URLs, all
  correct production domain), and the FAQ/breadcrumb-only structured data (no fabricated
  ratings, reviews, or organization claims) were all re-checked against Phase 21's findings
  and remain correct.

**Trust/credibility:** About and Contact pages make no fabricated credentials, no
fabricated testimonials, no fabricated statistics — re-confirmed by direct reading, not
assumed from Phase 21's report.

**Security/persistence regression (targeted, not a full re-audit):**
- Markdown `escapeAttr()`/`safeUrl()` — both still applied in `markdown.ts`.
- Mermaid `securityLevel: 'strict'` — still set.
- `persistError` — still wired through `useLocalStorage` → `NotesPage`/`useAISettings` →
  `AiSettingsPage` (Phase 20 fix intact).
All VERIFIED — NO CHANGE.

**Verification:**
- SOURCE VERIFIED: current 284-file / 49-directory source (re-confirmed before work).
- STATIC VERIFIED: content inventory, Coming Soon nav/sitemap exclusion, and the targeted
  security/persistence regression were all hand-traced against the actual source.
- TYPECHECK / LINT / BUILD: NOT VERIFIED — `npm install` again returned `403 Forbidden`
  (re-tested this session).
- FRESH-ZIP VERIFIED: final ZIP extracted fresh, compared against the working copy.
- BROWSER: NOT VERIFIED.
- LIVE: NOT VERIFIED this phase (no new fetch performed; Phase 21's partial HTML-shell
  fetch stands as the only live data point and is not re-claimed here as browser/JS
  verification).

**AdSense readiness classification: B — technically ready, one content improvement
recommended before submission (not required).** Infrastructure (ads.txt, script, legal
pages, SEO, Analytics) is consistent and correct. The site's actual content is genuinely
substantial across 90%+ of its tool pages, not merely infrastructure-deep. The Blog
section remains a real, honestly-labeled, low-visibility gap — recommended as a future
content investment, not a blocker, since it is neither indexed nor discoverable through
normal navigation and therefore does not itself present as unfinished to a reviewer or
visitor who isn't specifically probing for its URL.

**Files changed:** `PROJECT_BACKLOG.md` only.

**Remaining limitations:**
- SOURCE: none identified this phase.
- ENVIRONMENTAL: real `npm run build`/`tsc -b`/`oxlint` and a real browser/viewport pass
  remain blocked by this sandbox's lack of network egress and browser tooling.
- EXTERNAL (Google/AdSense): actual AdSense review/approval, Search Console indexing
  confirmation, and live Analytics data confirmation all remain outside what source
  inspection can verify or complete.

---

## Phase 24 — 2026-08-20 — Production launch verification pass

**Scope:** move from source-verified to actually-run toolchain verification; attempt
live-site verification; final concise security regression; single release zip.

**Actual changes:** NONE. No source or content files modified except this entry.

**Toolchain (this session's sandbox had working npm registry access, unlike the prior
entry above):**
- `npm install` — succeeded (580 packages).
- `npx oxlint` — 0 errors, 5 pre-existing warnings (same as Phase 23; all previously
  explained false-positive/stylistic, none security-relevant).
- `npx tsc -b` — clean, no errors.
- `npx tsc -p tsconfig.api.json --noEmit` — clean, no errors.
- `npm run build` — succeeded; PWA precache generated (284 entries); no source maps
  emitted to `dist/`; `ads.txt`/`robots.txt`/`sitemap.xml`/`manifest.webmanifest` all
  present in build output.
- Scanned built `dist/assets/*.js` for leaked API keys/secrets (Gemini, OpenAI, Resend,
  Mistral, Cerebras, xAI, Cloudflare, OpenRouter, Pollinations key patterns and env-var
  names) — only found the *names* of env vars inside user-facing "not configured" error
  strings (e.g. "Set GEMINI_API_KEY on the server..."), never a real key value. No
  secrets are bundled into the client.

**Security regression (16-point mandatory list) — all VERIFIED, NO CHANGE:**
Markdown `escapeAttr`/`safeUrl`, Mermaid `securityLevel: 'strict'`, attachment
`previewUrl` blob: validation, `sanitizeAttachments`/`sanitizeMessage`/
`sanitizeConversation`, both 20MB import guards (Import Chat + Settings backup),
`previewUrl` export stripping, server-only provider key proxying, scientific-expression
character allowlist before `new Function`, `persistError` wiring, `AbortController`
usage in the provider orchestrator.

**Live-site verification:** attempted. `web_fetch` on the production URL
(`https://allrounderhelper.vercel.app/`) was rejected by this environment's tool policy
because the URL hadn't first appeared in a `web_search` result, and a `web_search` for
the domain did not surface a fetchable listing for it. No live/browser verification was
possible this session — not claimed.

**AdSense/SEO:** re-confirmed at source level only — `ads.txt` publisher ID matches the
`adsbygoogle.js` script tag in `index.html`; Blog/Finance Tools remain `noindex` via the
shared `<Seo noindex>` prop on `ComingSoonCategoryPage`, excluded from `sitemap.xml` and
navigation. No new content created (none was needed).

**Verification:**
- SOURCE VERIFIED: yes (284 files / 49 directories, unchanged from Phase 23).
- STATIC VERIFIED: yes.
- TYPECHECK: PASS.
- LINT: PASS (0 errors, 5 known warnings).
- BUILD: PASS.
- FRESH-ZIP VERIFIED: yes — extracted tree byte-identical to working copy, no
  `node_modules`/`dist`/`.git`/secrets.
- BROWSER: NOT VERIFIED (no browser tool available).
- LIVE: NOT VERIFIED (fetch attempt blocked by tool policy; not claimed).
- ADSENSE EXTERNAL: NOT VERIFIED.
- SEARCH CONSOLE EXTERNAL: NOT VERIFIED.
- ANALYTICS EXTERNAL: NOT VERIFIED.

**Remaining limitations:**
- SOURCE: none identified.
- ENVIRONMENTAL: no browser tooling available this session.
- EXTERNAL: AdSense approval, Search Console indexing, Analytics live data, and
  production-URL live verification all remain unverifiable from this environment.

---

## Phase 25 — 2026-08-20 — Public AI proxy abuse protection + AdSense privacy gap

**Scope:** audit all public `/api/*` endpoints for cost/DoS abuse surface; regression-test
all prior security fixes; deep AdSense/privacy content check; single release zip.

### Vulnerability found and fixed: unbounded public AI/Contact proxy bodies

**Problem:** all 9 `/api/ai/*` endpoints (OpenAI, Gemini, Mistral, Cerebras, xAI, Z.ai,
OpenRouter, Cloudflare, Pollinations image) plus `/api/contact` called `req.json()` with
no limit on request body size. These are public HTTP endpoints, reachable directly and
not only through this app's own UI. The client-side `useDailyMessageLimit` counter is
explicitly not a security boundary (it lives in the caller's own localStorage). A script
could therefore call any of these endpoints directly with an arbitrarily large JSON body
— megabytes of fabricated "conversation history" — which the function would buffer in
full and forward to a real, billed provider account (every provider key involved is
real and spendable). This is a genuine cost/resource-exhaustion exposure.

**Root cause:** no request-size validation existed at any of these 10 entry points.

**Fix:** added `api/_shared.ts` exporting `readJsonWithSizeLimit()` — checks the declared
`Content-Length` header first (cheap, no read required), then enforces the same cap
against the actual bytes read (since `Content-Length` can be absent or understated),
rejecting oversized bodies with HTTP 413 and malformed JSON with HTTP 400. Wired into
all 9 AI proxies (2MB cap; generous headroom over the 20,000-char × several
attachments/turns a real conversation needs) and into `/api/contact` and the Pollinations
image-prompt path (64KB cap; those bodies are naturally small). Smoke-tested against a
Node `Request`: a normal small body parses correctly, a 3MB body returns 413, malformed
JSON returns 400.

**Also fixed (found while wiring the guard):** `gemini.ts`, `cloudflare.ts`,
`pollinations-image.ts`, and `contact.ts` previously threw an unhandled TypeError on a
syntactically valid `null` JSON body (`payload.model` etc. on `null`) instead of
returning a clean 400 — added explicit `typeof x !== 'object' || x === null` guards to
each.

**Documentation correction:** `useDailyMessageLimit.ts`'s comment referenced a stale
"BYOK provider model" that no longer exists (all providers are now server-proxied) and
understated that the daily counter doesn't bound direct-endpoint abuse. Rewrote the
comment to accurately describe the real boundary and point to `api/_shared.ts`.

**Why the fix is safe:** purely additive validation before existing logic runs; no
change to any provider's request/response shape, streaming behavior, or error codes for
well-formed requests within the limit. Regression-tested: API typecheck, frontend
typecheck, lint, and build all pass after the change (see Verification below).

### Deployment-level protection — documented, not faked

Traced the abuse surface fully: the body-size guard bounds the *cost of any single
request*; it does not bound *how many requests one caller can send*. True per-IP/
per-session rate limiting needs a durable counter shared across invocations, which
Vercel Edge Functions don't provide on their own (no in-memory state survives between
invocations, and the same route can run across many isolates/regions). Per the explicit
instruction not to fake this with a process-local counter that would silently do
nothing in production, this is documented as an application-level fix (done) plus a
recommended **deployment-level** action (not done, not source-fixable): configure
Vercel Firewall / rate-limiting rules on `/api/ai/*` and `/api/contact` in the project
dashboard. This is genuinely outside what source code can provide.

### Provider failover/retry cost-multiplication — VERIFIED, NO CHANGE

Traced `providerOrchestrator.ts`: at most 2 attempts per provider (1 retry, only on a
fixed `RETRYABLE` error-code list), then moves to the next provider in a bounded chain
(≤9 configured providers), each attempt under a 30s timeout. This orchestrator is
client-side (`src/features/ai/logic/`) and only runs for requests going through the
app's own UI — a direct-endpoint attacker bypasses it entirely and only ever triggers
one upstream call per HTTP request they send, so it isn't an amplification vector for
external abuse, and for legitimate app usage the retry/failover bound was already
correct. Image generation (`imageGeneration.ts`) has no retry/failover at all — a single
attempt, no multiplication possible.

### Contact endpoint deeper review — VERIFIED, NO CHANGE

Confirmed one request → exactly one outbound Resend email (no amplification). Reply-to
injection via a crafted multi-address `email` value is already blocked by the existing
`EMAIL_RE` validation (a string containing a second `@` cannot satisfy the regex).
Subject-line `name` interpolation goes through Resend's JSON API, not raw SMTP headers
constructed by this code, so header injection isn't reachable via a newline in `name`.
No duplicate-submission/spam protection exists beyond the new size guard; per the
project's rules against fake in-memory limiters or unjustified CAPTCHA, this is flagged
as the same deployment-level Vercel Firewall recommendation as the AI proxies, not
implemented in source.

### Import DoS re-audit (pathological JSON within the 20MB guard) — VERIFIED, NO CHANGE

Traced `sanitizeMessage`/`sanitizeConversation`/`sanitizeAttachments`: all are flat,
one-level `typeof` checks with no recursion, so a deeply-nested malicious JSON value
can't cause unbounded recursion (it just fails a `typeof === 'string'`-style check and
gets defaulted/dropped). A 19MB file containing many thousands of small conversations/
messages is still bounded to a single `JSON.parse` plus one `O(n)` array map/filter pass
over data that's capped at 19MB total — no evidence of a pathological freeze case beyond
what the existing 20MB guard already bounds. Noted as LOW/INFORMATIONAL, not fixed: the
message list isn't virtualized, so importing (or organically accumulating) a very large
single conversation could make that conversation slow to render — this is a client-side
self-DoS of the importing user's own tab, not a security boundary or a risk to other
users/data, and no evidence of it being a realistic problem at normal usage scale.

### AdSense/privacy content change: AI data-flow disclosure gap — FIXED

Deep-read (not just existence-checked) `PrivacyPolicyPage.tsx`, `CookiePolicyPage.tsx`,
`TermsPage.tsx`, `DisclaimerPage.tsx` against actual behavior. Found a genuine gap: the
Privacy Policy described calculators (client-side only) and productivity tools
(localStorage only) accurately, but never disclosed that the AI Assistant relays user
messages and uploaded-document text through the server to third-party AI providers
(Gemini/OpenAI/Mistral/Cerebras/xAI/Z.ai/OpenRouter/Cloudflare Workers AI) and that image
generation is relayed to Pollinations AI — a material, undisclosed data flow. Added a
factual paragraph describing this flow and named the providers; also added Resend
(Contact form delivery) to the "third-party services" list, which previously only named
Analytics and AdSense. No legal-compliance claim is made — this is a technical-accuracy
fix, matching disclosure to actual behavior, not a legal opinion.

**Everything else checked and VERIFIED — NO CHANGE:** all 16-point mandatory security
regression list (Markdown escaping, safeUrl, Mermaid strict mode, blob previewUrl
validation, all three sanitizers, both 20MB import guards, export previewUrl stripping,
server-side provider keys, scientific-expression allowlist, persistError, AbortController
usage); calculator division-by-zero guards (gated at the UI `valid` flag layer before the
pure calculation functions run — e.g. `PercentageCalculatorPage`/`MarksRequiredPage`
both require `total > 0` before calling into `calculations.ts`); object-URL lifecycle for
AI-generated images (flows through the same attachment `previewUrl` blob lifecycle
already verified in Phase 16/18); `vercel.json` security headers and SPA rewrite;
ads.txt/publisher-ID consistency; Blog/Finance Tools noindex exclusion.

**Toolchain (all actually executed this session):**
- `npx tsc -p tsconfig.api.json --noEmit` — clean.
- `npx tsc -b` — clean.
- `npx oxlint` — 0 errors, 5 pre-existing warnings (same known set as prior phases).
- `npm run build` — succeeded; PWA precache regenerated; no source maps shipped.

**Verification:**
- SOURCE VERIFIED: yes.
- STATIC VERIFIED: yes.
- API TYPECHECK: PASS.
- FRONTEND TYPECHECK: PASS.
- LINT: PASS (0 errors, 5 known warnings).
- BUILD: PASS.
- FRESH-ZIP VERIFIED: yes (see final packaging step).
- BROWSER: NOT VERIFIED (no browser tool available).
- LIVE: NOT VERIFIED (not attempted this session — no new URL available to fetch).
- ADSENSE EXTERNAL STATUS: NOT VERIFIED.

**Remaining limitations:**
- SOURCE: none identified beyond the fixes above.
- ENVIRONMENTAL: no browser tooling available this session.
- EXTERNAL: recommended Vercel Firewall/rate-limiting configuration for `/api/ai/*` and
  `/api/contact` is a deployment-dashboard action, not something this session can apply;
  AdSense approval, Search Console indexing, and Analytics live data remain unverifiable
  from source alone.

---

## Phase 26 — Sitemap 404 root-cause fix & release audit (2026-08-20)

**Trigger:** Reported live contradiction — Google Search Console showed `/sitemap.xml`
as "Success" with 71 discovered pages, while opening
`https://allrounderhelper.vercel.app/sitemap.xml` directly in a browser showed the
app's custom 404 page.

**Root cause found (confirmed, not assumed):**
`public/sitemap.xml` was present, valid, and complete (71 `<url>` entries, matching
Search Console's count exactly). A direct server-side fetch of the live URL (via this
session's own fetch tool, which carries no service worker) returned the correct XML —
same for `/robots.txt` and `/ads.txt`. This ruled out a missing file, a Vercel routing
bug, and a stale Search Console read.

The actual cause was the PWA service worker's Workbox `navigateFallback` behavior in
`vite.config.ts`: `navigateFallbackDenylist` only excluded `/^\/api/`. `sitemap.xml`,
`robots.txt`, and `ads.txt` are not part of the precache glob
(`**/*.{js,css,html,svg,png,ico,woff2}`), so any `navigate`-mode request to those URLs
in a browser that already had the service worker installed (i.e. any returning visitor)
fell through to `navigateFallback` and was served the cached `index.html` app shell
instead of the real file — which React Router then renders as the custom 404, since no
route matches `/sitemap.xml`. Googlebot and fresh/no-SW fetches never see this, which is
exactly why Search Console reported success while the reporter's own browser (with the
SW already installed from prior visits) did not.

**Fix:** `vite.config.ts` — expanded `navigateFallbackDenylist` to also exclude
`/sitemap.xml`, `/robots.txt`, `/ads.txt`, the Google site-verification HTML file, and
(as a general safeguard against the same class of bug recurring for any future static
file) any path with a file extension. Verified no in-app route contains a dot, so this
general rule cannot shadow a real SPA route.

**Actually changed:**
- `vite.config.ts` — `workbox.navigateFallbackDenylist` expanded (see above). No other
  files changed.

**Audited and confirmed still intact (no regression, no change needed):**
- `api/_shared.ts` `readJsonWithSizeLimit` guard is imported and used by all 9 public
  endpoints (`api/ai/*.ts` ×8, `api/contact.ts`); no raw unbounded `req.json()` remains.
- No secrets (API keys/tokens) found in source; `.env.example` contains only variable
  names as documented.
- `dangerouslySetInnerHTML` usage (`MarkdownRenderer.tsx`, `MermaidDiagram.tsx`) is fed
  through `escapeHtml`-based rendering in `src/lib/markdown.ts`; scientific calculator's
  `new Function` call in `calculations.ts` is preceded by a character-whitelist check.
- Privacy Policy accurately discloses all current AI providers found in `api/ai/`
  (Gemini, OpenAI, Mistral, Cerebras, xAI, Z.ai, OpenRouter, Cloudflare Workers AI,
  Pollinations) plus Resend and Analytics/AdSense.
- `ads.txt` publisher ID (`pub-5736847555362725`) matches on disk and live.
- Settings/backup import size guard (`MAX_IMPORT_FILE_SIZE`, 20MB) present in
  `SettingsPage.tsx`.
- PWA manifest icon references (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`,
  `favicon-16/32.png`, `apple-touch-icon.png`) all exist on disk in `public/icons/`.

**Toolchain this session:**
- `npm install` — FAILED: sandbox has no network egress (registry.npmjs.org returned
  403/unreachable). This is an environment limitation, not a source problem.
- `tsc -b`, `tsc -p tsconfig.api.json`, `oxlint`, `vite build` — NOT VERIFIED (blocked by
  the install failure above). Not faked; no PASS claimed.

**Live testing performed:**
- `GET /sitemap.xml` — PASS (server-side): returns valid XML, 71 URLs, matches source.
- `GET /robots.txt` — PASS (server-side): matches source exactly.
- `GET /ads.txt` — PASS (server-side): matches source exactly.
- Full route-by-route live testing, multi-viewport/accessibility testing, and browser
  automation — NOT TESTED — TOOL LIMITATION (no browser automation tool available this
  session; only a non-browser HTTP fetch tool, which cannot reproduce the service-worker
  behavior that caused the original bug, though it did confirm the server-side files are
  correct).

**Verification:**
- SOURCE VERIFIED: yes.
- ROOT CAUSE VERIFIED: yes (traced to exact config line, mechanism explained above).
- API TYPECHECK: NOT VERIFIED (no network for install).
- FRONTEND TYPECHECK: NOT VERIFIED (no network for install).
- LINT: NOT VERIFIED (no network for install).
- BUILD: NOT VERIFIED (no network for install).
- FRESH-ZIP VERIFIED: partial — extraction/tree/diff verified; toolchain re-run inside
  the fresh extraction NOT VERIFIED for the same reason.
- BROWSER (rendering with SW installed, reproducing the original bug post-fix): NOT
  VERIFIED — no browser automation tool available.
- LIVE (post-deploy): NOT VERIFIED — fix has not been deployed yet; deployment is the
  user's next step.
- ADSENSE EXTERNAL STATUS: NOT VERIFIED.

**Remaining limitations:**
- ENVIRONMENTAL: this sandbox has no network egress, so `npm install`/build/typecheck/
  lint could not be executed or re-verified this session. The change is a two-line,
  well-understood Workbox config addition with no dependency on new packages or APIs, but
  it has not been build-verified here — the user should run `npm run build` (or let
  Vercel do it on deploy) and confirm before/after behavior.
- EXTERNAL: after deploying, confirm the fix by visiting `/sitemap.xml` in a browser that
  previously had the site's service worker installed (the exact repro condition) — a
  hard refresh alone may not update an already-active SW; the new SW must activate first
  (or test in a fresh/incognito profile with the new deployment, then revisit as a
  returning user).

---

## Phase 27 — Daily Routine, AI reliability re-audit, ArtisticAura/Pomodoro fixes,
## lint-config fix & documentation reconciliation (this session)

**Scope:** three sessions folded into one ledger entry since none were recorded at the
time: (1) a Daily Routine feature build, (2) an AI reliability re-audit against fresh
source (no regressions found, no changes needed), and (3) a Phase 6→7 reconciliation
pass that found and fixed three genuine small bugs, then closed out documentation.

### 1. Daily Routine — NEW feature, now COMPLETE

Added a dedicated recurring-day-structure tool, distinct from the one-off task/schedule
model Daily Planner already owns:

- `src/features/productivity/logic/routineTypes.ts` — `RoutineItem`/`RoutineCompletions`
  data model, reusing this project's existing conventions rather than inventing new ones
  (Mon-first `DAYS` from `studyPlannerTypes.ts`, `dateKey` from `calendarDateUtils.ts`,
  the `{dateKey: {id: boolean}}` per-day-completion shape `habitTypes.ts` already uses).
  Sanitizes malformed persisted data on every read rather than trusting stored shape.
- `useDailyRoutine.ts` — CRUD + today's completion, backed by the existing
  `useLocalStorage` hook (no new persistence mechanism).
- `whatNext.ts` — a deterministic (not AI-driven) "what should I do next" engine
  composing the existing read-only `usePlanMyDay` aggregator with routine data.
- `DailyRoutinePage.tsx` — Current/Next/Later/Earlier-today view, block CRUD, pause/
  resume, manual reorder, Focus Mode launch per block. Registered in
  `productivityRegistry.ts`, routed in `App.tsx`, added to `sitemap.xml` — parity
  between registry slugs, routes, and sitemap entries confirmed programmatically.
- Daily Planner gained the one capability it was missing versus Plan My Day: a Focus
  Mode launch icon per item (same `?task=` pattern, no new timer).
- Dashboard gained one compact, conditionally-shown "Next Up" card driven by
  `useWhatNext()` — hidden entirely when nothing is actionable, so it never adds
  clutter to a fresh account.

**Verification:** RUNTIME VERIFIED — the pure logic (`sanitizeRoutineItems`,
`routineItemsForDay`, `splitRoutineByTime`, `dayAbbrevFor`, completion sanitization) was
actually executed (via an esbuild bundle run under Node, not just read) against
adversarial inputs: malformed entries (missing id/title/bad time format/null/negative
duration — all correctly dropped or defaulted), same-start-time ordering (tie-break by
`order` correct), a paused block (correctly excluded from Today's Routine), an invalid
weekday (`'Funday'` correctly filtered, `'Mon'` kept), the Sunday→Monday boundary
(correct), and current/next/later/past classification (correct). TYPECHECK/BUILD/LINT:
PASS. BROWSER: NOT VERIFIED (no browser tool in this environment).

**Known limitation (documented in source, not silently ignored):** a routine block
whose window crosses midnight (e.g. 23:30 + 90 min) is compared only within today's
0–1439 minute range, so right after midnight it reads as "starts later today" instead
of "still running from yesterday." Not fixed — real cross-midnight arithmetic is exactly
the scheduling-engine complexity this feature is meant to avoid for same-day blocks.

### 2. AI reliability re-audit — VERIFIED, NO CHANGE

Re-inspected `taskClassification.ts`, the `AIErrorCode` taxonomy in `aiTypes.ts`, and
the no-compatible-vision-provider messaging path in `AiAssistantPage.tsx` from fresh
source (not from a prior session's claim). All three are already correctly implemented:
task classification is a deliberately deterministic domain-preference classifier,
separate from the hard capability-gating that already happens in
`providerRegistry.getRoutedFallbackChain`; the error taxonomy already covers
`not_configured` / `rate_limited` / `network` / `invalid_key` / `timeout` /
`context_overflow` / `provider_unavailable` / `unknown` with per-code recovery hints;
the app already gives two distinct, honest messages for "no vision provider connected
at all" vs. "a vision provider is connected but doesn't support this image's format,"
and never silently routes image data to a text-only provider. Nothing in this area was
touched by the Daily Routine work. No bugs found, no changes made.

### 3. ArtisticAura affiliate detection — bug found and fixed, then a second bug found

The existing architecture (`affiliateDetection.ts` + `AffiliateRecommendationCard.tsx`,
wired into `AiAssistantPage.tsx`) was already correct in every structural respect:
per-turn detection (not global), no extra AI/network call, `rel="sponsored"`, honest
"Affiliate link" disclosure already present, gated to completed non-system-notice
assistant messages only, destination already the correct
`https://artisticaura001.vercel.app/amazon-products`.

**Bug 1 (found and fixed in a prior part of this session):** four of the six exact
example queries named in the product brief — "which calculator should I buy?", "good
drawing pens?", "JEE books?", "art supplies?" — did not trigger, because their product
categories (calculator, drawing supplies, exam books, art supplies) had no keyword
coverage at all. Fixed by adding narrow purchase-intent phrases for each — deliberately
**not** the bare words "calculator" or "book", since this app's own math-tutoring
replies and academic reading-list answers would otherwise false-positive on those exact
nouns.

**Bug 2 (found this session, testing the brief's expanded regression list):**
`"explain how headphones work"` incorrectly triggered — via the pre-existing bare
`'headphone'` keyword, present since before this session's changes. Bare category nouns
like `headphone`/`laptop`/`camera` can't simply be removed (they're load-bearing for
real purchase questions with no explicit "buy" verb, e.g. "headphones for studying?" or
"which headphones should I buy?" — both must keep working). Fixed with a narrow
negative guard checked *before* any keyword match: `/\b(explain how|how (does|do|did))\b.*\bwork(s|ed|ing)?\b/i`
— an explanatory "how does X work" question is never a purchase question, regardless of
which product noun it mentions, so this guard generalizes safely rather than only
patching the one tested phrase.

**Verification — RUNTIME VERIFIED** (actual JS executed against the real keyword list
and guard, not eyeballed):
- Purchase-intent (must trigger, all 8 confirmed true): "which calculator should I
  buy?", "good drawing pens?", "headphones for studying?", "laptop stand?", "JEE
  books?", "art supplies?", "which headphones should I buy?", "recommend a laptop for
  studying".
- Non-purchase (must NOT trigger, all 11 confirmed false): "solve this calculator
  problem", "explain this JEE physics question", "how do I draw a perspective cube?",
  "what is photosynthesis?", "summarize this book", "what is a calculator?", "explain
  how headphones work", "can you help me solve this quadratic equation", "use a
  calculator to check your work", "I feel really stressed about my exams", "can you
  summarize this PDF for me".

This remains deterministic keyword/phrase matching — no semantic/AI-based intent
detection was added, and none is claimed.

### 4. Pomodoro alarm audio — bug found and fixed

`FocusModePage.tsx` already correctly calls `primeAlarmAudio()` from its Start/Resume
click handlers, unlocking the shared `AudioContext` from a genuine user gesture before
a `setInterval`-driven completion tone can try to play on it later. `PomodoroTimerPage.tsx`
— which has the richer alarm-sound/volume picker UI — never called it: its Start/Pause
toggle button only flipped `running` state. Since the shared `AudioContext` is normally
first created lazily inside `playAlarmSound` itself, and that call happens from a
`setInterval` tick (not a user gesture) at session completion, a browser's autoplay
policy could hand back a suspended context and refuse `resume()`, silently dropping the
very first Pomodoro session's alarm.

**Fix:** added the identical `primeAlarmAudio()` call to the Start/Pause button's
`onClick`, before `setRunning`, mirroring Focus Mode's already-proven pattern exactly.
No new audio system was created.

**Verified alongside it, no regression (SOURCE VERIFIED):** the single `useEffect`
driving the countdown depends only on `[running]` and always cleans up its interval on
every re-run/unmount, so toggling Start/Pause repeatedly cannot create duplicate
timers; `reset()` sets `running` to false (triggering that same cleanup) before
resetting mode/seconds; `settings.alarmSound`/`settings.volume` are read fresh on every
`handleSessionComplete()` call, unaffected by this change; the deprecated `playBeep()`
path used by Focus Mode's simpler single-toggle sound setting is untouched.

**Browser limitation, stated honestly, not overclaimed:** this fix makes the alarm
*eligible* to play under normal autoplay policies once the user has clicked Start — it
does not and cannot guarantee audio in every browser/OS/background-tab configuration,
since the web platform itself doesn't guarantee that. NOT VERIFIED in an actual browser
(none available in this environment).

### 5. Lint configuration — real gap found and fixed

**Problem:** the canonical `npm run lint` script is bare `oxlint` with no config file.
This oxlint version (1.75.0) has `"ignorePatterns": []` by default — confirmed via
`oxlint --print-config`, not assumed. With `node_modules` actually installed (this
session had working npm registry access), `npm run lint` scanned 22,404 files including
every vendor package and reported **57,602 warnings and 7 errors** — all traced to
`node_modules` (d3-geo, bundled `pdf.js`/MathJax/KaTeX source, TypeScript declaration
sourcemap packages), zero of them in `src/` or `api/`.

**Fix:** added `.oxlintrc.json` with `"ignorePatterns": ["node_modules", "dist",
"build", "coverage", "*.min.js"]`. No lint rules were disabled or weakened — this only
scopes *which files* are scanned, not which rules apply to them.

**Result, actually re-run this session:** `npm run lint` → 249 real project files
scanned, **0 errors, 1 warning** (the same pre-existing, already-explained
`no-control-regex` warning in `src/lib/markdown.ts` that every prior phase in this
ledger already accepted as intentional — matching an intentional `\u0000` placeholder
sentinel, not a real bug).

### Toolchain — all actually executed this session (not claimed from memory)

- `npm install` — succeeded (580 packages, working registry access).
- `npx tsc -b` — clean.
- `npm run typecheck:api` (`tsc -p tsconfig.api.json --noEmit`) — clean.
- `npm run lint` — 0 errors, 1 known pre-existing warning (see above).
- `npm run build` — succeeded; PWA precache 293 entries (up from 284 pre-Daily-Routine,
  consistent with the new page's own chunk).
- Route/registry/sitemap parity for every `productivity/*` slug — confirmed
  programmatically (diff of extracted slug/route lists), not by inspection alone.

**Verification:**
- SOURCE VERIFIED: yes.
- RUNTIME VERIFIED: yes — Daily Routine pure logic and affiliate-detection keyword/guard
  logic were both actually executed against adversarial inputs, not just read.
- TYPECHECK (frontend + API): PASS.
- LINT: PASS (0 errors, 1 known warning).
- BUILD: PASS.
- BROWSER: NOT VERIFIED — no browser automation tool available in this environment.
- LIVE (real provider / deployed site): NOT VERIFIED — not attempted this session.
- ANDROID/real-device audio: NOT VERIFIED — no device available in this environment.

**Remaining limitations:**
- ENVIRONMENTAL: no browser or device available here, so the Pomodoro audio fix,
  Daily Routine's visual/mobile layout, and the affiliate card's actual rendering are
  all source/runtime-verified for logic only, not visually or audibly confirmed.
- EXTERNAL: production/live verification of any of this session's changes has not been
  attempted; recommended before considering this phase's changes fully closed in
  production.

**Files changed this phase:**
`src/features/productivity/logic/routineTypes.ts` (new),
`src/features/productivity/logic/useDailyRoutine.ts` (new),
`src/features/productivity/logic/whatNext.ts` (new),
`src/features/productivity/pages/DailyRoutinePage.tsx` (new),
`src/data/productivityRegistry.ts`, `src/App.tsx`, `public/sitemap.xml`,
`src/features/productivity/pages/DailyPlannerPage.tsx`,
`src/features/productivity/pages/PlanMyDayPage.tsx`,
`src/pages/dashboard/DashboardPage.tsx`,
`src/features/ai/logic/affiliateDetection.ts`,
`src/features/productivity/pages/PomodoroTimerPage.tsx`,
`.oxlintrc.json` (new),
`PROJECT_BACKLOG.md` (this entry).

## CURRENT STATUS (as of Phase 27)

**COMPLETED** (implemented + at least source/runtime verified): capability-aware AI
provider routing, shared generation engine (Send/Continue/Retry/Edit), attachment
pipeline (image/PDF/scanned-PDF/expiry handling), provider health/failover, Daily
Routine, Daily Planner (+ Focus Mode launch), Plan My Day, Dashboard "Next Up",
contextual ArtisticAura recommendations, Pomodoro/Focus Mode alarm priming, public API
proxy size limits, sitemap/robots/ads.txt correctness, AdSense/privacy disclosure.

**NOT VERIFIED** (environment-blocked, not because of any known defect): all
browser/device rendering, live provider calls, real Android/iOS audio playback,
production/deployed-site behavior, AdSense/Search Console/Analytics external status.

**NEXT** (genuine remaining priorities, roughly in order): (1) real browser/device
validation of everything above that's currently source/runtime-verified only — this is
the single largest gap across the whole project at this point, not a new feature gap;
(2) live-provider end-to-end testing of the AI attachment/routing pipeline; (3) real
Android/browser audio confirmation for Focus Mode and Pomodoro; (4) production
deployment verification of the Phase 26 sitemap fix and this phase's changes together.

## Phase 8 — AI Runtime Reliability, Attachments & Provider Routing Validation (finalization session)

**Completed:**
- Full source-level audit of the AI attachment lifecycle (selection → validation →
  extraction → capability classification → provider routing → generation → retry/
  continue/edit → persistence).
- One genuine defect found and fixed: `retryLast()` and `editAndRegenerate()` in
  `AiAssistantPage.tsx` silently rebuilt a text-only request when an attachment's image
  bytes had expired after a page reload (metadata persists, `dataUrl`/`pageImages`
  never do — see `useConversations.ts`'s `stripUnpersistableAttachmentData`), while
  `continueMessage()` already had this exact honest-degradation check from an earlier
  phase. Extracted the check into one shared, single-source-of-truth function,
  `expiredAttachmentNotice()`, in `attachmentTypes.ts`, and applied it to all three
  action paths (Continue/Retry/Edit+Regenerate).
- Narrowly-scoped search (this session) for the same class of bug elsewhere in the
  codebase: grepped every file touching `attachments` outside the AI feature area
  (Daily Routine, Notes, Image Compressor) and confirmed none of them resend or
  regenerate an AI request — the word "attachments" there is incidental (email
  attachments in copy text, a doc comment). **No additional silent attachment-downgrade
  path found — SOURCE VERIFIED.**
- Deterministic RUNTIME VERIFIED test of `expiredAttachmentNotice()` itself: the exact
  function body (plus `hasImageAttachment`/`attachmentsWithImages`) executed directly
  under plain Node against 9 cases (no attachment, text-only document, live image, live
  scanned PDF, expired image, expired scanned PDF, mixed expired image+PDF) — all 9
  pass. This is real execution of the real logic, not a source read and not a mock.
- Regression-confirmed (source read): Pomodoro's `primeAlarmAudio()` still fires from
  the Start/Resume button before `running` toggles; `.oxlintrc.json` still excludes only
  vendor/build dirs with no rule disabled; ArtisticAura's affiliate-detection keyword
  logic re-executed under plain Node against the full 8-purchase/6-non-purchase case
  set from the phase brief — 14/14 pass, including the specific "explain how headphones
  work" false-positive regression case, confirmed still fixed.

**Verification labels used (see `PHASE_8_LEDGER.md` for full detail):** SOURCE
VERIFIED and RUNTIME VERIFIED (of pure, dependency-free logic executed directly under
Node) are the only levels actually reached this session. BUILD/BROWSER/LIVE PROVIDER/
PRODUCTION VERIFIED are all ENVIRONMENT BLOCKED — this checkpoint ships with no `.git`
history, no `node_modules`, no network access (`npm install` → `403 Forbidden`,
re-confirmed), and no server-side provider API keys, so none of those checks could
actually run. None of them are claimed.

**Files changed:** `src/features/ai/logic/attachmentTypes.ts` (added
`expiredAttachmentNotice`), `src/features/ai/pages/AiAssistantPage.tsx` (3 call sites),
`PHASE_8_LEDGER.md` (new), `ENGINEERING_DECISIONS.md`, `FINAL_AUDIT_REPORT.md`,
`PROJECT_BACKLOG.md` (this entry). Nothing else — diffed directly against the Phase 7
checkpoint to confirm.

**NEXT (unchanged in kind, still the real remaining debt):** real browser/device
testing of the AI attachment/Retry/Continue/Edit flows (including the new expired-
attachment notice actually showing after a real reload), live-provider end-to-end
testing once credentials/network are available, and the same outstanding Android/audio
and production-deployment verification already listed above.

## Phase 9 — Runtime Readiness, Verification Preparation & Controlled Validation

**Environment re-verified, unchanged from Phase 8:** network still returns 403 from
`registry.npmjs.org`, no `node_modules`, no `.env`/provider credentials, no `.git`
repository, no browser/DOM runtime, no Android device. All build/browser/live-provider/
production checks are ENVIRONMENT BLOCKED this session, exactly as before — re-confirmed
directly, not assumed.

**Completed:**
- Focused spot-check (not a re-audit) of the Phase 8 `expiredAttachmentNotice()` fix:
  traced all 4 usages in the actual checkpoint source (definition +
  Continue/Retry/Edit+Regenerate call sites). Confirmed the same-session-vs-expired
  distinction is made on actual attachment byte presence (`dataUrl`/`pageImages`), not
  metadata, and that all three action paths still call the shared helper correctly.
  **No regression found — no source change made.**
- Re-executed (not merely cited) both Phase 8 deterministic regressions under plain
  Node this session: `expiredAttachmentNotice()` against 9 cases (9/9 pass) and
  `isRecommendationQuery()` against 19 purchase/non-purchase cases, a superset of
  Phase 8's 14 (19/19 pass, including both "how do headphones work" false-positive
  guards).
- Wrote an explicit, step-by-step manual validation matrix (M1–M7) covering the
  reload→Retry/Edit/Continue sequence, the same-session control test, attachment-type
  coverage, capability routing/failover, Focus/Pomodoro audio, Daily Routine/Plan My
  Day, and a production smoke pass — see `PHASE_9_LEDGER.md` for the full text. This is
  meant to be followed on Android/browser hardware without guessing at steps.

**Verification labels used:** SOURCE VERIFIED (spot-check) and RUNTIME VERIFIED (the
two re-executed Node regressions) are the only levels reached this session. Everything
requiring a browser, device, network, or provider credentials is ENVIRONMENT BLOCKED —
see `PHASE_9_LEDGER.md`'s verification table for the full breakdown.

**Files changed:** `PHASE_9_LEDGER.md` (new), `PROJECT_BACKLOG.md` (this entry). No
application source file was changed — the spot-check found no defect to fix. No
checkpoint ZIP produced (documentation-only session, per the no-intermediate-ZIP rule).

**NEXT:** execute manual test M1 (reload → Retry/Edit/Continue with an expired image)
on real Android/browser hardware — the single highest-value remaining test, since it
directly exercises the one real defect found in this project's AI runtime work so far.
