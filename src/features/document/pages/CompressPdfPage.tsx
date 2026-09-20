import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { DownloadCard } from '@/components/document/DownloadCard';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob, stripExtension } from '../logic/fileUtils';

const tool = getDocumentToolBySlug('compress-pdf')!;

export default function CompressPdfPage() {
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const { addEntry } = useToolHistory();

  async function processFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please choose a PDF file.');
      setStatus('error');
      return;
    }
    setOriginalSize(file.size);
    setStatus('processing');
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
      const blob = new Blob([output as BlobPart], { type: 'application/pdf' });
      const name = `${stripExtension(file.name)}-compressed.pdf`;
      setResult({ blob, name });
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: name, sizeLabel: formatBytes(blob.size) });
      setStatus('success');
    } catch {
      setErrorMsg('Could not compress this PDF. It may be encrypted or corrupted.');
      setStatus('error');
    }
  }

  function reset() {
    setResult(null);
    setOriginalSize(null);
    setStatus('idle');
  }

  const savedPercent = result && originalSize ? Math.max(0, Math.round((1 - result.blob.size / originalSize) * 100)) : null;

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/compress-pdf" icon={Minimize2} breadcrumb={{ label: 'Compress PDF' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {result ? (
          <div className="space-y-4">
            {savedPercent !== null && (
              <SoftCard>
                <p className="text-sm text-navy-600 dark:text-ink-300">
                  {savedPercent > 0
                    ? <>Reduced file size by <span className="font-semibold text-emerald-500">{savedPercent}%</span> — from {formatBytes(originalSize!)} to {formatBytes(result.blob.size)}.</>
                    : 'This PDF was already tightly optimized — file size stayed about the same.'}
                </p>
              </SoftCard>
            )}
            <DownloadCard fileName={result.name} sizeLabel={formatBytes(result.blob.size)} onDownload={() => downloadBlob(result.blob, result.name)} onReset={reset} />
          </div>
        ) : (
          <>
            <FileDropzone accept="application/pdf" label="Drop a PDF here" hint="PDF only" onFiles={processFile} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : 'Compressing...'} />
            </div>
            {status === 'error' && <Button className="mt-3" variant="ghost" onClick={reset}>Try another file</Button>}
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}

const article = {
  intro: 'Compress PDF reduces file size by re-optimizing the document\u2019s internal structure — useful when a form, assignment, or portfolio is too large to email or upload.',
  whyItMatters: 'Many learning portals and email providers cap upload size at a few megabytes. A PDF full of scanned images or embedded fonts can easily exceed that. Shrinking it without losing readability means one less rejected submission.',
  howItWorks: [
    'Choose a PDF file.',
    'The tool re-saves it using object streams, which removes redundant internal structure without touching the visible content.',
    'Download the compressed file and compare the before/after size shown on screen.',
  ],
  examples: [
    { title: 'Email attachment limits', body: 'A 12 MB scanned assignment can often be brought under most email providers\u2019 25 MB or portal 10 MB caps after compression.' },
    { title: 'Faster uploads', body: 'Compressing a multi-page scanned lab report before uploading it to a slow campus Wi-Fi connection saves real time.' },
  ],
  mistakes: [
    'Expecting dramatic size reduction on PDFs that are mostly text — compression helps most with image-heavy files.',
    'Compressing an already-compressed file repeatedly, which yields diminishing returns.',
  ],
  tips: [
    'If a PDF is still too large after compression, try Image Compressor on the source images before converting them to PDF.',
    'Always double check the compressed file still displays correctly before submitting it — the tool shows a size comparison so you know exactly how much was saved.',
  ],
  faqs: [
    { question: 'Will compression reduce image quality?', answer: 'This tool optimizes the PDF\u2019s internal structure rather than aggressively re-encoding images, so visual quality is preserved. For heavier compression of image-heavy PDFs, reduce the source images first.' },
    { question: 'Is there a file size limit?', answer: 'No hard limit is enforced by the tool, but very large files will take longer to process depending on your device.' },
    { question: 'Does compression work on scanned PDFs?', answer: 'Yes, though the size reduction from structural optimization alone is typically smaller for image-heavy scanned documents than for text-based PDFs.' },
  ],
  related: [
    { label: 'Merge PDF', href: '/document-tools/merge-pdf' },
    { label: 'Split PDF', href: '/document-tools/split-pdf' },
    { label: 'Image Compressor', href: '/document-tools/image-compressor' },
  ],
};
