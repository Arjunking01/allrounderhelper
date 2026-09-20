import { MAX_ATTACHMENT_TEXT_CHARS, MAX_SCANNED_PDF_PAGES, MAX_TOTAL_IMAGE_PAYLOAD_BYTES } from './attachmentTypes';

/** A cheap, optional cooperative-cancellation check threaded through the page/loop-based work
 *  below (PHASE 1.7). Returns true once the caller no longer cares about the result — e.g. the
 *  user removed the attachment mid-extraction (see AttachmentBar.tsx's removedIdsRef). This
 *  does not need to be a real AbortController: the existing functional-update pattern in
 *  AttachmentBar (`onChange((current) => current.map(...))`) already guarantees a finished
 *  extraction for a removed attachment can never resurrect it — that part was already safe.
 *  What this actually buys is not wasting CPU/memory rendering/parsing pages nobody will ever
 *  see, for a large scanned PDF the user attaches and immediately removes. Checked between
 *  pages, not mid-page, so it stays a small addition rather than a real cancellation system. */
export type ShouldAbort = () => boolean;

interface TextItemLike {
  str?: string;
}

function truncate(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_ATTACHMENT_TEXT_CHARS) return trimmed;
  return trimmed.slice(0, MAX_ATTACHMENT_TEXT_CHARS) + `\n\n[Truncated \u2014 file is longer than the ${MAX_ATTACHMENT_TEXT_CHARS.toLocaleString()} character limit sent to the AI.]`;
}

async function extractPdfText(file: File, shouldAbort?: ShouldAbort): Promise<string> {
  // Dynamically imported so opening the AI Assistant page never pulls in pdfjs (a
  // sizeable chunk) unless a user actually attaches a PDF — same reasoning as the
  // existing document tools' own lazy pdfjs usage.
  const { getPdfjs } = await import('@/features/document/logic/pdfjsSetup');
  const bytes = await file.arrayBuffer();
  const pdfjs = getPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;
  try {
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      if (shouldAbort?.()) break;
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => (item as TextItemLike).str ?? '').join(' ') + '\n\n';
      // Stop early once we've comfortably exceeded the character cap — no point
      // rendering every page of a 300-page textbook just to truncate it anyway.
      if (fullText.length > MAX_ATTACHMENT_TEXT_CHARS * 1.2) break;
    }
    return fullText;
  } finally {
    loadingTask.destroy();
  }
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
}

export interface ScannedPdfRenderResult {
  images: string[];
  /** True when the PDF had more pages than were actually rendered, because
   *  MAX_SCANNED_PDF_PAGES or the size budget was hit first \u2014 lets the UI tell the user only
   *  part of the document was sent, rather than silently analyzing a partial scan. */
  truncated: boolean;
}

/** Fallback for a PDF that `extractPdfText` found no text layer in (the common shape of a
 *  scanned or photographed PDF, per extractAttachmentText's 'empty' reason) \u2014 rasterizes the
 *  first few pages to JPEG data URLs client-side (same pdfjs render-to-canvas approach already
 *  used by the OCR Text Extraction tool) so a vision-capable provider can actually look at the
 *  page images instead of the document being treated as empty. This is a deliberately bounded
 *  best-effort fallback, not a general PDF-to-image converter:
 *  - Stops after MAX_SCANNED_PDF_PAGES pages regardless of the document's real length, so a
 *    long scanned book is never blindly turned into dozens of full-size images.
 *  - Also stops early if the accumulated base64 size would already leave no headroom under
 *    MAX_TOTAL_IMAGE_PAYLOAD_BYTES (leaving margin for the user's own text and any other
 *    attachment already selected) \u2014 few, higher-value pages beat many oversized ones.
 *  - Renders at a moderate scale (1.5x) and JPEG quality (0.82): enough for a vision model to
 *    read printed or clearly handwritten text without the file size exploding, matching this
 *    app's existing preference (see MAX_IMAGE_FILE_SIZE's reasoning) for one comfortably-sized
 *    request over a maximal-fidelity one.
 *  Returns {images: [], truncated: false} on any failure (corrupt file, pdfjs render error,
 *  canvas unavailable) \u2014 the caller keeps the original honest 'empty' extraction result in
 *  that case rather than claiming a fallback that didn't actually work. */
