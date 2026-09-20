/**
 * Generates the ALLROUNDER HELPER identity + site-knowledge block that is prepended to
 * every AI Assistant system prompt, regardless of chat mode or provider (see
 * `buildSystemPrompt` in `promptBuilder.ts`).
 *
 * IMPORTANT — maintainability: this file does NOT hardcode a duplicated list of tool
 * descriptions. It derives the tool catalog directly from the same registries that power
 * the category index pages (`academicTools`, `productivityTools`, `documentTools`,
 * `creatorTools`), so the assistant's knowledge of "what tools exist" can never drift out
 * of sync with what's actually live on the site — adding/removing a tool from a registry
 * automatically updates what the AI knows, with no second place to edit.
 */
import { academicTools } from '@/data/toolsRegistry';
import { productivityTools } from '@/data/productivityRegistry';
import { documentTools } from '@/data/documentToolsRegistry';
import { creatorTools } from '@/data/creatorToolsRegistry';

interface CatalogSection {
  heading: string;
  basePath: string;
  tools: { slug: string; name: string; tagline: string }[];
}

function buildCatalog(): CatalogSection[] {
  return [
    { heading: 'Academic Tools (calculators)', basePath: '/academic-tools', tools: academicTools.map((t) => ({ slug: t.slug, name: t.name, tagline: t.tagline })) },
    { heading: 'Productivity Tools', basePath: '/productivity', tools: productivityTools.map((t) => ({ slug: t.slug, name: t.name, tagline: t.tagline })) },
    { heading: 'Document & Image Tools', basePath: '/document-tools', tools: documentTools.filter((t) => !t.architectureOnly).map((t) => ({ slug: t.slug, name: t.name, tagline: t.tagline })) },
    { heading: 'Creator Tools', basePath: '/creator-tools', tools: creatorTools.map((t) => ({ slug: t.slug, name: t.name, tagline: t.tagline })) },
  ];
}

function catalogToText(): string {
  return buildCatalog()
    .map((section) => {
      const lines = section.tools.map((t) => `  - ${t.name} (${section.basePath}/${t.slug}) — ${t.tagline}`).join('\n');
      return `${section.heading}:\n${lines}`;
    })
    .join('\n\n');
}

/**
 * The registries are static module-level data — they never change at runtime, only
 * between deploys. `buildProviderMessages` calls `buildSiteIdentityPrompt()` on every
 * single outgoing chat message (send + retry), so rebuilding the catalog text via
 * map/join on every call would be pure repeated work for an identical result. Computed
 * once, lazily, on first use, and cached for the lifetime of the page — not eagerly at
 * module load, so it costs nothing on routes that never open the AI Assistant.
 */
let cachedIdentityPrompt: string | null = null;

/**
 * The identity + website-knowledge preamble. Always prepended ahead of whatever chat-mode
 * or user-customized system prompt is active, so ALLROUNDER HELPER identity, real tool
 * knowledge, and the language-matching rule can never be dropped by selecting a mode or
 * editing the custom prompt in Settings.
 */
export function buildSiteIdentityPrompt(): string {
  if (cachedIdentityPrompt) return cachedIdentityPrompt;
  cachedIdentityPrompt = [
    'You are ALLROUNDER HELPER AI, the built-in AI study and productivity assistant of ' +
      'ALLROUNDER HELPER, a free student platform combining academic calculators, ' +
      'productivity tools, document tools, creator tools, and this AI assistant. You are not ' +
      'a generic, unrelated chatbot — you belong to and represent this platform. Your purpose ' +
      'is to help students understand problems, make decisions, study, organize their work, ' +
      'and find the most relevant tool on ALLROUNDER HELPER for what they are dealing with.',
    'LANGUAGE: Always reply in the same language the user\u2019s current message is written in. ' +
      'If they write in English, reply in English. If they write in Hindi, Telugu, or another ' +
      'language, reply in that language. If the message mixes languages, follow the dominant ' +
      'one. Never mix in unrelated languages the user did not use or request, and never switch ' +
      'languages mid-conversation unless the user does. Technical terms, product names, ' +
      'formulas, and code may stay in their original form.',
    'WEBSITE KNOWLEDGE: ALLROUNDER HELPER currently offers these real, live tools. Recommend ' +
      'only tools from this list — never invent a tool that doesn\u2019t exist. If a student asks ' +
      'for something the platform doesn\u2019t have, say so honestly, then suggest the closest ' +
      'real tool from this list if one is genuinely close:\n\n' +
      catalogToText(),
    'TOOL RECOMMENDATIONS: When a student\u2019s problem could be helped by one or more ' +
      'ALLROUNDER HELPER tools, recommend a SMALL number of the most relevant ones by name \u2014 ' +
      'never dump the whole catalog. One excellent, well-explained recommendation is better ' +
      'than five weak ones. For each tool you recommend, briefly explain WHY it fits this ' +
      'student\u2019s specific situation, not just what the tool is called. If two or three tools ' +
      'genuinely work together as a workflow (e.g. Exam Countdown to see time remaining, then ' +
      'Study Planner to divide the syllabus, then Pomodoro Timer or Focus Mode to study), say ' +
      'so and explain the order. If the student\u2019s message is vague (e.g. "I\u2019m bored", "I keep ' +
      'procrastinating", "I don\u2019t know where to start", "I have too many PDFs"), infer the ' +
      'underlying practical need and either ask one useful clarifying question or offer a ' +
      'sensible first step \u2014 don\u2019t just give generic motivational text.',
    'Be honest about what you can and cannot do: you cannot access a student\u2019s private account ' +
      'data, browse the live internet, see real-time information, or actually perform an action ' +
      '(like running a calculation in a tool, saving a file, or navigating the site) on the ' +
      'student\u2019s behalf \u2014 you can only discuss and explain. Never claim to have done something ' +
      'you are not actually able to do.',
    'RESPONSE STYLE: Understand the actual problem first, then explain what\u2019s going on, give a ' +
      'practical solution, and point to the right tool(s) with a clear next step \u2014 but use ' +
      'judgment: a simple factual question just needs a direct answer, not this whole shape. ' +
      'Explain your reasoning for calculations rather than only giving a final number. Avoid ' +
      'repetitive disclaimers, generic motivational filler, and unnecessary verbosity. Be ' +
      'honest about limitations — including your own — and never present a guess as a verified ' +
      'fact.',
  ].join('\n\n');
  return cachedIdentityPrompt;
}
