export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string; // object URL for images only \u2014 cheap instant local preview, never sent to a provider
  /** Base64 data URL (e.g. "data:image/png;base64,...") for image attachments \u2014 this is the
   *  actual representation sent to a vision-capable provider. Undefined until the FileReader
   *  read completes (status stays 'reading' until then) and undefined for non-image attachments. */
  dataUrl?: string;
  /** Extracted plain text for PDF/DOCX/TXT/MD attachments, sent to the AI provider
   *  alongside the user's message. Undefined for images (no text to extract) or while
   *  extraction is still in progress. Truncated to MAX_ATTACHMENT_TEXT_CHARS. */
  text?: string;
  /** Why `text` is empty, when status is 'error'. 'empty' = the file has no extractable
   *  text layer (most often a scanned/photographed PDF); 'failed' = parsing itself threw
   *  (corrupt or unsupported file). Lets the UI give a useful hint instead of one generic
   *  message for every failure case. */
  extractionReason?: 'empty' | 'failed';
  /** 'reading' while extraction is in progress, 'ready' once text is available (or the
   *  file is an image with nothing to extract), 'error' if extraction failed. */
  status: 'reading' | 'ready' | 'error';
  /** Base64 data URLs for a scanned/image-only PDF's pages, rasterized client-side as a
   *  fallback when `extractAttachmentText` found no text layer (see
   *  attachmentTextExtraction.ts's `renderScannedPdfPages`). Undefined for every attachment
   *  except a PDF that took this path. Only the first `MAX_SCANNED_PDF_PAGES` pages are
   *  rendered, and rendering stops early if the accumulated size would be unreasonable — see
   *  `renderScannedPdfPages` for the exact bounds. When present and non-empty, this attachment
   *  is treated as image-bearing for routing/sending purposes (see `attachmentsWithImages`,
   *  `collectImageDataUrls`) even though `type` stays 'application/pdf', so the existing
   *  vision-routing and no-vision-provider honest-messaging logic in AiAssistantPage applies
   *  to it automatically — no separate code path needed there. */
  pageImages?: string[];
  /** True once `pageImages` covers fewer than the PDF's total pages, because the page or size
   *  cap in `renderScannedPdfPages` was hit first. Lets the UI tell the user only part of a
   *  long scanned PDF was actually sent, instead of silently analyzing a partial document. */
  pageImagesTruncated?: boolean;
  /** PHASE 2.1 — a tiny, permanently-kept boolean (unlike `pageImages` itself) recording that
   *  this attachment DID successfully rasterize at least one scanned page at upload time, even
   *  after `pageImages` is stripped on persistence (see useConversations'
   *  stripUnpersistableAttachmentData). Without this, a reloaded conversation can't tell "this
   *  PDF never needed rasterization" apart from "it did, and the pages are gone now" — both
   *  look identical (`pageImages: undefined`) once the bulk data is stripped. Lets Continue give
   *  the same honest "no longer available" notice for an expired scanned PDF that it already
   *  gives for an expired image (see AiAssistantPage.continueMessage). Never itself holds image
   *  bytes, so it's safe to persist unconditionally.  */
  hadRasterizedPages?: boolean;
}

export const MAX_ATTACHMENT_TEXT_CHARS = 20000;

// 25MB. Text extraction for PDF/DOCX runs in-browser with no server, but this is safe
// at 25MB specifically because of two mitigations already in place: every page is
// processed behind an `await` (yielding to the event loop between pages, so the tab
// stays responsive rather than blocking), and extraction stops early once the text
// output exceeds MAX_ATTACHMENT_TEXT_CHARS * 1.2 regardless of how many pages remain —
// so worst-case processing time is bounded by content/complexity, not raw file size.
// (An earlier, more conservative 15MB limit was set before double-checking this; see
// Engineering Decisions for the reasoning trail.)
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

// Images are NOT covered by MAX_ATTACHMENT_SIZE's reasoning above — a PDF/DOCX only ever
// sends its (bounded, truncated-to-20,000-char) EXTRACTED TEXT to a provider, so the original
// file size barely matters. An image sends its full bytes, base64-encoded (~33% larger than
// the raw file), as part of the actual provider request body. That request has to survive:
//   1. A vendor per-image limit — the most restrictive one actually verified this session is
//      xAI's documented 20MiB per image (docs.x.ai/docs/guides/chat-completions).
//   2. This app's own server-side proxy body-size guard (see api/_shared.ts's
//      MAX_AI_BODY_BYTES_VISION) — which has to stay bounded too, since that proxy buffers the
//      full request and forwards it to a real, billed provider account.
// 12MB raw (~16MB base64) leaves comfortable headroom under both of those for a single image
// (the overwhelmingly common case — "explain this photo"), while still covering the large
// majority of real phone-camera JPEGs. See MAX_TOTAL_IMAGE_PAYLOAD_BYTES for the additional
// guard against several images together still blowing the server-side budget.
export const MAX_IMAGE_FILE_SIZE = 12 * 1024 * 1024;

