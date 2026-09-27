import { createOpenAICompatibleProvider } from './openAICompatibleProvider';

/**
 * Vercel AI Gateway is authenticated by the Vercel runtime and never exposes a
 * provider key to the browser. It is intentionally text-only here: image
 * requests continue through the app's explicitly vision-capable providers.
 */
export const vercelGatewayProvider = createOpenAICompatibleProvider({
  id: 'vercel-gateway',
  name: 'Vercel AI Gateway',
  mode: 'proxy',
  enabled: true,
  proxyPath: '/api/ai/gateway',
  defaultModel: 'openai/o4-mini',
  maxContextTokens: 128_000,
  streaming: false,
  vision: false,
  envVarName: 'Vercel AI Gateway',
});

export default vercelGatewayProvider;
