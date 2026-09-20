# AI Provider Guide

## Architecture
`logic/aiTypes.ts` defines the `AIProvider` interface every provider implements.
`logic/providerRegistry.ts` holds the registry (`registerProvider`/`getProvider`) and `PROVIDER_CATALOG` (UI metadata).
`logic/providerOrchestrator.ts` handles timeout + retry + automatic failover across the configured provider chain.

Providers come in two transport modes (see `providers/openAICompatibleProvider.ts`):
- **Proxy mode** (Gemini, Cerebras, Mistral, OpenRouter, OpenAI, xAI/Grok, Z.ai): the
  browser calls our own `/api/ai/*` Vercel Edge Function, which holds the real vendor API
  key server-side and forwards the request. This is the only mode used for any real vendor
  secret in this app — see the security note below.
- **Direct mode**: the browser would call the vendor's API straight from client code with
  an `apiKey` attached. **Not currently used by any provider.** OpenRouter used this mode
  until a 2026-08-17 security fix — see below.

**Security note — why `direct` mode is not used for real secrets, regardless of vendor docs:**
`import.meta.env.VITE_*` values are statically inlined into the built client bundle by
Vite at build time, readable by any visitor via dev tools or the bundle itself. A vendor's
docs describing their API as "usable from the browser" almost always means *"the network
call can technically originate from client code,"* not *"it's safe to ship this account's
real secret to every visitor."* OpenRouter previously ran in `direct` mode with a real key
in `VITE_OPENROUTER_API_KEY` on exactly this misreading — any visitor could have extracted
the key from the bundle and spent the account's OpenRouter credits. Fixed by moving it to
the same proxy pattern as every other provider (`api/ai/openrouter.ts`,
`OPENROUTER_API_KEY` + `VITE_OPENROUTER_ENABLED`). `direct` mode remains in the type union
only as future scaffolding for a genuine **user-entered** bring-your-own-key feature (a key
the user types into Settings, stored only in their own browser, used only for their own
requests) — never for a site-wide key that ships to every visitor.

Cloudflare Workers AI is a **bespoke provider** (`providers/CloudflareProvider.ts`), not
built on `createOpenAICompatibleProvider` — its REST response shape
(`{ result: { response }, success, errors }`) isn't OpenAI-compatible. See that file's
comments for why the plain `/ai/run/{model}` endpoint is used instead of the newer
`/ai/v1/chat/completions` (AI Gateway) path, which requires a gateway ID this deployment
doesn't have configured.

Server-side proxies: `api/ai/gemini.ts`, `api/ai/cerebras.ts`, `api/ai/mistral.ts`,
`api/ai/xai.ts`, `api/ai/zai.ts`, `api/ai/cloudflare.ts`. Each reads its real key from a
plain (non-`VITE_`) env var, forwards the request, and streams the response straight back
so the existing client-side SSE parsers don't need to change (Cloudflare currently
returns its response non-streamed — see capabilities.streaming: false in
CloudflareProvider.ts).

## Provider status (as of Phase 2 hardening, this session — Aug 2026)

None of xAI/Grok, Z.ai, or Cloudflare Workers AI have been **verified via a live API
call** — this environment has no network access to `api.x.ai`, `api.z.ai`, or
`api.cloudflare.com`, and no real API keys are available here even if it did (they live
in Vercel's environment, not this sandbox). What *is* true, freshly re-checked this
session against each vendor's own current docs via web search (not from training-data
memory, which would be stale for anything this fast-moving):

- **Endpoints/base URLs**: `api.cerebras.ai/v1/chat/completions`,
  `api.mistral.ai/v1/chat/completions`, `api.x.ai/v1/chat/completions`,
  `api.z.ai/api/paas/v4/chat/completions`, and the Cloudflare
  `api.cloudflare.com/client/v4/accounts/{id}/ai/run/{model}` REST-run endpoint are all
  confirmed current and correct against each vendor's own docs.
