type ClassValue = string | number | boolean | null | undefined | Record<string, boolean>;

export function clsx(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
    } else if (typeof v === 'object') {
      for (const key in v) {
        if (v[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}
