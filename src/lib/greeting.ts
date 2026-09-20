/** Time-based greeting shared across the app (AI assistant empty state, Dashboard header).
 *  Bands: 5–11 morning, 11–17 afternoon, 17–22 evening, 22–5 late night.
 *  Kept deterministic and side-effect free so it's trivially testable. */
export interface Greeting {
  text: string;
  emoji: string;
}

export function getGreeting(name: string | undefined | null, hour: number = new Date().getHours()): Greeting {
  const who = name?.trim() ? name.trim() : '';
  const suffix = who ? `, ${who}` : '';

  if (hour >= 5 && hour < 12) {
    return { text: `Good morning${suffix}`, emoji: '☀️' };
  }
  if (hour >= 12 && hour < 17) {
    return { text: `Good afternoon${suffix}`, emoji: '🌤️' };
  }
  if (hour >= 17 && hour < 22) {
    return { text: `Good evening${suffix}`, emoji: '👋' };
  }
  return { text: who ? `Night owl, ${who}?` : 'Night owl?', emoji: '🌙' };
}

export function getGreetingSubtext(hour: number = new Date().getHours()): string {
  if (hour >= 5 && hour < 12) return 'Ready to study?';
  if (hour >= 12 && hour < 17) return 'What are we working on?';
  if (hour >= 17 && hour < 22) return 'How can I help today?';
  return "Let's finish today's work.";
}
