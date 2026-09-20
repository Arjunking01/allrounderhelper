/**
 * Detects whether the STUDENT'S OWN message is asking for a product recommendation, so the affiliate card
 * can accompany the reply. Pure client-side keyword matching — no extra AI call, no network request.
 * Deliberately conservative: false negatives (card doesn't show) are fine, false positives (card shows on an
 * unrelated or purely educational chat) are not.
 *
 * Only the user's message is inspected. The assistant's reply is deliberately ignored: an educational answer
 * can mention "camera", "keyboard" or "textbook" without the student having asked to buy anything.
 *
 * Two ways to match:
 *  1. PURCHASE_PHRASES — phrases that already express product-selection intent on their own.
 *  2. A product noun (PRODUCT_TERMS) together with purchase/recommendation wording. Strong words (buy,
 *     recommend, choose, worth it, ...) are enough; softer words (best, budget, good, ...) only count when the
 *     message isn't framed as an explanation, how-to or shortcut question.
 */
const PURCHASE_PHRASES = [
  'which laptop', 'which phone', 'what should i buy',
  // Purchase-intent phrases for "calculator" deliberately avoid the bare word — this app has its own
  // calculator tools, so ordinary math-help messages must not match.
  'which calculator should i buy', 'buy a calculator', 'calculator to buy', 'recommend a calculator',
  'best calculator for', 'good calculator for', 'scientific calculator to buy',
  // Books: narrow purchase-intent phrasing, never the bare word "book".
  'book recommendation', 'buy books', 'books to buy', 'which books should i buy', 'good books for', 'best books for',
];

const PRODUCT_TERMS = [
  'laptop', 'macbook', 'notebook pc', 'mobile phone', 'smartphone', 'iphone', 'android phone',
  'headphone', 'earphone', 'earbuds', 'airpods',
  'microphone', 'mic for', 'usb mic',
  'camera', 'webcam', 'dslr', 'mirrorless',
  'study product', 'student product', 'study kit', 'stationery', 'textbook',
  'creator setup', 'streaming setup', 'podcast setup', 'youtube setup', 'youtube gear', 'ring light',
  'instagram setup', 'content creation gear',
  'accessories', 'keyboard', 'mouse for', 'monitor for',
  'graphing calculator',
  'drawing pen', 'sketch pen', 'art pen', 'stylus', 'drawing tablet', 'graphic tablet', 'sketchbook',
  'art supplies', 'craft supplies', 'paint set',
  'jee book', 'neet book', 'exam books',
];

/** Enough on its own (together with a product term) to show purchase/selection intent. */
const STRONG_INTENT = /\b(buy|buying|purchase|purchasing|recommend|recommendations?|suggest|suggestions?|choose|pick|worth it|worth buying|under\s*(?:rs\.?|₹|\$)?\s*\d+)\b/i;
/** Softer wording — only counts when the message is not an explanation / how-to / shortcut question. */
const SOFT_INTENT = /\b(best|budget|cheap|cheapest|affordable|good|top|deal|discount|compare|upgrade|looking for|need a|want a|get a)\b/i;
const EDUCATIONAL_FRAMING = /\b(shortcuts?|hotkeys?|explain|how (?:does|do|did|to|can i|do i)|way to|why|difference between|meaning of|define|summari[sz]e|chapter)\b/i;

export function isRecommendationQuery(userText: string): boolean {
  const text = userText.toLowerCase();
  if (!text.trim()) return false;
  if (PURCHASE_PHRASES.some((p) => text.includes(p))) return true;
  if (!PRODUCT_TERMS.some((t) => text.includes(t))) return false;
  if (STRONG_INTENT.test(text)) return true;
  return SOFT_INTENT.test(text) && !EDUCATIONAL_FRAMING.test(text);
}

/** Text of the nearest user message before `index` — the question an assistant reply at `index` answers.
 *  Skips interleaved system notices (e.g. "Switched to X") instead of reading them as the question. */
export function precedingUserText(messages: ReadonlyArray<{ role: string; content: string }>, index: number): string {
  for (let i = index - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  return '';
}

export const AFFILIATE_DESTINATION_URL = 'https://artisticaura001.vercel.app/amazon-products';
