/** Shared cap for how much extracted document text gets embedded in an AI Assistant
 *  hand-off prompt. Mirrors MAX_ATTACHMENT_TEXT_CHARS in the AI feature's own attachment
 *  pipeline (features/ai/logic/attachmentTypes.ts) — kept as a separate local constant
 *  rather than importing across the document/ai feature boundary, since the two limits
 *  are allowed to drift independently even though they start at the same value today. */
const MAX_HANDOFF_TEXT_CHARS = 20000;

export interface AiHandoffState {
  /** Read by AiAssistantPage on mount and used to prefill the composer verbatim. */
  draftPrompt: string;
  /** Where the hand-off originated, purely for the floating "Ask AI" button's own
   *  suppression logic (it already reads pageContext-shaped state elsewhere). */
  pageContext?: string;
}

/** Builds the prompt + router state for a "Continue with AI" action from a document tool
 *  that just produced extracted text (OCR, PDF-to-text, etc). Truncates long documents with
 *  a clear note rather than silently cutting them off, matching the AI attachment pipeline's
 *  own truncation behavior.
 *
 *  Deliberately does NOT presume what the student wants done with the text (e.g. hardcoding
 *  "summarize this") — different students will want a summary, viva questions, an explanation
 *  of one section, etc. Instead the composer confirms the handoff and asks the open question,
 *  with the document content clearly separated below it so it reads as "here's what I have,
 *  what do you want done with it" rather than the assistant assuming the task. */
export function buildAskAiAboutTextState(text: string, toolName: string): AiHandoffState {
  const trimmed = text.trim();
  const truncated =
    trimmed.length > MAX_HANDOFF_TEXT_CHARS
      ? trimmed.slice(0, MAX_HANDOFF_TEXT_CHARS) + `\n\n[Truncated — original is longer than ${MAX_HANDOFF_TEXT_CHARS.toLocaleString()} characters.]`
      : trimmed;

  return {
    draftPrompt: `I've got the text from ${toolName} below. What would you like me to do with it — summarize it, pull out viva/exam questions, explain a specific part, something else?\n\n---\n\n${truncated}`,
    pageContext: toolName,
  };
}
