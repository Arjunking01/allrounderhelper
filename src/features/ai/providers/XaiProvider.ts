import { createOpenAICompatibleProvider } from './openAICompatibleProvider';

// Real key (XAI_API_KEY) lives server-side only, read by api/ai/xai.ts.
// VITE_GROK_ENABLED is a non-secret flag the deployer sets alongside it.
//
// PHASE 1.7 MODEL BUMP — grok-4.5 -> grok-4.6, re-verified via live web search this session
// against docs.x.ai directly (developers/models, developers/models/grok-4.6,
// developers/release-notes) plus multiple independent model-catalog sources (Requesty,
// Promptfoo, Bedrock, OpenRouter-style aggregators): xAI shipped Grok 4.6 on Aug 12/13, 2026 —
// about a month after Grok 4.5 (Jul 8/9, 2026) — and it is now xAI's flagship, explicitly built
// on the same foundation as 4.5 with additional RL/SFT for longer-running agentic and visual
// work. This is a genuine "the flagship actually changed" case, not "a newer model exists
// somewhere" — xAI's own docs.x.ai/developers/models page names Grok 4.6 as the current
// recommendation for chat/coding/agentic workloads and Grok 4.5 as the prior generation.
// Context window: 500,000 tokens for grok-4.6 (same as 4.5), confirmed directly on
// docs.x.ai/developers/models/grok-4.6 and Bedrock's model card — this app's previous
// maxContextTokens (128,000) was already stale for 4.5 too and is corrected here, not just
// bumped for the model change. Pricing is tiered above 200k prompt tokens (irrelevant to this
// app's routing/capabilities, not modeled here).
// Chat Completions endpoint: still current and functional per docs.x.ai/developers/models —
// documented as the "legacy" surface relative to the newer Responses API, but not removed, and
// still what this proxy uses since it's what this app's OpenAI-compatible factory expects.
// Revisit only if xAI actually removes Chat Completions support, not because a newer API exists.
// grok-4.5 remains reachable via an explicit AI Settings model override if a deployment prefers
// it (e.g. for cost, or before confirming 4.6 behaves identically for this app's use cases) —
// this change does not remove that option, only the *default*.
// vision: true, MIME types jpg/jpeg + png ONLY (no WebP, no GIF) — re-verified this session
// directly against docs.x.ai/developers/model-capabilities/images/understanding and the legacy
// Chat Completions guide: "Image input general limits — Maximum image size: 20MiB · Maximum
// number of images: No limit · Supported image file types: jpg/jpeg or png." This app's own
// upload picker also accepts WebP (see attachmentTypes.ts ACCEPTED_TYPES) — Phase 1.7's
// MIME-aware routing (providerRegistry.getRoutedFallbackChain / hasVisionCapableProvider) is
// what actually keeps a WebP upload from ever being routed to xAI; `openAICompatibleProvider`'s
// `visionMimeTypes` below is the second, adapter-level line of defense per the existing
// defense-in-depth pattern for non-vision providers.
export const xaiProvider = createOpenAICompatibleProvider({
  id: 'xai',
  name: 'Grok (xAI)',
  mode: 'proxy',
  enabled: (import.meta.env.VITE_GROK_ENABLED as string | undefined) === '1',
  proxyPath: '/api/ai/xai',
  defaultModel: 'grok-4.6',
  maxContextTokens: 500_000,
  vision: true,
  visionMimeTypes: ['image/jpeg', 'image/png'],
  envVarName: 'XAI_API_KEY',
});
