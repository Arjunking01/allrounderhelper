import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

/**
 * Shared text-to-PDF renderer. Used by useResultPdfExport (tool result summaries)
 * and the AI Assistant's "Export as PDF" option.
 *
 * Single source of truth for pagination: earlier versions of this logic (see git
 * history on useResultPdfExport.ts) silently stopped drawing once a single page
 * filled up, which truncated longer content instead of overflowing to a new page.
 * This version adds a page whenever content runs out of room, on every call site.
 */

export interface PdfSection {
  /** Optional bold heading rendered above this section's body (e.g. "You" / "Assistant"). */
  heading?: string;
  body: string;
}

export interface PdfTextDocumentOptions {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  /** Defaults to today's date, formatted with toLocaleDateString(). */
  footerDate?: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = rgb(0.04, 0.05, 0.1);
const MUTED = rgb(0.49, 0.51, 0.68);
const FOOTER = rgb(0.72, 0.74, 0.85);
const RULE = rgb(0.92, 0.93, 0.98);

function wrapText(text: string, maxWidth: number, size: number, font: PDFFont): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildPdfTextDocument({ title, subtitle, sections, footerDate }: PdfTextDocumentOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function ensureSpace(lineHeight: number) {
    if (y < MARGIN + lineHeight) newPage();
  }

  page.drawText(title, { x: MARGIN, y, size: 20, font: boldFont, color: INK });
  y -= 28;
  if (subtitle) {
    page.drawText(subtitle, { x: MARGIN, y, size: 10, font, color: MUTED });
    y -= 22;
  }
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: RULE });
  y -= 24;

  for (const section of sections) {
    if (section.heading) {
      ensureSpace(20);
      page.drawText(section.heading, { x: MARGIN, y, size: 13, font: boldFont, color: INK });
      y -= 20;
    }
    for (const rawLine of section.body.split('\n')) {
      if (!rawLine.trim()) {
        y -= 12;
        if (y < MARGIN) newPage();
        continue;
      }
      for (const line of wrapText(rawLine, MAX_WIDTH, 12, font)) {
        ensureSpace(18);
        page.drawText(line, { x: MARGIN, y, size: 12, font, color: INK });
        y -= 18;
      }
    }
    y -= 10;
  }

  const dateLabel = footerDate ?? new Date().toLocaleDateString();
  for (const p of doc.getPages()) {
    p.drawText(dateLabel, { x: MARGIN, y: MARGIN - 20, size: 9, font, color: FOOTER });
  }

  return doc.save();
}
