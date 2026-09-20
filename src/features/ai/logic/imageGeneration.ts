// Image generation is a genuinely different capability from text chat — different
// request shape, different response type (binary image vs. text), different failure
// modes — so this is deliberately NOT an AIProvider. Shoehorning it into
// sendMessage()/ProviderMessage would mean either fabricating a text-shaped response for
// a binary result, or bending the shared interface to accommodate one capability every
// other provider doesn't have.

export const IMAGE_GENERATION_ENABLED = (import.meta.env.VITE_POLLINATIONS_ENABLED as string | undefined) === '1';

export interface ImageGenerationResult {
  ok: true;
  /** Object URL for the generated image — caller is responsible for revoking it (e.g. on
   *  message deletion) since it holds a reference to an in-memory Blob until then. */
  objectUrl: string;
}

export interface ImageGenerationError {
  ok: false;
  message: string;
}

/** Requests an image from the Pollinations proxy. Never returns a fabricated success —
 *  if the request fails for any reason, callers get an explicit error to display, not a
 *  silently-substituted placeholder image. */
export async function generateImage(prompt: string, signal?: AbortSignal): Promise<ImageGenerationResult | ImageGenerationError> {
  if (!IMAGE_GENERATION_ENABLED) {
    return { ok: false, message: 'Image generation is not available right now.' };
  }
  const trimmed = prompt.trim();
  if (!trimmed) return { ok: false, message: 'Describe the image you want first.' };

  let response: Response;
  try {
    response = await fetch('/api/ai/pollinations-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: trimmed }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return { ok: false, message: 'Image generation was cancelled.' };
    return { ok: false, message: 'Could not reach the image generator — check your connection.' };
  }

  if (!response.ok) {
    let message = `Image generation failed (HTTP ${response.status}).`;
    try {
      const errJson = await response.json();
      message = errJson?.error?.message ?? message;
    } catch {
      // ignore parse failure, use default message
    }
    // 503 = server not set up for this feature; 401/403 = server key rejected. Raw text names internal
    // env vars / key state, so students get plain wording instead.
    if ([401, 403, 503].includes(response.status)) message = 'Image generation is not available right now.';
    return { ok: false, message };
  }

  let blob: Blob;
  try {
    blob = await response.blob();
  } catch {
    return { ok: false, message: 'The connection dropped while receiving the generated image.' };
  }
  if (blob.size === 0) return { ok: false, message: 'The image generator returned an empty result.' };
  return { ok: true, objectUrl: URL.createObjectURL(blob) };
}

/** Very deliberately narrow: only fires on requests that are unambiguously asking to
 *  *create* an image, not ones that merely mention images/pictures in passing (e.g. "how
 *  do I compress an image" should never trigger this). Errs toward under-triggering —
 *  a missed image request just gets a normal text answer, which is a much smaller
 *  problem than firing image generation for an unrelated question. */
export function isImageGenerationRequest(text: string): boolean {
  const t = text.toLowerCase();
  const verbs = ['generate', 'create', 'draw', 'make', 'design', 'render'];
  const nouns = ['image', 'picture', 'illustration', 'artwork', 'drawing', 'logo', 'photo', 'wallpaper', 'icon'];
  return verbs.some((v) => t.includes(v)) && nouns.some((n) => t.includes(n));
}
