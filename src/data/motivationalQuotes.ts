export interface Quote {
  text: string;
  author: string;
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: 'Robert Collier' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'Well begun is half done.', author: 'Aristotle' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'James Clear' },
  { text: 'You don\'t have to see the whole staircase, just take the first step.', author: 'Martin Luther King Jr.' },
  { text: 'A little progress each day adds up to big results.', author: 'Satya Nani' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'Study while others are sleeping; work while others are loafing.', author: 'William A. Ward' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Great things are done by a series of small things brought together.', author: 'Vincent van Gogh' },
];

/** Deterministic per-day quote — same quote all day, changes daily, no randomness needed. */
export function quoteOfTheDay(date: Date = new Date()): Quote {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
