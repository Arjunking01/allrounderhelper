/**
 * Provider capability/suitability matrix used by the routing policy (routingPolicy.ts).
 *
 * This is deliberately separate from AIProviderCapabilities in aiTypes.ts (streaming/vision/
 * maxContextTokens — hard technical facts about the wire protocol). This file instead scores
 * how *well suited* each provider is to different kinds of work, on a plain 1-5 scale.
 *
 * VERIFICATION LEVEL — read before changing these numbers:
 * Every score here is DOCUMENTATION VERIFIED (based on each vendor's publicly documented
 * model characteristics and this project's own provider adapters — model IDs, context
 * windows, streaming support) — NOT LIVE VERIFIED. Nothing here was benchmarked by running
 * real requests against these models. Treat these as reasonable priors for routing, not as
 * measured performance. If you have live eval data for this app, replace these numbers with
 * it and update this comment.
 *
 * Do not invent capabilities a provider doesn't actually have — cross-check against the
 * matching file in src/features/ai/providers/ before editing.
 */

import type { TaskCategory } from './taskClassification';

export interface ProviderSuitability {
  /** Response latency — how fast the provider tends to answer. 5 = very fast. */
  speed: number;
  /** Coding/debugging quality. */
  coding: number;
  /** Multi-step reasoning / math / logic quality. */
  reasoning: number;
  /** Summarization / condensing quality. */
  summarization: number;
  /** How well the provider handles long documents (a function of both context window and model quality). */
  longContext: number;
  /** General prose/writing quality. */
  writing: number;
}

export interface ProviderCapabilityProfile {
  providerId: string;
  suitability: ProviderSuitability;
  /** Fixed score penalty applied regardless of task — e.g. Gemini's billing requirement. 0 = no penalty. */
  deprioritizePenalty: number;
  /** Short human-readable reason for the penalty, if any (shown nowhere user-facing today — for engineering/debug use). */
  deprioritizeReason?: string;
}

// Cerebras (llama3.1-8b via Cerebras inference): Cerebras's inference hardware is publicly
// known for very high tokens/sec — that's the whole point of the service — but the deployed
// model here is a small 8B model, so reasoning/coding depth is modest. Strong fit for fast,
// low-latency study tasks (summaries, quick explanations, flashcards) per this project's brief.
const CEREBRAS: ProviderCapabilityProfile = {
  providerId: 'cerebras',
  suitability: { speed: 5, coding: 2, reasoning: 2, summarization: 4, longContext: 3, writing: 2 },
  deprioritizePenalty: 0,
};

// Mistral (mistral-small-latest): solid general-purpose mid-size model, smaller context window
// (32K, per MistralProvider.ts) than most others in this registry.
const MISTRAL: ProviderCapabilityProfile = {
  providerId: 'mistral',
  suitability: { speed: 4, coding: 3, reasoning: 3, summarization: 3, longContext: 2, writing: 3 },
  deprioritizePenalty: 0,
};

// OpenRouter (openrouter/auto): routes to whichever underlying model OpenRouter selects, so
// scores here are a moderate, "unknown until routed" average rather than a specific model's profile.
const OPENROUTER: ProviderCapabilityProfile = {
  providerId: 'openrouter',
  suitability: { speed: 3, coding: 3, reasoning: 3, summarization: 3, longContext: 4, writing: 3 },
  deprioritizePenalty: 0,
};

// OpenAI (gpt-4o-mini): capable, well-rounded small flagship model with vision support.
const OPENAI: ProviderCapabilityProfile = {
  providerId: 'openai',
  suitability: { speed: 3, coding: 4, reasoning: 4, summarization: 4, longContext: 4, writing: 4 },
  deprioritizePenalty: 0,
};

// Grok / xAI (grok-4.5, per XaiProvider.ts): xAI positions its flagship Grok models around
// strong reasoning and coding benchmarks; treated here as a strong reasoning/coding choice.
const XAI: ProviderCapabilityProfile = {
  providerId: 'xai',
  suitability: { speed: 3, coding: 4, reasoning: 5, summarization: 3, longContext: 4, writing: 3 },
  deprioritizePenalty: 0,
};

// Z.ai (glm-5.2): GLM-series models are documented as strong at coding/agentic tasks.
const ZAI: ProviderCapabilityProfile = {
  providerId: 'zai',
  suitability: { speed: 3, coding: 4, reasoning: 3, summarization: 3, longContext: 4, writing: 3 },
  deprioritizePenalty: 0,
};