export async function renderScannedPdfPages(file: File, shouldAbort?: ShouldAbort): Promise<ScannedPdfRenderResult> {
  try {
    const { getPdfjs } = await import('@/features/document/logic/pdfjsSetup');
    const bytes = await file.arrayBuffer();
    const pdfjs = getPdfjs();
    const loadingTask = pdfjs.getDocument({ data: bytes });
    const doc = await loadingTask.promise;
    const images: string[] = [];
    let totalBytes = 0;
    let truncated = false;
    try {
      const pageCount = Math.min(doc.numPages, MAX_SCANNED_PDF_PAGES);
      if (doc.numPages > pageCount) truncated = true;
      for (let i = 1; i <= pageCount; i++) {
        if (shouldAbort?.()) break; // attachment was removed while this was still rendering
        // Leave real headroom (half the budget) for whatever else travels in the same
        // request \u2014 the user's own text, conversation history, other attachments \u2014 rather
        // than spending the entire image budget on this one PDF's pages.
        if (totalBytes > MAX_TOTAL_IMAGE_PAYLOAD_BYTES / 2) { truncated = true; break; }
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) break;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        images.push(dataUrl);
        totalBytes += dataUrl.length;
        // Not attached to the DOM, so the canvas is already eligible for GC the moment this
        // loop iteration ends and `canvas` goes out of scope \u2014 explicitly zeroing its
        // dimensions here just gives the browser back the backing bitmap memory a little
        // sooner on a long page loop, which matters more for a scanned PDF than most canvas
        // uses since each page's bitmap can be several megabytes before JPEG compression.
        canvas.width = 0;
        canvas.height = 0;
      }
    } finally {
      loadingTask.destroy();
    }
    return { images, truncated };
  } catch {
    return { images: [], truncated: false };
  }
}

export interface ExtractionResult {
  text?: string;
  /** Why extraction produced no text, when it didn't — distinguished so the UI can give a
   *  useful hint instead of one generic "couldn't read this file" message for every case.
   *  'empty': parsing succeeded but the file genuinely has no extractable text (the common
   *  case for a scanned/photographed PDF — no text layer to read). 'failed': parsing itself
   *  threw (corrupt/password-protected/unsupported-internal-format file). Undefined when
   *  extraction succeeded. */
  reason?: 'empty' | 'failed';
}

/** Extracts plain text from a supported attachment for sending to the AI provider.
 *  Returns no text for images (nothing to extract as text — images are sent to
 *  vision-capable providers separately as base64 image data, see attachmentTypes.ts'
 *  attachmentsWithImages / AttachmentBar's readImageAsDataUrl), for a file with no
 *  extractable text layer (most often a scanned/photographed PDF), or if extraction
 *  fails outright. */
export async function extractAttachmentText(file: File, shouldAbort?: ShouldAbort): Promise<ExtractionResult> {
  try {
    if (file.type === 'application/pdf') {
      const text = await extractPdfText(file, shouldAbort);
      return text.trim() ? { text: truncate(text) } : { reason: 'empty' };
    }
    if (file.type.includes('word') || /\.docx$/i.test(file.name)) {
      const text = await extractDocxText(file);
      return text.trim() ? { text: truncate(text) } : { reason: 'empty' };
    }
    if (file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name)) {
      const text = await file.text();
      return text.trim() ? { text: truncate(text) } : { reason: 'empty' };
    }
    return {}; // images and anything else: no text to extract, and no error either
  } catch {
    return { reason: 'failed' };
  }
}
