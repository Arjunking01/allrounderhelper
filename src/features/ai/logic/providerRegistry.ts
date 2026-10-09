import type { AIProvider, AISettings, ProviderMeta } from './aiTypes';
import type { TaskCategory } from './taskClassification';
import { routeProviderOrder } from './routingPolicy';
import { geminiProvider } from '../providers/GeminiProvider';
import { cerebrasProvider } from '../providers/CerebrasProvider';
import { openRouterProvider } from '../providers/OpenRouterProvider';
import { mistralProvider } from '../providers/MistralProvider';
import { openAIProvider } from '../providers/OpenAIProvider';
import { xaiProvider } from '../providers/XaiProvider';
import { zaiProvider } from '../providers/ZaiProvider';
import { cloudflareProvider } from '../providers/CloudflareProvider';
import { vercelGatewayProvider } from '../providers/VercelGatewayProvider';

/**
 * The only provider that never calls a real model — it honestly reports that no AI
 * provider is connected. Kept as the default so the chat UI is always demoable even
 * with zero API keys configured.
 */
const noneProvider: AIProvider = {
  id: 'none',
  name: 'No provider connected',
  capabilities: { streaming: false, vision: false, maxContextTokens: 0 },
  isConfigured: () => false,
  async sendMessage() {
    return {
      content: '',
      finishReason: 'error' as const,
      error: {
        code: 'not_configured' as const,
        message: 'No AI provider is currently available. Please try again later.',
      },
    };
  },
};

const registry = new Map<string, AIProvider>();
[noneProvider, vercelGatewayProvider, geminiProvider, cerebrasProvider, mistralProvider, openRouterProvider, openAIProvider, xaiProvider, zaiProvider, cloudflareProvider].forEach((p) => registry.set(p.id, p));

/** Registers a provider implementation. Call this to add another provider without touching the rest of the app. */
export function registerProvider(provider: AIProvider) {
  registry.set(provider.id, provider);
}

export function getProvider(id: string): AIProvider {
  return registry.get(id) ?? noneProvider;
}

/** Canonical fallback order used when the active provider fails and automatic failover is triggered.
 *  Cerebras/Mistral/OpenRouter first per current priority — Gemini is deprioritized (billing disabled)
 *  but left in the chain in case a deployment re-enables it later; excluded from being that chain's head.
 *  xai/zai/cloudflare are appended after the established providers rather than inserted ahead of them —
 *  they're newly integrated this session and unproven in production for this app, so fallback priority
 *  is conservative by default. Reorder here if a deployment has reason to prefer one of them. */
const FALLBACK_ORDER = ['vercel-gateway', 'cerebras', 'mistral', 'openrouter', 'openai', 'xai', 'zai', 'cloudflare', 'gemini'];

export function getActiveProvider(settings: AISettings): AIProvider {
  const active = getProvider(settings.activeProviderId);
  // 'none' is the default when no provider has been explicitly configured/persisted yet.
  // In that case, auto-pick the first configured provider in FALLBACK_ORDER so a deployment
  // with any provider's key set works out of the box without requiring a visit to Settings.
  if (active.id === 'none') {
    for (const id of FALLBACK_ORDER) {
      const candidate = getProvider(id);
      if (candidate.isConfigured(settings)) return candidate;
    }
  }
  return active;
}

/**
 * Ordered chain of configured providers to try for a single request: the active provider
 * first, then every other configured provider in FALLBACK_ORDER (deduplicated). 'none' is
 * never included as a fallback target — it can't produce a real response.
 */
export function getFallbackChain(settings: AISettings): AIProvider[] {
  const active = getActiveProvider(settings);
  if (active.id === 'none') return [active];

  const chain: AIProvider[] = [active];
  const seen = new Set<string>([active.id]);

  for (const id of FALLBACK_ORDER) {
    if (seen.has(id)) continue;
    seen.add(id);
    const p = getProvider(id);
    if (p.isConfigured(settings)) chain.push(p);
  }
  return chain;
}

/**
 * Task-aware version of getFallbackChain: same eligibility rules (only configured providers,
 * 'none' excluded from fallback), but the ORDER is decided by the routing policy for the given
 * task category instead of the static FALLBACK_ORDER \u2014 e.g. a summarization task will tend
 * to surface Cerebras first among eligible providers, a coding task will tend to surface a
 * coding-strong provider first. See routingPolicy.ts for the scoring and for the rule that an
 * explicit user-selected provider (settings.activeProviderId) always stays first regardless of
 * task \u2014 routing only chooses automatically when the user hasn't made an explicit pick, or
 * reorders the fallback providers that come after that pick.
 *
 * This is what AiAssistantPage should call for real sends; getFallbackChain above remains for
 * any caller that genuinely wants the static, task-agnostic order (e.g. tests, or a future
 * "disable smart routing" setting).
 */