// Cloudflare Workers AI: runs at the edge for low latency, but this project's adapter
// explicitly does not support streaming yet (CloudflareProvider.ts) and the configured context
// window is small (8K) — treat as fast-but-limited, a fallback rather than a first choice for
// anything beyond very short exchanges.
const CLOUDFLARE: ProviderCapabilityProfile = {
  providerId: 'cloudflare',
  suitability: { speed: 5, coding: 2, reasoning: 2, summarization: 3, longContext: 1, writing: 2 },
  deprioritizePenalty: 1,
  deprioritizeReason: 'No streaming support in this app\u2019s adapter yet; small context window.',
};

// Gemini: strong capability profile (huge context window, vision) but intentionally
// deprioritized project-wide because billing is required and not currently enabled
// (see ENGINEERING_DECISIONS.md / providerRegistry.ts FALLBACK_ORDER comment).
const GEMINI: ProviderCapabilityProfile = {
  providerId: 'gemini',
  suitability: { speed: 3, coding: 3, reasoning: 4, summarization: 4, longContext: 5, writing: 4 },
  deprioritizePenalty: 6,
  deprioritizeReason: 'Billing required \u2014 deprioritized project-wide until enabled.',
};

const PROFILES: Record<string, ProviderCapabilityProfile> = {
  cerebras: CEREBRAS,
  mistral: MISTRAL,
  openrouter: OPENROUTER,
  openai: OPENAI,
  xai: XAI,
  zai: ZAI,
  cloudflare: CLOUDFLARE,
  gemini: GEMINI,
};

export function getCapabilityProfile(providerId: string): ProviderCapabilityProfile | undefined {
  return PROFILES[providerId];
}

/**
 * Per-task-category weighting over the suitability dimensions above. Values don't need to sum
 * to 1 — only relative weight within a category matters, since scores are compared within the
 * same category. Categories not listed fall back to DEFAULT_WEIGHTS (a balanced generalist mix).
 */
type SuitabilityWeights = Partial<Record<keyof ProviderSuitability, number>>;

const DEFAULT_WEIGHTS: SuitabilityWeights = { speed: 0.3, reasoning: 0.3, writing: 0.2, summarization: 0.2 };

const CATEGORY_WEIGHTS: Partial<Record<TaskCategory, SuitabilityWeights>> = {
  // Fast student-focused tasks \u2014 favors Cerebras-style speed + summarization per this
  // project's brief (see providerRegistry.ts / routingPolicy.ts for how Cerebras is preferred here).
  summarize: { speed: 0.4, summarization: 0.5, longContext: 0.1 },
  document_summary: { speed: 0.3, summarization: 0.5, longContext: 0.2 },
  quiz_generation: { speed: 0.5, summarization: 0.3, reasoning: 0.2 },
  flashcards: { speed: 0.5, summarization: 0.4, writing: 0.1 },
  exam_preparation: { speed: 0.4, summarization: 0.4, reasoning: 0.2 },
  study_help: { speed: 0.4, summarization: 0.3, reasoning: 0.3 },
  explain_concept: { speed: 0.3, reasoning: 0.3, writing: 0.4 },

  coding: { coding: 0.7, reasoning: 0.3 },
  debugging: { coding: 0.7, reasoning: 0.3 },
  code_explanation: { coding: 0.6, writing: 0.4 },

  mathematics: { reasoning: 0.7, coding: 0.1, summarization: 0.2 },
  science: { reasoning: 0.6, writing: 0.2, summarization: 0.2 },
  reasoning: { reasoning: 0.8, coding: 0.2 },

  writing: { writing: 0.7, reasoning: 0.3 },
  rewriting: { writing: 0.8, speed: 0.2 },
  brainstorming: { writing: 0.5, reasoning: 0.3, speed: 0.2 },

  research: { longContext: 0.5, reasoning: 0.5 },
  long_context: { longContext: 0.7, reasoning: 0.3 },

  translation: { writing: 0.6, speed: 0.4 },
  productivity: { speed: 0.4, writing: 0.3, reasoning: 0.3 },
  planning: { reasoning: 0.4, writing: 0.3, speed: 0.3 },

  general_question: DEFAULT_WEIGHTS,
};

export function getCategoryWeights(category: TaskCategory): SuitabilityWeights {
  return CATEGORY_WEIGHTS[category] ?? DEFAULT_WEIGHTS;
}
