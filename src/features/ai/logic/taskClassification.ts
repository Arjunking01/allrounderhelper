/**
 * Deterministic task classification for provider routing.
 *
 * This is intentionally rule-based, not a second AI call: classification has to be fast
 * (it runs on every message before we've picked a provider) and cheap, and simple keyword/
 * pattern rules are reliable enough for routing purposes — they don't need to be perfect,
 * they need to bias the router toward a sensible provider most of the time. When nothing
 * matches confidently, we fall back to 'general_question' rather than guessing hard.
 */

export type TaskCategory =
  | 'general_question'
  | 'study_help'
  | 'explain_concept'
  | 'summarize'
  | 'document_summary'
  | 'exam_preparation'
  | 'quiz_generation'
  | 'flashcards'
  | 'mathematics'
  | 'science'
  | 'coding'
  | 'debugging'
  | 'code_explanation'
  | 'writing'
  | 'rewriting'
  | 'brainstorming'
  | 'research'
  | 'reasoning'
  | 'long_context'
  | 'translation'
  | 'productivity'
  | 'planning';

export interface TaskClassification {
  category: TaskCategory;
  /** 0-1, how confident the rule match was. Low confidence still returns a best-guess category. */
  confidence: number;
  /** Which signal(s) drove the classification — useful for debugging routing decisions, never shown to the user. */
  matchedSignals: string[];
  /** True when the request carries a document attachment, independent of category — used to weight long-context suitability. */
  hasDocumentContext: boolean;
}

interface Rule {
  category: TaskCategory;
  patterns: RegExp[];
}

// Ordered roughly by specificity: more specific study/coding intents are checked before
// generic catch-alls so e.g. "explain this code" resolves to code_explanation, not explain_concept.
// General/broad rules (writing, explain_concept, study_help, etc.) are deliberately last so a
// narrower, more specific match always wins first.
const ALL_RULES: Rule[] = [
  { category: 'debugging', patterns: [/\b(debug|fix (this|my) (bug|error|code)|why (is|does) (this|my) code|stack trace|traceback|exception|not working|throws? an error)\b/i] },
  { category: 'code_explanation', patterns: [/\b(explain (this|my) code|what does this (code|function|snippet) do|walk me through this code)\b/i] },
  { category: 'coding', patterns: [/\b(write (a|some) (function|code|script|program|class|component)|implement|refactor|regex|algorithm|leetcode|compile|syntax error|```|function\s*\(|def |const |import |console\.log|SELECT .* FROM)\b/i] },
  // Explicit study-format requests (flashcards/quiz/exam prep/document summary) are checked
  // before the generic subject-domain rules (mathematics/science) below: a request like "make
  // me flashcards for biology" mentions a science keyword ("biology") incidentally, but the
  // format the user actually asked for — flashcards — is the more specific, more actionable
  // signal for routing and must win. Same reasoning applies to quiz/exam-prep vs. a subject name.
  { category: 'flashcards', patterns: [/\b(flash ?cards?)\b/i] },
  { category: 'quiz_generation', patterns: [/\b(quiz|practice questions|mcqs?|multiple[- ]choice)\b/i] },
  { category: 'exam_preparation', patterns: [/\b(exam prep|study for (my|the) (exam|test)|revision plan|before my (exam|test))\b/i] },
  // Deliberately requires an explicit document-ish noun ("summarize this pdf/file/document/
  // attachment/upload") — a bare "tl;dr this <anything>" is NOT treated as document_summary,
  // since that phrasing alone doesn't establish there's an actual document involved (it falls
  // through to the generic 'summarize' rule below instead, via its own \btl;?dr\b pattern).
  // The hasDocumentAttachment default (see below the rule loop) is what correctly routes a real
  // attached-file request that doesn't use any of these specific words.
  { category: 'document_summary', patterns: [/\bsummarize (this|the) (document|pdf|file|attachment|upload)\b/i] },
  { category: 'mathematics', patterns: [/\b(solve|equation|derivative|integral|algebra|calculus|geometry|trigonometry|factorize|simplify)\b.*[=+\-*/^]|\b(math problem|word problem)\b/i] },
  { category: 'science', patterns: [/\b(physics|chemistry|biology|photosynthesis|newton'?s law|chemical reaction|periodic table|cell (biology|division)|thermodynamics|genetics)\b/i] },
  { category: 'summarize', patterns: [/\b(summarize|summary|tl;?dr|key points|main points|condense)\b/i] },
  { category: 'translation', patterns: [/\b(translate|translation)\b.*\b(to|into)\b|\b(in (spanish|french|german|hindi|japanese|chinese|arabic))\b/i] },
  { category: 'rewriting', patterns: [/\b(rewrite|reword|paraphrase|make this (sound|more)|improve this (sentence|paragraph|text))\b/i] },
  { category: 'writing', patterns: [/\b(write (a|an) (essay|article|blog|post|story|poem|letter|email)|draft (a|an|my))\b/i] },
  { category: 'brainstorming', patterns: [/\b(brainstorm|ideas for|give me (some )?ideas|come up with)\b/i] },
  { category: 'research', patterns: [/\b(research|find sources|compare .* (vs|versus)|literature review)\b/i] },
  { category: 'planning', patterns: [/\b(plan (my|a)|schedule|timetable|itinerary|study plan|roadmap)\b/i] },
  { category: 'productivity', patterns: [/\b(to-?do list|organize my|productivity|prioritize my tasks)\b/i] },
  { category: 'reasoning', patterns: [/\b(why (does|is|do)|reason through|logically|step by step reasoning|prove that)\b/i] },
  { category: 'explain_concept', patterns: [/\b(explain|what is|what are|how does .* work|define|meaning of)\b/i] },
  { category: 'study_help', patterns: [/\b(help me (study|learn|understand)|homework|assignment help)\b/i] },
];

/** Requests longer than this (characters) get a long-context boost regardless of matched category. */
const LONG_CONTEXT_CHAR_THRESHOLD = 6000;

export function classifyTask(text: string, hasDocumentAttachment = false): TaskClassification {
  const trimmed = (text ?? '').trim();

  // A short instruction attached to a document ("summarize this") falls through to the
  // document_summary default below unless the text itself clearly asks for something else —
  // checked by the rule loop first so a specific request always wins over the attachment default.
  for (const rule of ALL_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(trimmed)) {
        return {
          category: rule.category,
          confidence: 0.75,
          matchedSignals: [pattern.source.slice(0, 40)],
          hasDocumentContext: hasDocumentAttachment,
        };
      }
    }
  }

  if (hasDocumentAttachment) {
    return { category: 'document_summary', confidence: 0.5, matchedSignals: ['document_attachment_no_keyword_match'], hasDocumentContext: true };
  }

  if (trimmed.length > LONG_CONTEXT_CHAR_THRESHOLD) {
    return { category: 'long_context', confidence: 0.5, matchedSignals: ['message_length'], hasDocumentContext: hasDocumentAttachment };
  }

  return { category: 'general_question', confidence: 0.3, matchedSignals: ['no_rule_matched'], hasDocumentContext: hasDocumentAttachment };
}