// Combined budget for ALL images in a single outgoing message, measured in base64-encoded
// bytes (i.e. after the ~33% data-URL expansion, not raw file size) — checked client-side
// right before sending (see AiAssistantPage's send()) so an over-budget multi-image message is
// rejected with an honest, actionable error instead of silently failing as a generic HTTP 413
// from the server proxy partway through a request the user already waited on. Kept comfortably
// under api/_shared.ts's MAX_AI_BODY_BYTES_VISION (24MB) to leave room for the JSON envelope,
// conversation history text, and system prompt that travel in the same request body.
export const MAX_TOTAL_IMAGE_PAYLOAD_BYTES = 18 * 1024 * 1024;

// Scanned/image-only PDFs are rasterized page-by-page as a Phase 1.6 fallback (see
// attachmentTextExtraction.ts's renderScannedPdfPages) so they can reach a vision-capable
// provider instead of being treated as empty. Bounded to a small, fixed page count — NOT
// scaled to the document's actual length — because each rendered page becomes a full image in
// the same request body governed by MAX_TOTAL_IMAGE_PAYLOAD_BYTES above; a 200-page scanned
// textbook must never be blindly turned into 200 base64 images. 4 pages covers the common
// real case (a scanned worksheet, a short scanned handout, the first few pages of a longer
// scan) while keeping worst-case payload size and render time predictable.
export const MAX_SCANNED_PDF_PAGES = 4;

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp,.pdf,.txt,.md,.docx';

export function validateFile(file: File): string | null {
  const isImage = file.type.startsWith('image/');
  // Derived from the relevant constant rather than a hardcoded string, so the message can't
  // drift out of sync the way it previously did (MAX_ATTACHMENT_SIZE was once raised from 15MB
  // to 25MB without updating this message, which kept saying "10MB" — see Engineering
  // Decisions). Images and documents are checked against different limits — see
  // MAX_IMAGE_FILE_SIZE's comment for why a shared 25MB limit was actually a live bug for
  // images once they started being sent as full base64 payloads rather than extracted text.
  const limit = isImage ? MAX_IMAGE_FILE_SIZE : MAX_ATTACHMENT_SIZE;
  if (file.size > limit) return `${file.name} is over the ${Math.round(limit / (1024 * 1024))}MB limit${isImage ? ' for images' : ''}.`;
  const okType = ACCEPTED_TYPES.includes(file.type) || /\.(md|txt)$/i.test(file.name);
  if (!okType) return `${file.name} is not a supported file type.`;
  return null;
}

/** The subset of an attachment list that actually contributes real, sent-to-the-provider
 *  content — i.e. text extraction genuinely succeeded. Images, attachments still being
 *  read, and attachments whose extraction failed/found nothing all contribute nothing to
 *  what the AI receives, so they must NOT count as "this request has document context."
 *  Single source of truth for that filter — used by both promptBuilder.ts (building the
 *  actual provider payload) and the routing/classification call site in
 *  AiAssistantPage.tsx, so the two can never disagree about what counts as a document
 *  attachment the way they previously did (see Engineering Decisions, Phase 4). */
export function attachmentsWithText(attachments: Attachment[] | undefined): Attachment[] {
  return (attachments ?? []).filter((a) => a.status === 'ready' && a.text);
}

export function hasAttachmentText(attachments: Attachment[] | undefined): boolean {
  return attachmentsWithText(attachments).length > 0;
}

/** The subset of an attachment list that carries real, sendable image data \u2014 either a real
 *  image file whose FileReader base64 read genuinely finished, OR a scanned/image-only PDF
 *  whose pages were successfully rasterized (see `pageImages`, set by
 *  attachmentTextExtraction.ts's renderScannedPdfPages). An image still being read (dataUrl
 *  undefined, status 'reading'), one whose read failed, or a scanned PDF that couldn't be
 *  rasterized either contributes nothing here, mirroring how attachmentsWithText works for
 *  documents. Single source of truth used by collectImageDataUrls (building the payload) and
 *  the routing/vision-requirement check in AiAssistantPage.tsx, so the two can never disagree
 *  about whether this request actually carries usable image data. */
export function attachmentsWithImages(attachments: Attachment[] | undefined): Attachment[] {
  return (attachments ?? []).filter(
    (a) => a.status === 'ready' && ((a.type.startsWith('image/') && a.dataUrl) || (a.pageImages && a.pageImages.length > 0))
  );
}

export function hasImageAttachment(attachments: Attachment[] | undefined): boolean {
  return attachmentsWithImages(attachments).length > 0;
}

