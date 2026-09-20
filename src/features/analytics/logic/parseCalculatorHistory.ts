export interface HistoryPoint {
  label: string;
  value: number;
  timestamp: string;
}

/** Extracts the first number (optionally with a decimal point) following a given prefix in free-text history summaries. */
function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return isNaN(value) ? null : value;
}

export function parseCgpaHistory(entries: { summary: string; timestamp: string }[]): HistoryPoint[] {
  return entries
    .map((e) => {
      const value = extractNumber(e.summary, /CGPA:\s*([\d.]+)/i);
      return value === null ? null : { label: new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value, timestamp: e.timestamp };
    })
    .filter((p): p is HistoryPoint => p !== null)
    .reverse();
}

export function parseAttendanceHistory(entries: { summary: string; timestamp: string }[]): HistoryPoint[] {
  return entries
    .map((e) => {
      const value = extractNumber(e.summary, /Attendance:\s*([\d.]+)%/i);
      return value === null ? null : { label: new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value, timestamp: e.timestamp };
    })
    .filter((p): p is HistoryPoint => p !== null)
    .reverse();
}
