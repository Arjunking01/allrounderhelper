# ALLROUNDER HELPER — Final Release

**Version:** 1.0.0
**Release date:** 2026-08-01
**Technology stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Framer Motion
**Credits:** Built with Claude (Anthropic)

## Deployment steps (Vercel)
This project targets **Vercel**, not Cloudflare Pages — `vercel.json` (SPA rewrite + security
headers) and the `api/*.ts` Serverless/Edge Functions (contact form, AI provider proxies) only
work on Vercel. (An earlier version of this doc referenced Cloudflare Pages and `public/_redirects`
/ `public/_headers`; those files were never actually added to the repo and Cloudflare Pages does
not run Vercel-style `api/` edge functions, so deploying there would silently break the contact
form and every AI provider. Deploy to Vercel.)
1. Push this project to a GitHub repo and import it into Vercel.
2. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
3. In Vercel Project Settings → Environment Variables, set whichever provider keys you want to
   enable (see below). All are optional — the app works fully with zero keys configured, providers
   simply show as "not connected".
4. Deploy.

## Environment variables
Copy `.env.example` to `.env.local` for local dev. Never committed — `.env` and `.env.local` are
gitignored, and no real key is hardcoded anywhere in `src/`.

Every text-chat provider's key stays **server-side only** (read by `api/ai/*.ts`) and is proxied
through a Vercel Edge Function — never read via `import.meta.env`/a `VITE_` prefix, since Vite
statically inlines `VITE_*` values into the built client bundle where anyone can read them:
```
GEMINI_API_KEY=            # server-side
VITE_GEMINI_ENABLED=       # non-secret UI flag, set to 1 alongside it

CEREBRAS_API_KEY=          # server-side
VITE_CEREBRAS_ENABLED=     # non-secret UI flag, set to 1 alongside it

MISTRAL_API_KEY=           # server-side
VITE_MISTRAL_ENABLED=      # non-secret UI flag, set to 1 alongside it

OPENROUTER_API_KEY=        # server-side
VITE_OPENROUTER_ENABLED=   # non-secret UI flag, set to 1 alongside it
```
(OpenRouter previously ran as a direct browser call using a `VITE_OPENROUTER_API_KEY` on the
reasoning that OpenRouter's own docs support client-side keys. That was corrected: a real,
spendable API key in a `VITE_*` var is readable by any visitor regardless of what a given
vendor's docs permit, so OpenRouter now uses the same server-proxy pattern as every other
provider here.)

## Build commands
```
npm install
npm run dev      # local development
npm run build    # production build to dist/
```

## Features completed
- **Academic Tools** — 14 calculators (CGPA, SGPA, attendance, percentage conversions, budget, scientific, unit converter, etc.)
- **Productivity Suite** — 14 tools: To-Do, Notes, Study/Daily/Weekly/Semester Planner, Pomodoro, Focus Mode, Goal/Habit/Assignment Tracker, Exam Countdown, Priority Matrix, Calendar
- **Document & Image Tools** — 23 tools: PDF merge/split/compress/rotate/reorder/extract/delete, Image↔PDF, Word→PDF, PDF→Text, real OCR (Tesseract.js), image compress/resize/crop/convert, QR/barcode generation & scanning
- **Creator Tools** — 9 tools: color picker, gradient/palette generators, aspect ratio/resolution/DPI calculators, thumbnail safe-zone checker, social size guide
- **Dashboard & Analytics** — productivity insights, streaks, heatmap, charts, calculator-history trends, weekly/monthly/semester reports (print + PDF export)
- **AI Study Assistant** — real Gemini/Cerebras/Mistral/OpenRouter/OpenAI/xAI/Z.ai/Cloudflare integration (streaming, cancel, retry, automatic failover), provider-agnostic architecture with every real key proxied server-side rather than shipped to the browser (Claude/local scaffolded, not yet connected), conversation folders/pin/archive/search, 76-prompt library, KaTeX math, Mermaid diagrams, attachments, in-app chat search, message edit/delete/quote/retry
- **Platform** — command palette (Ctrl/Cmd+K), global search, favorites, PWA (installable, offline-capable, maskable icons), full SEO (per-page meta/OG/Twitter/canonical/schema), sitemap, robots.txt, ads.txt, Search Console verification

## Known non-blocking limitations
- Every text-chat provider's key (Gemini/Cerebras/Mistral/OpenRouter/OpenAI/xAI/Z.ai/Cloudflare) is held server-side and proxied via `api/ai/*.ts` (Vercel Edge Functions) rather than shipped to the browser. OpenRouter was the last holdout, previously called directly from the browser with a `VITE_OPENROUTER_API_KEY` on the theory that OpenRouter's docs permit this — that exposed a real, spendable secret in the public JS bundle and has been corrected to the same server-proxy pattern as every other provider.
- The `api/` directory (contact form + AI proxies) is not included in either TypeScript project (`tsconfig.app.json` covers only `src`, `tsconfig.node.json` only `vite.config.ts`), so `npm run build`'s `tsc -b` never type-checks it. These files have been hand-verified against the existing `api/contact.ts` pattern but not compiler-checked.
- Provider proxy integration (including the new OpenRouter proxy) is implemented per each vendor's documented REST API but has not been smoke-tested against live keys or a real browser (no network egress or browser available in this build sandbox).
- Content-Security-Policy is currently set as `Content-Security-Policy-Report-Only` (report-only, not enforced) — deliberately, pending real-world validation before switching to an enforced `Content-Security-Policy` header.
- 8 pre-built, working-but-currently-unused components remain in the codebase (Modal, Drawer, Dropdown, Tabs, Tooltip, Accordion, `localStorageService.ts`, `textStats.ts`) — kept rather than deleted since they're real, not placeholder, code.
- Some AI Phase 12–18 items were explicitly scoped down under low-token instructions: image viewer zoom/pan, Mermaid zoom/export, continue-generation, bulk conversation actions — see per-phase completion reports for full detail.

## Changelog (phases)
1. Core app shell, design system, PWA/SEO foundation, all Academic Tools
2. Productivity Suite (initial 9 tools)
3. Document & Image Tools (22 tools)
4. Creator Tools, command palette, global search, favorites, dashboard, settings
5. Document Tools hardening — real OCR, real Word→PDF, batch processing, Cloudflare deploy fixes
6. Logo/branding integration verification
7–11. Study Planner, Calendar, Focus Mode, Productivity Insights, Calculator Suite 2.0 (history/copy/share/print/PDF), Analytics Dashboard
12–18. AI architecture (provider-agnostic), Smart Study Assistant UI, real Gemini integration with streaming, conversation management, 76-prompt library, KaTeX/Mermaid rendering, message actions, attachments, in-app chat search
19–20. Production hardening (security headers, code audit), deployment prep (Search Console verification, ads.txt, final validation)
