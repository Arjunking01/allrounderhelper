import { useState } from 'react';
import { ArrowUp, ArrowDown, RotateCw } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import type { LucideIcon } from 'lucide-react';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import type { ToolArticleContent } from '@/components/ToolArticle';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { DownloadCard } from '@/components/document/DownloadCard';
import { Button } from '@/components/ui/Button';
import type { Crumb } from '@/components/ui/Breadcrumbs';
import { clsx } from '@/lib/utils/clsx';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob, stripExtension } from '../logic/fileUtils';
import { getPdfjs } from '../logic/pdfjsSetup';

export type PdfPageMode = 'rotate' | 'rearrange' | 'extract' | 'delete';

interface PageItem {
  originalIndex: number;
  rotation: number;
  marked: boolean; // "selected" for extract, "marked for deletion" for delete
  thumbnail: string;
}

interface PdfPageWorkspaceProps {
  mode: PdfPageMode;
  toolName: string;
  tagline: string;
  description: string;
  path: string;
  icon: LucideIcon;
  breadcrumb: Crumb;
  toolSlug: string;
  /** Optional educational content, forwarded straight through to DocumentToolLayout. */
  article?: ToolArticleContent;
}

export function PdfPageWorkspace({ mode, toolName, tagline, description, path, icon, breadcrumb, toolSlug, article }: PdfPageWorkspaceProps) {
  const [fileName, setFileName] = useState('');
  const [fileBytes, setFileBytes] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const { addEntry } = useToolHistory();

  async function loadFile(files: File[]) {
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
      const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
      const doc = await loadingTask.promise;
      const items: PageItem[] = [];
      try {
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          items.push({ originalIndex: i - 1, rotation: 0, marked: mode === 'extract', thumbnail: canvas.toDataURL() });
        }
      } finally {
        loadingTask.destroy();
      }
      setFileName(file.name);
      setFileBytes(bytes);
      setPages(items);
      setStatus('idle');
    } catch {
      setErrorMsg('Could not read this PDF. It may be encrypted or corrupted.');
      setStatus('error');
    }
  }

  function move(index: number, dir: -1 | 1) {
    setPages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function cycleRotation(index: number) {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));
  }

  function toggleMark(index: number) {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, marked: !p.marked } : p)));
  }

  async function apply() {
    if (!fileBytes) return;
    setStatus('processing');
    try {
      const src = await PDFDocument.load(fileBytes);
      const output = await PDFDocument.create();

      let indicesToCopy: number[];
      if (mode === 'extract') indicesToCopy = pages.filter((p) => p.marked).map((p) => p.originalIndex);
      else if (mode === 'delete') indicesToCopy = pages.filter((p) => !p.marked).map((p) => p.originalIndex);
      else indicesToCopy = pages.map((p) => p.originalIndex);

      if (indicesToCopy.length === 0) {
        setErrorMsg(mode === 'extract' ? 'Select at least one page to extract.' : 'At least one page must remain.');
        setStatus('error');
        return;
      }

      const copied = await output.copyPages(src, indicesToCopy);

      if (mode === 'rotate') {
        copied.forEach((page, i) => {
          const rotation = pages[i].rotation;
          if (rotation) page.setRotation(degrees(page.getRotation().angle + rotation));
          output.addPage(page);
        });
      } else {
        copied.forEach((page) => output.addPage(page));
      }

      const bytes = await output.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const name = `${stripExtension(fileName)}-${mode}.pdf`;
      setResult({ blob, name });
      addEntry({ tool: toolName, toolSlug, fileName: name, sizeLabel: formatBytes(blob.size) });
      setStatus('success');
    } catch {
      setErrorMsg('Something went wrong while processing this PDF.');
      setStatus('error');
    }
  }

  function reset() {
    setFileName('');
    setFileBytes(null);
    setPages([]);
    setResult(null);
    setStatus('idle');
  }

  const actionLabel = { rotate: 'Apply rotation', rearrange: 'Save new order', extract: 'Extract selected pages', delete: 'Delete selected pages' }[mode];

  return (
    <DocumentToolLayout toolName={toolName} tagline={tagline} description={description} path={path} icon={icon} breadcrumb={breadcrumb} toolSlug={toolSlug} article={article}>
      <Card>
        {result ? (
          <DownloadCard fileName={result.name} sizeLabel={formatBytes(result.blob.size)} onDownload={() => downloadBlob(result.blob, result.name)} onReset={reset} />
        ) : pages.length === 0 ? (
          <>
            <FileDropzone accept="application/pdf" label="Drop a PDF here" hint="PDF only" onFiles={loadFile} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : 'Reading pages...'} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
              {pages.map((page, i) => (
                <div key={`${page.originalIndex}-${i}`} className={clsx('relative rounded-xl border-2 p-2', page.marked && (mode === 'extract' ? 'border-electric-500' : 'border-red-400'), !page.marked && 'border-navy-100 dark:border-white/10')}>
                  <img
                    src={page.thumbnail}
                    alt={`Page ${page.originalIndex + 1}`}
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                    className="w-full rounded-lg border border-navy-100 dark:border-white/10 transition-transform"
                  />
                  <p className="text-center text-xs text-navy-500 dark:text-ink-500 mt-1.5">Page {page.originalIndex + 1}</p>

                  {mode === 'rotate' && (
                    <button onClick={() => cycleRotation(i)} aria-label={`Rotate page ${page.originalIndex + 1}${page.rotation ? `, currently rotated ${page.rotation} degrees` : ''}`} className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 dark:bg-navy-900/90 text-navy-700 dark:text-ink-200 shadow">
                      <RotateCw size={13} />
                    </button>
                  )}
                  {mode === 'rearrange' && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-navy-900/90 text-navy-700 dark:text-ink-200 shadow disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === pages.length - 1} aria-label="Move later" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-navy-900/90 text-navy-700 dark:text-ink-200 shadow disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  )}
                  {(mode === 'extract' || mode === 'delete') && (
                    <label className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-navy-900/90 shadow cursor-pointer">
                      <input type="checkbox" checked={page.marked} onChange={() => toggleMark(i)} className="accent-electric-500" aria-label={`Select page ${page.originalIndex + 1}`} />
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={apply}>{actionLabel}</Button>
              <Button variant="ghost" onClick={reset}>Start over</Button>
            </div>
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : undefined} />
            </div>
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}
