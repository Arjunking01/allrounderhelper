import { useState } from 'react';
import { FileText, Copy } from 'lucide-react';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { useToast } from '@/components/ToastProvider';
import { downloadBlob, stripExtension } from '../logic/fileUtils';
import { getPdfjs } from '../logic/pdfjsSetup';
import { copyToClipboard } from '@/lib/clipboard';
import { AskAiAboutTextButton } from '../components/AskAiAboutTextButton';

const tool = getDocumentToolBySlug('pdf-to-text')!;

const article = {
  intro: 'PDF to Text extracts all readable text from a PDF document and lets you download it as a plain text file, so you can search, edit, or paste it elsewhere.',
  whyItMatters: 'A PDF\u2019s text isn\u2019t always easy to copy cleanly, especially across multiple pages. Extracting it as plain text makes it searchable, editable, and easy to paste into notes or another document.',
  howItWorks: [
    'Select a PDF file with selectable (non-scanned) text.',
    'The tool reads and extracts all text content.',
    'Download the result as a .txt file.',
  ],
  examples: [
    { title: 'Pulling text for notes', body: 'Extract the text of a lecture PDF to paste into your notes app and highlight or annotate it there.' },
    { title: 'Checking if a PDF is scanned before extracting', body: 'If extraction returns almost no text from a PDF you know has content, that is a strong sign it is actually a scanned image saved as a PDF rather than a digitally created document -- switch to OCR Text Extraction, which is built for exactly that case.' },
  ],
  mistakes: [
    'Using this on a scanned PDF with no real text layer \u2014 it will return little or nothing. Use OCR Text Extraction for scanned documents instead.',
  ],
  tips: [
    'If the PDF is a scan or photo rather than a digitally created document, use OCR Text Extraction instead of this tool.',
  ],
  faqs: [
    { question: 'Does this work on scanned PDFs?', answer: 'Not reliably \u2014 scanned PDFs have no embedded text layer to extract. Use OCR Text Extraction for those instead.' },
    { question: 'Is formatting like bold or bullet points preserved?', answer: 'No \u2014 the output is plain text only. Layout, fonts, and formatting are not carried over.' },
    { question: 'Is my PDF uploaded to a server?', answer: 'No \u2014 the text extraction happens entirely in your browser.' },
  ],
  related: [
    { label: 'OCR Text Extraction', href: '/document-tools/ocr-text-extraction' },
    { label: 'PDF to Image', href: '/document-tools/pdf-to-image' },
    { label: 'Notes', href: '/productivity/notes' },
  ],
};

interface TextItemLike {
  str?: string;
}

export default function PdfTextExtractPage() {
  const [text, setText] = useState('');
  const [fileBaseName, setFileBaseName] = useState('document');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const { addEntry } = useToolHistory();
  const { showToast } = useToast();

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
      let fullText = '';
      try {
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => (item as TextItemLike).str ?? '').join(' ');
          fullText += pageText + '\n\n';
        }
      } finally {
        loadingTask.destroy();
      }
      const trimmed = fullText.trim();
      if (!trimmed) {
        setErrorMsg('No selectable text found in this PDF. It may be scanned (image-only) — try the OCR tool instead.');
        setStatus('error');
        return;
      }
      setText(trimmed);
      setFileBaseName(stripExtension(file.name));
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: `${stripExtension(file.name)}.txt`, sizeLabel: formatBytes(new Blob([fullText]).size) });
      setStatus('success');
    } catch {
      setErrorMsg('Could not extract text. The PDF may be scanned (image-only) — try the OCR tool instead.');
      setStatus('error');
    }
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
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/pdf-to-text" icon={FileText} breadcrumb={{ label: 'PDF to Text' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {text ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="text-sm text-navy-600 dark:text-ink-300">Extracted {text.split(/\s+/).length.toLocaleString()} words</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" icon={<Copy size={14} />} onClick={copyText}>{copied ? 'Copied!' : 'Copy'}</Button>
                <Button size="sm" onClick={download}>Download .txt</Button>
                <AskAiAboutTextButton text={text} toolName="PDF to Text" />
                <Button size="sm" variant="ghost" onClick={reset}>Start over</Button>
              </div>
            </div>
            <textarea readOnly aria-label="Extracted text" value={text} className="w-full h-96 rounded-xl border border-navy-100 dark:border-white/10 bg-navy-50/50 dark:bg-white/5 p-4 text-sm font-mono leading-relaxed outline-none resize-none" />
          </div>
        ) : (
          <>
            <FileDropzone accept="application/pdf" label="Drop a PDF here" hint="Extracts selectable text" onFiles={processFile} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : 'Extracting text...'} />
            </div>
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}
