import { useState } from 'react';
import { Combine, ArrowUp, ArrowDown, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { DownloadCard } from '@/components/document/DownloadCard';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob } from '../logic/fileUtils';

const tool = getDocumentToolBySlug('merge-pdf')!;

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const { addEntry } = useToolHistory();

  function addFiles(newFiles: File[]) {
    const valid = newFiles.filter((f) => f.type === 'application/pdf');
    if (valid.length < newFiles.length) {
      setErrorMsg('Only PDF files can be merged — non-PDF files were skipped.');
      setStatus('error');
    } else {
      setErrorMsg('');
      setStatus('idle');
    }
    setFiles((prev) => [...prev, ...valid]);
  }

  function move(index: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function merge() {
    if (files.length < 2) {
      setErrorMsg('Add at least two PDF files to merge.');
      setStatus('error');
      return;
    }
    setStatus('processing');
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const name = 'merged.pdf';
      setResult({ blob, name });
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: name, sizeLabel: formatBytes(blob.size) });
      setStatus('success');
    } catch {
      setErrorMsg('Could not merge these PDFs. Make sure every file is a valid, unencrypted PDF.');
      setStatus('error');
    }
  }

  function reset() {
    setFiles([]);
    setResult(null);
    setStatus('idle');
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/merge-pdf" icon={Combine} breadcrumb={{ label: 'Merge PDF' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {result ? (
          <DownloadCard fileName={result.name} sizeLabel={formatBytes(result.blob.size)} onDownload={() => downloadBlob(result.blob, result.name)} onReset={reset} />
        ) : (
          <>
            <FileDropzone accept="application/pdf" multiple label="Drop PDF files here" hint="PDF only" onFiles={addFiles} />

            {files.length > 0 && (
              <ul className="mt-5 space-y-2">
                {files.map((file, i) => (
                  <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 dark:bg-white/5 text-xs font-semibold text-navy-500 dark:text-ink-400 shrink-0">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-navy-400 dark:text-ink-500 shrink-0">{formatBytes(file.size)}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-1.5 rounded-lg text-navy-400 hover:text-electric-500 disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === files.length - 1} aria-label="Move down" className="p-1.5 rounded-lg text-navy-400 hover:text-electric-500 disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => removeFile(i)} aria-label="Remove file" className="p-1.5 rounded-lg text-navy-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex items-center gap-3">
              <Button disabled={files.length < 2} onClick={merge}>Merge {files.length > 0 ? `${files.length} files` : ''}</Button>
              {files.length > 0 && <Button variant="ghost" onClick={reset}>Clear</Button>}
            </div>

            <div className="mt-4">
              <ProcessingIndicator status={status === 'idle' ? 'idle' : status} message={status === 'error' ? errorMsg : undefined} />
            </div>
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}

const article = {
  intro: 'Merge PDF combines multiple PDF files into a single document, in whatever order you choose — entirely in your browser, with no file ever uploaded to a server.',
  whyItMatters: 'Students often need to combine separate PDFs — scanned assignment pages, multiple chapter exports, or several forms — into one file before submitting or printing. Doing this without an upload keeps sensitive documents (transcripts, ID scans, personal forms) on your own device.',
  howItWorks: [
    'Drop or select two or more PDF files.',
    'Reorder them using the up/down arrows until they\u2019re in the sequence you want.',
    'Click Merge to combine them into a single PDF, then download the result.',
  ],
  examples: [
    { title: 'Combining assignment scans', body: 'Merge five individually scanned pages into one PDF before uploading to a learning portal that only accepts a single file.' },
    { title: 'Building a portfolio', body: 'Combine a cover letter, resume, and writing samples — each exported as a separate PDF — into one document to send to an employer.' },
  ],
  mistakes: [
    'Forgetting to reorder files before merging — the output follows the order shown in the list, not necessarily upload order.',
    'Merging password-protected PDFs, which this tool can\u2019t open without the password being removed first.',
  ],
  tips: [
    'Use the arrow buttons to fine-tune page order before merging rather than re-uploading files in a different sequence.',
    'If a merged file is too large to submit, run it through Compress PDF afterward.',
  ],
  faqs: [
    { question: 'Are my files uploaded anywhere?', answer: 'No — merging happens entirely in your browser using JavaScript. Files never leave your device.' },
    { question: 'Is there a limit to how many PDFs I can merge?', answer: 'There\u2019s no hard cap in the tool itself, though very large combined files may take longer to process depending on your device.' },
    { question: 'Can I merge password-protected PDFs?', answer: 'Not directly — remove the password protection from each file first, then merge.' },
  ],
  related: [
    { label: 'Split PDF', href: '/document-tools/split-pdf' },
    { label: 'Compress PDF', href: '/document-tools/compress-pdf' },
    { label: 'Rearrange PDF', href: '/document-tools/rearrange-pdf' },
  ],
};
