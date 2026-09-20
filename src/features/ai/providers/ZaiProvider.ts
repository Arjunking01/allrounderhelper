import { createOpenAICompatibleProvider } from './openAICompatibleProvider';

// Real key (ZAI_API_KEY) lives server-side only, read by api/ai/zai.ts.
// VITE_ZAI_ENABLED is a new non-secret flag following this project's established
// convention (see AI_PROVIDER_GUIDE.md) — not among the env vars already configured in
// Vercel as of this session, so the deployer needs to add VITE_ZAI_ENABLED=1 for this
// provider to actually appear as available, even though ZAI_API_KEY is set.
//
// Default model: 'glm-5.2' — the example model used in Z.ai's own official quick-start
// docs (docs.z.ai) as of 2026.
export const zaiProvider = createOpenAICompatibleProvider({
  id: 'zai',
  name: 'Z.ai',
  mode: 'proxy',
  enabled: (import.meta.env.VITE_ZAI_ENABLED as string | undefined) === '1',
  proxyPath: '/api/ai/zai',
  defaultModel: 'glm-5.2',
  maxContextTokens: 128_000,
  envVarName: 'ZAI_API_KEY',
});
