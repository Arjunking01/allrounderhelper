import { createOpenAICompatibleProvider } from './openAICompatibleProvider';

// Real key (MISTRAL_API_KEY) lives server-side only, read by api/ai/mistral.ts.
// VITE_MISTRAL_ENABLED is a non-secret flag the deployer sets alongside it.
export const mistralProvider = createOpenAICompatibleProvider({
  id: 'mistral',
  name: 'Mistral',
  mode: 'proxy',
  enabled: (import.meta.env.VITE_MISTRAL_ENABLED as string | undefined) === '1',
  proxyPath: '/api/ai/mistral',
  defaultModel: 'mistral-small-latest',
  maxContextTokens: 32_000,
  envVarName: 'MISTRAL_API_KEY',
});
