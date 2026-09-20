/**
 * Copies text to the clipboard, returning whether it actually succeeded.
 *
 * navigator.clipboard.writeText() requires a secure context and can reject (permission
 * denied, insecure origin, unsupported browser) or simply not exist as a property at all —
 * callers that fire-and-forget this without checking the result end up showing a "Copied!"
 * toast even when nothing was copied. This wraps it safely and falls back to the legacy
 * execCommand approach for browsers/contexts where the async Clipboard API isn't available.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
