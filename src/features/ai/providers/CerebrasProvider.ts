import { createOpenAICompatibleProvider } from './openAICompatibleProvider';

// Real key (CEREBRAS_API_KEY) lives server-side only, read by api/ai/cerebras.ts.
// VITE_CEREBRAS_ENABLED is a non-secret flag the deployer sets alongside it.
export const cerebrasProvider = createOpenAICompatibleProvider({
  id: 'cerebras',
  name: 'Cerebras',
  mode: 'proxy',
  enabled: (import.meta.env.VITE_CEREBRAS_ENABLED as string | undefined) === '1',
  proxyPath: '/api/ai/cerebras',
  defaultModel: 'llama3.1-8b',
  maxContextTokens: 128_000,
  envVarName: 'CEREBRAS_API_KEY',
});
