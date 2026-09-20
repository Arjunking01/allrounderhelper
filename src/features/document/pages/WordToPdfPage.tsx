import { useState } from 'react';
import { FileType2 } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { DownloadCard } from '@/components/document/DownloadCard';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob, stripExtension } from '../logic/fileUtils';

const tool = getDocumentToolBySlug('word-to-pdf')!;

interface Block {
  kind: 'h1' | 'h2' | 'h3' | 'p' | 'li';
  text: string;
}

function htmlToBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: Block[] = [];
  doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach((el) => {
    const text = el.textContent?.trim() ?? '';
    if (!text) return;
    const tag = el.tagName.toLowerCase();
    if (tag === 'h1') blocks.push({ kind: 'h1', text });
    else if (tag === 'h2') blocks.push({ kind: 'h2', text });
    else if (tag.startsWith('h')) blocks.push({ kind: 'h3', text });
    else if (tag === 'li') blocks.push({ kind: 'li', text });
    else blocks.push({ kind: 'p', text });
  });
  return blocks;
}

function wrapText(text: string, maxWidth: number, size: number, font: { widthOfTextAtSize: (t: string, s: number) => number }): string[] {
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

async function blocksToPdfBytes(blocks: Block[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  const pageWidth = 612;
  const pageHeight = 792;
  const maxWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPage() {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  for (const block of blocks) {
    const isHeading = block.kind === 'h1' || block.kind === 'h2' || block.kind === 'h3';
    const size = block.kind === 'h1' ? 20 : block.kind === 'h2' ? 16 : block.kind === 'h3' ? 14 : 11;
    const usedFont = isHeading ? boldFont : font;
    const lineHeight = size * 1.4;
    const prefix = block.kind === 'li' ? '•  ' : '';
    const lines = wrapText(prefix + block.text, maxWidth, size, usedFont);

    for (const line of lines) {
      if (y < margin + lineHeight) newPage();
      page.drawText(line, { x: margin, y, size, font: usedFont, color: rgb(0.04, 0.05, 0.1) });
      y -= lineHeight;
    }
    y -= isHeading ? 6 : 4;
  }

  return doc.save();
}

export default function WordToPdfPage() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const { addEntry } = useToolHistory();

  async function processFile(files: File[]) {
    const file = files[0];
    if (!file || !file.name.toLowerCase().endsWith('.docx')) {
      setErrorMsg('Please upload a .docx file.');
      setStatus('error');
      return;
    }
    setStatus('processing');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      const blocks = htmlToBlocks(html);
      if (blocks.length === 0) {
        setErrorMsg('No readable text was found in this document.');
        setStatus('error');
        return;
      }
      const bytes = await blocksToPdfBytes(blocks);
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const name = `${stripExtension(file.name)}.pdf`;
      setResult({ blob, name });
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: name, sizeLabel: formatBytes(blob.size) });
      setStatus('success');
    } catch {
      setErrorMsg('Could not convert this document. Make sure it is a valid, unprotected .docx file.');
      setStatus('error');
    }
  }

  function reset() {
    setResult(null);
    setStatus('idle');
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/word-to-pdf" icon={FileType2} breadcrumb={{ label: 'Word to PDF' }} toolSlug={tool.slug}
      article={article}
    >
      <Card>
        {result ? (
          <DownloadCard fileName={result.name} sizeLabel={formatBytes(result.blob.size)} onDownload={() => downloadBlob(result.blob, result.name)} onReset={reset} />
        ) : (
          <>
            <SoftCard className="mb-5">
              <p className="text-sm text-navy-600 dark:text-ink-300">
                Text, headings, and lists are carried over faithfully. Complex layouts — tables, columns, embedded images, and exact fonts — are simplified into clean, readable text rather than pixel-matched to Word.
              </p>
            </SoftCard>
            <FileDropzone accept=".docx" label="Drop a .docx file here" hint="Word documents only" onFiles={processFile} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : 'Converting...'} />
            </div>
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}

const article = {
  intro: 'This converter reads a .docx Word document and rebuilds its text, headings, and lists as a clean, readable PDF — all processed locally in your browser.',
  whyItMatters: 'PDF is the standard format for sharing a document that should look the same everywhere and resist accidental edits. Converting a Word file to PDF before submitting or sharing avoids formatting surprises on someone else\'s computer.',
  howItWorks: [
    'Upload a .docx file.',
    'The document\'s text, headings, and list structure are extracted.',
    'Each element is laid out on standard PDF pages with automatic pagination.',
    'The finished PDF downloads directly — no file ever leaves your browser.',
  ],
  examples: [
    { title: 'A short essay', body: 'Headings become bold, larger text; paragraphs wrap naturally across as many pages as needed.' },
    { title: 'A bulleted outline', body: 'List items are prefixed with a bullet and kept in their original order.' },
  ],
  mistakes: [
    'Expecting pixel-identical output for documents with complex tables, columns, or embedded images — those are simplified rather than replicated exactly.',
    'Uploading a password-protected .docx file, which can\'t be read without removing the password first.',
    'Uploading a .doc (older Word format) file instead of .docx — only .docx is supported.',
  ],
  tips: [
    'For simple, text-focused documents (essays, reports, letters), this conversion is very close to the original.',
    'For heavily designed documents, consider exporting to PDF directly from Word for exact visual fidelity.',
    'Double-check the final PDF before submitting anything formal.',
  ],
  faqs: [
    { question: 'Are my file\'s contents uploaded anywhere?', answer: 'No — the .docx is parsed and converted entirely in your browser using local processing.' },
    { question: 'Does this preserve images and tables from my document?', answer: 'Text, headings, and lists are preserved. Tables, columns, and embedded images are not currently carried over — this is a text-focused converter.' },
    { question: 'Can I convert an older .doc file?', answer: 'Only the modern .docx format is supported. Save the file as .docx from Word first if needed.' },
  ],
  related: [
    { label: 'Image to PDF', href: '/document-tools/image-to-pdf' },
    { label: 'PDF to Text', href: '/document-tools/pdf-to-text' },
    { label: 'Merge PDF', href: '/document-tools/merge-pdf' },
  ],
};