/** True when `provider` can actually accept every MIME type in `imageMimeTypes` \u2014 not just
 *  "is vision-capable in general". Phase 1.7: a plain `vision: true` flag was never precise
 *  enough on its own \u2014 e.g. xAI's own docs (docs.x.ai/developers/model-capabilities/images)
 *  document jpg/jpeg + png ONLY, no WebP, despite this app's upload picker accepting WebP.
 *  `imageMimeTypes` undefined/empty (no images in this request, or caller didn't pass any)
 *  always passes \u2014 this function only ever narrows eligibility for requests that actually
 *  carry image data of a known format. A provider missing `supportedImageMimeTypes` entirely
 *  while `vision` is true is treated as supporting NOTHING (fail closed, not open) \u2014 see the
 *  field's own doc comment in aiTypes.ts for why guessing "probably fine" here is exactly the
 *  bug this exists to prevent. */
function supportsImageFormats(provider: AIProvider, imageMimeTypes: string[] | undefined): boolean {
  if (!provider.capabilities.vision) return false;
  if (!imageMimeTypes || imageMimeTypes.length === 0) return true;
  const supported = provider.capabilities.supportedImageMimeTypes;
  if (!supported) return false;
  return imageMimeTypes.every((mt) => supported.includes(mt));
}

export function getRoutedFallbackChain(settings: AISettings, category: TaskCategory, requireVision = false, imageMimeTypes?: string[]): AIProvider[] {
  let configuredIds = FALLBACK_ORDER.filter((id) => getProvider(id).isConfigured(settings));
  // Image-bearing requests must never reach a provider that can't view images AT ALL, or one
  // that can't view THIS format specifically (see supportsImageFormats above) \u2014 sending its
  // adapter `images` data it has no way to use (see openAICompatibleProvider.toOpenAIContent's
  // defensive fallback) is a bug-shaped situation, not a real answer path. Filtering the
  // candidate set here, before scoring/ordering, is the actual enforcement point; callers
  // (providerOrchestrator via RoutingContext.hasImageAttachment/imageMimeTypes) decide when to
  // set this.
  if (requireVision) configuredIds = configuredIds.filter((id) => supportsImageFormats(getProvider(id), imageMimeTypes));
  if (configuredIds.length === 0) return [getProvider('none')];

  const ordered = routeProviderOrder(configuredIds, category, settings);
  return ordered.map((id) => getProvider(id));
}

/** True when at least one currently-configured/enabled provider can actually handle this
 *  request's images \u2014 both "supports vision at all" AND, when `imageMimeTypes` is given,
 *  "supports these exact formats" (see supportsImageFormats). Used by AiAssistantPage to
 *  decide, BEFORE sending, whether an image attachment can be processed at all \u2014 so the app
 *  can give an honest "no vision provider connected" (or, Phase 1.7, "no provider supports
 *  this format") notice instead of silently routing to a text-only model, or routing to a
 *  vision model that will itself reject the specific format sent. */
export function hasVisionCapableProvider(settings: AISettings, imageMimeTypes?: string[]): boolean {
  return FALLBACK_ORDER.some((id) => {
    const p = getProvider(id);
    return p.isConfigured(settings) && supportsImageFormats(p, imageMimeTypes);
  });
}

/**
 * Metadata for every provider we intend to support, for the Settings provider picker.
 * Status is honestly derived from isConfigured() — nothing is labeled 'available' unless
 * a real API key is actually present in the environment.
 */
export const PROVIDER_CATALOG: ProviderMeta[] = [
  { id: 'none', name: 'No provider', status: 'available', description: 'Chat UI works, but responses are not generated.' },
  { id: 'vercel-gateway', name: 'Vercel AI Gateway', status: 'available', description: 'Managed AI routing with no provider key in the browser.' },
  { id: 'gemini', name: 'Google Gemini', status: geminiProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: geminiProvider.isConfigured({} as AISettings) ? 'Available.' : 'Not available right now.' },
  { id: 'cerebras', name: 'Cerebras', status: cerebrasProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: cerebrasProvider.isConfigured({} as AISettings) ? 'Available.' : 'Not available right now.' },
  { id: 'mistral', name: 'Mistral', status: mistralProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: mistralProvider.isConfigured({} as AISettings) ? 'Available.' : 'Not available right now.' },
  { id: 'openrouter', name: 'OpenRouter', status: openRouterProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: openRouterProvider.isConfigured({} as AISettings) ? 'Available.' : 'Not available right now.' },
  { id: 'openai', name: 'OpenAI', status: openAIProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: openAIProvider.isConfigured({} as AISettings) ? 'Available.' : 'Not available right now.' },
  { id: 'xai', name: 'Grok (xAI)', status: xaiProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: xaiProvider.isConfigured({} as AISettings) ? 'Available.' : 'Not available right now.' },
  { id: 'zai', name: 'Z.ai', status: zaiProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: zaiProvider.isConfigured({} as AISettings) ? 'Available.' : 'Not available right now.' },
  { id: 'cloudflare', name: 'Cloudflare Workers AI', status: cloudflareProvider.isConfigured({} as AISettings) ? 'available' : 'planned', description: cloudflareProvider.isConfigured({} as AISettings) ? 'Available. Streaming is not supported for this provider.' : 'Not available right now.' },
  { id: 'anthropic', name: 'Anthropic Claude', status: 'planned', description: 'Not available yet.' },
  { id: 'local', name: 'Local model', status: 'planned', description: 'Not available yet.' },
];