- **Model IDs**: `llama3.1-8b` (Cerebras) and `mistral-small-latest`/`-latest` aliases
  (Mistral, which auto-tracks the newest release by design) confirmed current.
  `@cf/meta/llama-3.1-8b-instruct` (Cloudflare) confirmed still documented and working,
  though Cloudflare's own changelog now recommends newer models (Llama 4, gpt-oss) for
  new integrations — worth a deliberate upgrade later, not an emergency fix.
  `glm-5.2` (Z.ai) confirmed current against `docs.z.ai` directly.
  **`grok-4.5` (xAI) was updated to `grok-4.6` in Phase 1.7** (this session's
  predecessor left it at 4.5) — Grok 4.6 shipped Aug 12–13, 2026 and is now xAI's
  flagship, superseding 4.5 after barely a month; re-verified directly against
  `docs.x.ai` this session, along with a stale context-window figure (see the
  capability matrix below).
- **A real, functionality-breaking bug was found and fixed this session**:
  `GeminiProvider.ts`'s default model was `gemini-2.0-flash`, which Google shut down on
  June 1, 2026 — every request using the default model would have 404'd. Fixed to
  `gemini-3.5-flash` (Google's own current default across its products, confirmed GA).
  This wasn't caught earlier because it's a runtime-only failure (compiles and
  typechecks fine) that only a live request — or, this session, an actual documentation
  check — would surface.
- `tsc -b` and `vite build` were **not** run this session (no `node_modules`/network in
  this sandbox to install dependencies) — brace-balance/syntax review only. Run a real
  build before deploying these changes.
- None of the newer providers (xAI, Z.ai, Cloudflare) have been exercised against the
  real API yet. **The first real signal on whether each actually works will be an
  actual chat request in the deployed environment.** If a vendor changes their
  endpoint/response shape after this was written, the adapter will need a real fix at
  that point — a known limitation, not an oversight.

## Image generation (Pollinations) is a separate capability, not a chat provider

`logic/imageGeneration.ts` + `api/ai/pollinations-image.ts` — deliberately not built on
the `AIProvider` interface (different request/response shape: binary image, not text).
`isImageGenerationRequest()` is a narrow, conservative keyword detector (verb + noun,
e.g. "generate" + "image") used in `AiAssistantPage.send()` to route image requests to
this capability instead of a text provider, before any text provider is invoked. Same
live-verification caveat as above applies.

## Adding a new provider
**Always use `mode: 'proxy'` for the vendor's real API key — no exceptions.** Do not add a
`mode: 'direct'` config with a real secret in a `VITE_*` var, even if the vendor's docs
describe browser usage as supported. See the security note above: `VITE_*` values are
public once built, regardless of what any vendor's docs permit.

1. Add `api/ai/<vendor>.ts`, following `api/ai/cerebras.ts` as a template: read the real key
   from a plain env var, forward the request, stream the response back unchanged.
2. Add a `mode: 'proxy'` config in `providers/<Vendor>Provider.ts` pointing `proxyPath` at
   that function (or write a bespoke provider if the vendor's request/response shape isn't
   OpenAI-compatible — see `GeminiProvider.ts`).
3. Add a non-secret `VITE_<VENDOR>_ENABLED` flag so the UI knows to show it, and call
   `registerProvider(yourProvider)` in `providerRegistry.ts`.
4. Add an entry to `PROVIDER_CATALOG` with `status` computed from `isConfigured()`.

Nothing else in the app changes — chat UI, settings, and streaming all work against the
`AIProvider` interface regardless of transport mode.

## Provider/model capability matrix (Phase 1.6, this session)

Routing today happens at PROVIDER level (`capabilities.vision` is fixed per provider config,
not re-derived per `settings.model`), which is honest as long as each provider's *default,
actually-configured* model matches that flag — it stops being honest the moment a deployment
points `settings.model` at a different model under the same provider with different real
capabilities (e.g. switching Mistral to a non-vision model while `vision` stayed `true`, or
vice versa). Not rebuilt into full model-level routing this session (would be over-engineering
ahead of evidence it's needed — every provider here is currently configured with one fixed
default model per the configs in `providers/*.ts`), but flagged here as the thing to revisit
first if per-model overrides are ever added to AI Settings.

Facts below are the actual configured default model for each provider (from each
`providers/*.ts` file) plus what's independently verifiable about it — not a general claim
about the vendor's entire model lineup.

| Provider | Default model | Vision | Supported image MIME types (Phase 1.7) | Notes |
|---|---|---|---|---|
| Gemini | gemini-3.5-flash | Yes | png, jpeg, webp | `capabilities.vision: true`; own bespoke request format (`inlineData`), not OpenAI-style. Native PDF input is a documented, NOT-implemented architectural gap — see `GeminiProvider.ts`'s header comment. |
| OpenAI | gpt-4o-mini | Yes | png, jpeg, webp, gif | `vision: true`; gpt-4o family is multimodal by design. Covers every format this app's picker accepts. |
| xAI (Grok) | **grok-4.6 (bumped from grok-4.5 this session)** | Yes | **jpeg, png ONLY — no WebP** | Re-verified live against docs.x.ai this session: Grok 4.6 shipped Aug 12–13, 2026 and is now xAI's flagship (superseding 4.5, which itself only shipped Jul 8–9, 2026 — two flagship changes in about 5 weeks). Context window corrected `128_000` → `500_000` (was already stale for 4.5 too). Image support (jpg/jpeg + png, 20MiB/image, no count limit) reconfirmed directly on docs.x.ai/developers/model-capabilities/images/understanding — WebP is genuinely NOT supported, which is why Phase 1.7 added MIME-aware routing (see `providerRegistry.ts`'s `supportsImageFormats`) rather than just trusting the `vision` boolean. `grok-4.5` remains reachable via an AI Settings model override. |
| Mistral | mistral-small-latest | No (left as-is) | — | Third-party sources disagree on whether the current `mistral-small-latest` alias is vision-capable (some say yes, citing "Mistral Small 3.1+"; others say no). No single authoritative primary-source answer found this session — left `false` (the conservative choice: an image silently gets the "can't view images" text note instead of possibly being sent to a model that can't actually use it) rather than flip it on unverified aggregator claims. **Live-verify before changing.** |
| OpenRouter | openrouter/auto | No (left as-is) | — | `auto` routes to a vendor-chosen downstream model per-request — genuinely cannot be given a fixed vision flag; conservative `false` is correct until/unless a specific fixed model is configured instead of `auto`. |
| Z.ai | glm-5.2 | No (confirmed correct) | — | Verified this session (requesty.ai model card): GLM-5.2 "Supports vision: false". Z.ai's actual vision-capable models are glm-4.5v / glm-5.3-flash — different model IDs, not configured here. |
| Cerebras | llama3.1-8b | No (left as-is) | — | Llama 3.1 8B Instruct is text-only; correct as configured. |

**PHASE 1.7 — capability model now includes `supportedImageMimeTypes` (`aiTypes.ts`), not
just a plain `vision` boolean.** A vision-capable provider that omits this field is treated
as supporting **nothing** (fail closed) — see that field's own doc comment for why silently
assuming "probably fine" for an unverified format was exactly the bug this exists to prevent
(the xAI/WebP case above is the concrete example that motivated it). Routing
(`providerRegistry.getRoutedFallbackChain`/`hasVisionCapableProvider`) and the
OpenAI-compatible adapter (`openAICompatibleProvider.toOpenAIContent`) both enforce this now,
independently, as defense-in-depth.

**PHASE 1.7 — conversation history is now bounded (`promptBuilder.ts`'s `boundHistory`), a
real bug fix, not a preventive measure.** Before this phase, `buildProviderMessages` sent the
*entire* unbounded message history — including every past turn's image attachments —
on every single request. See `ENGINEERING_DECISIONS.md`'s Phase 1.7 entry (finding #4) for
the full writeup; this was independently confirmed as live, in-memory behavior (not just a
theoretical concern) via `useConversations.ts`.
| Cloudflare Workers AI | @cf/meta/llama-3.1-8b-instruct | No | Text-only model; also `capabilities.streaming: false` (see below). |

### Attachment size limits (Phase 1.6 fix)

Two real bugs found and fixed this session, both in the "an image is attached and looks fine
in the UI but the AI never actually saw it" family the whole multimodal effort exists to kill:

1. **Client-side `MAX_ATTACHMENT_SIZE` (25MB) was being applied to images too**, despite that
   limit's own reasoning explicitly being about bounded, truncated TEXT EXTRACTION — it never
   accounted for an image sending its full bytes, base64-encoded (~33% larger), as part of the
   actual request body. Fixed: images now have their own `MAX_IMAGE_FILE_SIZE` (12MB), sized
   against the most restrictive verified vendor limit (xAI's documented 20MiB/image) with real
   headroom. See `attachmentTypes.ts`.
2. **Server-side proxy body limit (`MAX_AI_BODY_BYTES`, 2MB) was never raised when the image
   pipeline was added** — a base64-encoded photo well under the (buggy) 25MB client limit could
   still be silently rejected with a generic HTTP 413 by the proxy before ever reaching the
   vendor. This is a strong candidate for the actual root cause behind real-world "I attached a
   photo and the AI said it couldn't see it" reports, since the failure happens completely
   silently from the UI's perspective (`sendMessage` just returns a `provider_unavailable`/
   `unknown`-shaped error, indistinguishable in the chat UI from any other transient failure).
   Fixed: vision-capable proxies only (`api/ai/gemini.ts`, `api/ai/openai.ts`, `api/ai/xai.ts`)
   now use a separate `MAX_AI_BODY_BYTES_VISION` (24MB); non-vision proxies are untouched since
   they never receive image bytes in the first place (`toOpenAIContent` substitutes a text note
   instead). A client-side pre-send check (`totalImagePayloadBytes` vs
   `MAX_TOTAL_IMAGE_PAYLOAD_BYTES`, in `AiAssistantPage.send()`) now also rejects an
   over-budget multi-image message honestly before sending, rather than after a doomed wait.

**Not verified live** (no network access to any AI vendor from this environment) — these are
source-level fixes to a bug found by inspection + arithmetic (documented image size limit vs.
documented proxy body limit), not a live-confirmed root cause. Treat "this is why photos were
failing" as a strong hypothesis worth checking first against real production logs, not a
closed case.

### Scanned/image-only PDFs (Phase 1.6 feature)

Previously, a PDF with no extractable text layer (the normal shape of a scanned/photographed
document) was a dead end — `extractionReason: 'empty'`, with a UI hint to run it through the
separate OCR tool first. Now: `attachmentTextExtraction.ts`'s `renderScannedPdfPages` rasterizes
the first `MAX_SCANNED_PDF_PAGES` (4) pages to JPEG data URLs (same pdfjs render-to-canvas
approach as `OcrTextExtractionPage.tsx`) as a fallback, and those pages are treated as image
data for routing/sending purposes via `Attachment.pageImages` + `collectImageDataUrls()` — so
they flow through the *existing* vision pipeline and the *existing* "no vision-capable provider
connected" honest-messaging path in `AiAssistantPage.tsx`, without any new UI-side capability
check needed. Bounded by page count AND a size budget (stops early if pages so far already used
half of `MAX_TOTAL_IMAGE_PAYLOAD_BYTES`), with an honest `pageImagesTruncated` flag surfaced in
the attachment chip's tooltip when the document was longer than what was actually sent. Genuine
render/parse failure falls back to the original honest 'empty' error state (with the OCR-tool
hint), not a silent claim of success.

**Deliberately not implemented**: a provider-native PDF/file-upload API path (e.g. Gemini's
Files API, OpenAI's file inputs) for PDFs above the page/size budget. That's real future work,
not a regression — this session's fallback specifically targets the common case (a short scan)
without adding a new upload/polling flow this session didn't have time to build and verify.

## Streaming flow
`AiAssistantPage.send()` calls `provider.sendMessage(messages, settings, onChunk, signal)`.
Each `onChunk` appends to a live message (`isStreaming: true`); final resolution sets `isStreaming: false`.
`cancelGeneration()` aborts via the same `AbortController`, which also aborts the fetch to our
own proxy (and, by extension, the upstream request the proxy is making).
