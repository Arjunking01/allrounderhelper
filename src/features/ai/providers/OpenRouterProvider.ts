import { createOpenAICompatibleProvider } from './openAICompatibleProvider';

// Real key (OPENROUTER_API_KEY) lives server-side only, read by api/ai/openrouter.ts.
// VITE_OPENROUTER_ENABLED is a non-secret flag the deployer sets alongside it.
//
// This provider previously ran in 'direct' mode, calling OpenRouter straight from the
// browser with a VITE_OPENROUTER_API_KEY on the reasoning that OpenRouter's docs support
// client-side keys for browser apps. That reasoning doesn't hold up: any VITE_*-prefixed
// variable is statically inlined into the built JS bundle by Vite and is readable by
// anyone who opens dev tools or views the bundle, regardless of what a given vendor's
// docs say is "supported" — Vite's own documentation explicitly warns against putting
// sensitive values in VITE_* vars for exactly this reason. A real OpenRouter key exposed
// this way could be extracted and used by anyone to spend the account's credits. Moved to
// the same server-proxy pattern every other provider in this app already uses so the
// secret never reaches the browser.
export const openRouterProvider = createOpenAICompatibleProvider({
  id: 'openrouter',
  name: 'OpenRouter',
  mode: 'proxy',
  enabled: (import.meta.env.VITE_OPENROUTER_ENABLED as string | undefined) === '1',
  proxyPath: '/api/ai/openrouter',
  defaultModel: 'openrouter/auto',
  maxContextTokens: 128_000,
  envVarName: 'OPENROUTER_API_KEY',
});