/** Flattens an attachment list into the actual ordered array of base64 image data URLs a
 *  provider's `images` field expects \u2014 a real image attachment contributes its single
 *  `dataUrl`, a rasterized scanned PDF contributes every page in `pageImages` (in page order).
 *  This is the one place that knows both image representations exist, so promptBuilder.ts
 *  never has to. */
export function collectImageDataUrls(attachments: Attachment[] | undefined): string[] {
  const urls: string[] = [];
  for (const a of attachmentsWithImages(attachments)) {
    if (a.dataUrl) urls.push(a.dataUrl);
    if (a.pageImages) urls.push(...a.pageImages);
  }
  return urls;
}

/** Parses the MIME type out of a "data:image/png;base64,..." data URL. Returns null for
 *  anything that doesn't match the expected shape rather than guessing \u2014 callers treat a
 *  null as "unknown format, be conservative" (see providerRegistry's MIME-aware routing). */
function mimeTypeOfDataUrl(dataUrl: string): string | null {
  const match = /^data:([^;]+);base64,/.exec(dataUrl);
  return match ? match[1].toLowerCase() : null;
}

/** The distinct set of actual image MIME types this attachment list would send to a provider
 *  \u2014 a real image attachment contributes its own `type` (verified against its data URL,
 *  not just trusted from the browser-reported File.type, since the two could in principle
 *  disagree), a rasterized scanned PDF's pages always contribute 'image/jpeg' (see
 *  renderScannedPdfPages \u2014 canvas.toDataURL('image/jpeg', ...), not configurable per-call).
 *  Phase 1.7: this is what makes MIME-aware routing possible \u2014 "this provider supports
 *  vision" is not the same claim as "this provider supports the exact format I'm about to
 *  send it" (e.g. xAI documents jpg/jpeg + png only, not WebP, even though this app's own
 *  upload picker accepts WebP). See providerRegistry.getRoutedFallbackChain /
 *  hasVisionCapableProvider, both of which take this as an additional filter alongside the
 *  existing plain vision:boolean check. */
export function collectImageMimeTypes(attachments: Attachment[] | undefined): string[] {
  const types = new Set<string>();
  for (const a of attachmentsWithImages(attachments)) {
    if (a.dataUrl) types.add(mimeTypeOfDataUrl(a.dataUrl) ?? a.type.toLowerCase());
    if (a.pageImages?.length) types.add('image/jpeg');
  }
  return [...types];
}

/** Sum of the base64-encoded length (in bytes, i.e. after data-URL expansion, not raw file
 *  size) of every image that would actually be sent for this attachment list \u2014 checked
 *  against MAX_TOTAL_IMAGE_PAYLOAD_BYTES right before sending so an over-budget multi-image
 *  message is rejected with an honest client-side error instead of a generic server 413. Uses
 *  the data URL's own string length as a fast, close-enough proxy for its encoded byte size
 *  (data URLs are ASCII/base64, so string length and byte length match). */
export function totalImagePayloadBytes(attachments: Attachment[] | undefined): number {
  return collectImageDataUrls(attachments).reduce((sum, url) => sum + url.length, 0);
}

/** PHASE 8 — single source of truth for the "this attachment's image data has expired since
 *  it was originally sent" check. An attachment's METADATA (its listing in `attachments`,
 *  `type`, `hadRasterizedPages`) survives a page reload; the actual bytes (`dataUrl`,
 *  `pageImages`) never do (see useConversations.ts's stripUnpersistableAttachmentData) — so a
 *  request built from a reloaded conversation can look, at a glance, like it still carries an
 *  image when it no longer does. Previously this exact check was inlined only inside
 *  `continueMessage` in AiAssistantPage.tsx, so Retry and Edit+Regenerate silently rebuilt a
 *  text-only request in this situation with no notice at all — a real instance of the "silently
 *  sending a text-only request instead of communicating that clearly" failure this app's own
 *  design principles (see the doc comments throughout this file) explicitly reject. Returns null
 *  when nothing has expired (including the normal case where the message never had images), or
 *  a ready-to-show message describing what's gone. */
export function expiredAttachmentNotice(originalAttachments: Attachment[] | undefined): string | null {
  const originallyHadImages = (originalAttachments ?? []).some((a) => a.type.startsWith('image/'));
  const originallyHadScannedPages = (originalAttachments ?? []).some((a) => a.hadRasterizedPages);
  if (!originallyHadImages && !originallyHadScannedPages) return null;
  if (hasImageAttachment(originalAttachments)) return null; // still present — nothing expired
  const what = originallyHadImages && originallyHadScannedPages ? 'image/scanned document' : originallyHadImages ? 'image' : 'scanned document';
  return `The ${what} from this question is no longer available in this session — continuing with text only.`;
}
