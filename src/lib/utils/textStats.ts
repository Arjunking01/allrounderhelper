export interface TextStats {
  words: number;
  characters: number;
  readingTimeMinutes: number;
}

const WORDS_PER_MINUTE = 200;

export function getTextStats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const characters = text.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return { words, characters, readingTimeMinutes };
}
