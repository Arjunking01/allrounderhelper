import { useState } from 'react';
import { ImageDown } from 'lucide-react';
import JSZip from 'jszip';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory } from '@/hooks/useToolHistory';
import { downloadBlob, stripExtension } from '../logic/fileUtils';
import { getPdfjs } from '../logic/pdfjsSetup';

const tool = getDocumentToolBySlug('pdf-to-image')!;

const article = {
  intro: 'PDF to Image renders each page of a PDF as a high-quality PNG image, downloaded individually or together as a ZIP.',
  whyItMatters: 'Some platforms need an image, not a PDF \u2014 for posting a page to a slide, embedding it in a document, or sharing a single page without the recipient needing a PDF viewer.',
  howItWorks: [
    'Select a PDF file.',
    'Each page is rendered as a separate PNG image.',
    'Download images individually or as a ZIP of all pages.',
  ],
  examples: [
    { title: 'Sharing a single page', body: 'Convert just the relevant page of a PDF into a PNG to paste directly into a chat or presentation.' },
    { title: 'Converting a whole document for a slide deck', body: 'A 10-page PDF handout can be converted into 10 separate PNGs and downloaded as one ZIP, ready to drop each page into its own slide without needing a PDF embed.' },
  ],
  mistakes: [
    'Expecting an editable image \u2014 the output is a rendered picture of the page, not editable text or vector content.',
    'Expecting a searchable PDF-like file back \u2014 once converted to PNG, there\'s no text layer at all; use PDF to Text or OCR if you need the words themselves.',
  ],
  tips: [
    'Use this when you need a quick visual of a page rather than the searchable text \u2014 for extractable text, use PDF to Text instead.',
  ],
  faqs: [
    { question: 'What image format do I get?', answer: 'Pages are exported as PNG images.' },
    { question: 'Can I convert just one page instead of the whole PDF?', answer: 'Yes \u2014 every page is rendered individually, so you can download only the ones you need.' },
    { question: 'Will the image quality match the original PDF?', answer: 'Pages are rendered at high resolution, so text and graphics stay sharp for typical use like slides or sharing.' },
  ],
  related: [
    { label: 'Image to PDF', href: '/document-tools/image-to-pdf' },
    { label: 'PDF to Text', href: '/document-tools/pdf-to-text' },
  ],
};

export default function PdfToImagePage() {
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { addEntry } = useToolHistory();

  async function processFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please choose a PDF file.');
      setStatus('error');
      return;
    }
    setStatus('processing');
    try {
      const bytes = await file.arrayBuffer();
      const pdfjs = getPdfjs();
      const loadingTask = pdfjs.getDocument({ data: bytes });
      const doc = await loadingTask.promise;
      const baseName = stripExtension(file.name);
      const rendered: { url: string; name: string }[] = [];

      try {
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          rendered.push({ url: canvas.toDataURL('image/png'), name: `${baseName}-page-${i}.png` });
        }
      } finally {
        loadingTask.destroy();
      }

      setImages(rendered);
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: `${baseName} (${rendered.length} pages)`, sizeLabel: `${rendered.length} PNG` });
      setStatus('success');
    } catch {
      setErrorMsg('Could not render this PDF. It may be encrypted or corrupted.');
      setStatus('error');
    }
  }

  function downloadOne(img: { url: string; name: string }) {
    fetch(img.url).then((r) => r.blob()).then((blob) => downloadBlob(blob, img.name));
  }

  async function downloadAll() {
    const zip = new JSZip();
    for (const img of images) {
      const blob = await (await fetch(img.url)).blob();
      zip.file(img.name, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'pdf-pages.zip');
  }

  function reset() {
    setImages([]);
    setStatus('idle');
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/pdf-to-image" icon={ImageDown} breadcrumb={{ label: 'PDF to Image' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {images.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-navy-600 dark:text-ink-300">{images.length} page{images.length !== 1 ? 's' : ''} rendered</p>
              <div className="flex flex-wrap gap-2">
                {images.length > 1 && <Button size="sm" onClick={downloadAll}>Download all (ZIP)</Button>}
                <Button size="sm" variant="ghost" onClick={reset}>Start over</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <button key={img.name} onClick={() => downloadOne(img)} aria-label={`Download ${img.name}`} className="group rounded-xl border border-navy-100 dark:border-white/10 p-2 text-left hover:border-electric-500 transition-colors">
                  <img src={img.url} alt="" className="w-full rounded-lg" />
                  <p className="text-xs text-navy-500 dark:text-ink-500 mt-1.5 truncate group-hover:text-electric-500">{img.name}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <FileDropzone accept="application/pdf" label="Drop a PDF here" hint="Renders every page as a PNG" onFiles={processFile} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : 'Rendering pages...'} />
            </div>
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}
