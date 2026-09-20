import { useEffect, useRef, useState } from 'react';
import { ScanText, Copy, Square } from 'lucide-react';
import { createWorker, type Worker } from 'tesseract.js';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { useToast } from '@/components/ToastProvider';
import { downloadBlob, loadImage, stripExtension } from '../logic/fileUtils';
import { getPdfjs } from '../logic/pdfjsSetup';
import { copyToClipboard } from '@/lib/clipboard';
import { AskAiAboutTextButton } from '../components/AskAiAboutTextButton';

const tool = getDocumentToolBySlug('ocr-text-extraction')!;

export default function OcrTextExtractionPage() {
  const [text, setText] = useState('');
  const [fileBaseName, setFileBaseName] = useState('scan');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const cancelledRef = useRef(false);
  const { addEntry } = useToolHistory();
  const { showToast } = useToast();

  useEffect(() => () => {
    cancelledRef.current = true;
    workerRef.current?.terminate();
  }, []);

  async function ocrImageSources(images: (HTMLCanvasElement | HTMLImageElement)[], baseName: string) {
    setStatus('processing');
    setProgress(0);
    cancelledRef.current = false;
    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      workerRef.current = worker;

      let fullText = '';
      for (const source of images) {
        if (cancelledRef.current) break;
        const { data } = await worker.recognize(source);
        fullText += data.text + '\n\n';
      }

      await worker.terminate();
      workerRef.current = null;

      if (cancelledRef.current) {
        setStatus('idle');
        return;
      }

      const trimmed = fullText.trim();
      if (!trimmed) {
        setErrorMsg('No text could be recognized in this image. Try a clearer, higher-contrast scan or photo.');
        setStatus('error');
        return;
      }

      setText(trimmed);
      setFileBaseName(baseName);
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: `${baseName}.txt`, sizeLabel: formatBytes(new Blob([fullText]).size) });
      setStatus('success');
    } catch {
      setErrorMsg('OCR failed — this needs an internet connection the first time it runs (to download the recognition engine), then works offline for the rest of the session.');
      setStatus('error');
    }
  }

  async function handleFile(files: File[]) {
    const file = files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        const bytes = await file.arrayBuffer();
        const pdfjs = getPdfjs();
        const loadingTask = pdfjs.getDocument({ data: bytes });
        const doc = await loadingTask.promise;
        const canvases: HTMLCanvasElement[] = [];
        try {
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            canvases.push(canvas);
          }
        } finally {
          loadingTask.destroy();
        }
        await ocrImageSources(canvases, stripExtension(file.name));
      } catch {
        setErrorMsg('Could not read this PDF for OCR.');
        setStatus('error');
      }
    } else if (file.type.startsWith('image/')) {
      try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);
        URL.revokeObjectURL(url);
        await ocrImageSources([img], stripExtension(file.name));
      } catch {
        setErrorMsg('Could not read this image file.');
        setStatus('error');
      }
    } else {
      setErrorMsg('Upload an image (JPG, PNG) or a scanned PDF.');
      setStatus('error');
    }
  }

  async function cancel() {
    cancelledRef.current = true;
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus('idle');
    setProgress(0);
  }

  function download() {
    downloadBlob(new Blob([text], { type: 'text/plain' }), `${fileBaseName}.txt`);
  }

  async function copyText() {
    const ok = await copyToClipboard(text);
    if (!ok) { showToast('Could not copy text'); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function reset() {
    setText('');
    setStatus('idle');
    setProgress(0);
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/ocr-text-extraction" icon={ScanText} breadcrumb={{ label: 'OCR Text Extraction' }} toolSlug={tool.slug}
      article={article}
    >
      <Card>
        {text ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="text-sm text-navy-600 dark:text-ink-300">Recognized {text.split(/\s+/).filter(Boolean).length.toLocaleString()} words</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" icon={<Copy size={14} />} onClick={copyText}>{copied ? 'Copied!' : 'Copy'}</Button>
                <Button size="sm" onClick={download}>Download .txt</Button>
                <AskAiAboutTextButton text={text} toolName="OCR Text Extraction" />
                <Button size="sm" variant="ghost" onClick={reset}>Start over</Button>
              </div>
            </div>
            <textarea readOnly aria-label="Recognized text" value={text} className="w-full h-96 rounded-xl border border-navy-100 dark:border-white/10 bg-navy-50/50 dark:bg-white/5 p-4 text-sm font-mono leading-relaxed outline-none resize-none" />
          </div>
        ) : status === 'processing' ? (
          <div className="space-y-4">
            <ProcessingIndicator status="processing" progress={progress} message={`Recognizing text... ${progress}%`} />
            <Button variant="outline" icon={<Square size={14} />} onClick={cancel}>Cancel</Button>
          </div>
        ) : (
          <>
            <SoftCard className="mb-5">
              <p className="text-sm text-navy-600 dark:text-ink-300">
                OCR runs fully in your browser using an on-device recognition engine — your file is never uploaded anywhere. The engine (a few MB) downloads once on first use and is cached for later.
              </p>
            </SoftCard>
            <FileDropzone accept="image/*,application/pdf" label="Drop a scanned image or PDF here" hint="JPG, PNG, or scanned PDF" onFiles={handleFile} />
            {status === 'error' && <div className="mt-4"><ProcessingIndicator status="error" message={errorMsg} /></div>}
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}

const article = {
  intro: 'This tool recognizes text inside scanned images and photographed or scanned PDF pages, converting pixels back into selectable, searchable, copyable text — entirely on your device.',
  whyItMatters: 'Scanned documents and photographed notes lock text inside an image, so you can\'t search, copy, or edit them. OCR (optical character recognition) turns that image back into real text, which is invaluable for digitizing handouts, textbook pages, or old paperwork.',
  howItWorks: [
    'Upload a photo, scanned image, or scanned PDF.',
    'The tool renders each page (for PDFs) to a high-resolution image.',
    'An on-device recognition engine analyzes the image and identifies characters and words.',
    'The recognized text is assembled and shown for you to copy or download.',
  ],
  examples: [
    { title: 'Textbook page photo', body: 'A clear phone photo of a textbook page typically recognizes with very high accuracy, preserving paragraph breaks.' },
    { title: 'Multi-page scanned PDF', body: 'Each page is processed in sequence, with the recognized text from every page combined into one document.' },
  ],
  mistakes: [
    'Using blurry, low-light, or heavily skewed photos — OCR accuracy drops sharply with poor image quality.',
    'Expecting perfect results on handwriting — this engine is tuned for printed text, not handwritten notes.',
    'Not proofreading the output — even high-accuracy OCR occasionally misreads similar-looking characters.',
  ],
  tips: [
    'Use a flat, well-lit, high-contrast scan or photo for the best accuracy.',
    'Crop out unnecessary borders or background before uploading if possible.',
    'For long documents, a proper scanner app will usually outperform a handheld photo.',
  ],
  faqs: [
    { question: 'Is my file uploaded to a server?', answer: 'No — recognition runs entirely in your browser using an on-device engine. The engine itself (a few megabytes) is downloaded once on first use and cached for later.' },
    { question: 'Does this work on handwriting?', answer: 'It is optimized for printed text. Handwriting recognition is much less reliable and not the primary use case here.' },
    { question: 'Why does the first run take longer?', answer: 'The recognition engine downloads on first use. After that, your browser caches it, so later scans start faster.' },
  ],
  related: [
    { label: 'PDF to Text', href: '/document-tools/pdf-to-text' },
    { label: 'PDF to Image', href: '/document-tools/pdf-to-image' },
    { label: 'Image Metadata Viewer', href: '/document-tools/image-metadata-viewer' },
    { label: 'Notes', href: '/productivity/notes' },
  ],
};
