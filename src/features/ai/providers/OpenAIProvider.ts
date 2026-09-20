import { createOpenAICompatibleProvider } from './openAICompatibleProvider';

// Real key (OPENAI_API_KEY) lives server-side only, read by api/ai/openai.ts.
// VITE_OPENAI_ENABLED is a non-secret flag the deployer sets alongside it.
//
// PHASE 1.7: MIME types re-verified this session against OpenAI's documented vision format
// list (platform.openai.com/docs/guides/vision, corroborated by multiple independent
// integration docs) — PNG, JPEG, WebP, and non-animated GIF. Unlike xAI, this covers every
// format this app's own upload picker accepts (attachmentTypes.ts ACCEPTED_TYPES), so OpenAI
// is never narrowed out by the MIME-aware routing check in providerRegistry.ts for any
// currently-supported upload type.
export const openAIProvider = createOpenAICompatibleProvider({
  id: 'openai',
  name: 'OpenAI',
  mode: 'proxy',
  enabled: (import.meta.env.VITE_OPENAI_ENABLED as string | undefined) === '1',
  proxyPath: '/api/ai/openai',
  defaultModel: 'gpt-4o-mini',
  maxContextTokens: 128_000,
  vision: true,
  visionMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  envVarName: 'OPENAI_API_KEY',
});
