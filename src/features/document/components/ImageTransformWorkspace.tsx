import { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import JSZip from 'jszip';
import type { LucideIcon } from 'lucide-react';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import type { ToolArticleContent } from '@/components/ToolArticle';
import { Card, SoftCard } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { Button } from '@/components/ui/Button';
import type { Crumb } from '@/components/ui/Breadcrumbs';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob, loadImage, stripExtension } from '../logic/fileUtils';

type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

const EXTENSION: Record<ImageFormat, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const FORMAT_LABEL: Record<ImageFormat, string> = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WEBP' };

interface ImageTransformWorkspaceProps {
  toolName: string;
  tagline: string;
  description: string;
  path: string;
  icon: LucideIcon;
  breadcrumb: Crumb;
  toolSlug: string;
  /** Optional educational content, forwarded straight through to DocumentToolLayout. */
  article?: ToolArticleContent;
  formatOptions: ImageFormat[] | 'same-as-source';
  allowResize?: boolean;
  allowQuality?: boolean;
  defaultQuality?: number;
  allowBatch?: boolean;
}

interface SourceItem {
  id: string;
  file: File;
  sourceUrl: string;
  naturalSize: { width: number; height: number };
}

interface ResultItem {
  id: string;
  name: string;
  blob: Blob;
  previewUrl: string;
  originalSize: number;
}

export function ImageTransformWorkspace({
  toolName, tagline, description, path, icon, breadcrumb, toolSlug, article,
  formatOptions, allowResize = false, allowQuality = true, defaultQuality = 0.85, allowBatch = true,
}: ImageTransformWorkspaceProps) {
  const [items, setItems] = useState<SourceItem[]>([]);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<ImageFormat>('image/jpeg');
  const [quality, setQuality] = useState(defaultQuality);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const { addEntry } = useToolHistory();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const resultsRef = useRef(results);
  resultsRef.current = results;

  useEffect(() => () => {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.sourceUrl);
    for (const r of resultsRef.current) URL.revokeObjectURL(r.previewUrl);
  }, []);

  const firstFile = items[0]?.file ?? null;

  const availableFormats = useMemo<ImageFormat[]>(() => {
    if (formatOptions === 'same-as-source') return firstFile ? [firstFile.type as ImageFormat] : [];
    return formatOptions;
  }, [formatOptions, firstFile]);

  async function handleFiles(files: File[]) {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      setErrorMsg(files.length > 0 ? 'Please choose an image file (JPG, PNG, or WEBP).' : '');
      setStatus(files.length > 0 ? 'error' : 'idle');
      return;
    }
    const hadPartialInvalid = valid.length < files.length;
    if (hadPartialInvalid) {
      setErrorMsg('Only image files are supported — other files were skipped.');
    } else {
      setErrorMsg('');
    }
    const toLoad = allowBatch ? valid : [valid[0]];
    try {
      const loaded: SourceItem[] = [];
      for (const f of toLoad) {
        const url = URL.createObjectURL(f);
        const img = await loadImage(url);
        loaded.push({ id: crypto.randomUUID(), file: f, sourceUrl: url, naturalSize: { width: img.width, height: img.height } });
      }
      for (const item of itemsRef.current) URL.revokeObjectURL(item.sourceUrl);
      for (const r of resultsRef.current) URL.revokeObjectURL(r.previewUrl);
      setResults([]);
      setItems(loaded);
      setStatus(hadPartialInvalid ? 'error' : 'idle');
      setWidth(loaded[0].naturalSize.width);
      setHeight(loaded[0].naturalSize.height);
      const first = loaded[0].file;
      const initialFormat = formatOptions === 'same-as-source' ? (first.type as ImageFormat) : formatOptions.find((fmt) => fmt !== first.type) ?? formatOptions[0];
      setFormat(initialFormat);
    } catch {
      setErrorMsg('Could not read one or more of these image files.');
      setStatus('error');
    }
  }

  function onWidthChange(value: number) {
    if (lockAspect && items[0]) {
      const ratio = items[0].naturalSize.height / items[0].naturalSize.width;
      setWidth(value);
      setHeight(Math.round(value * ratio));
    } else {
      setWidth(value);
    }
  }

  function onHeightChange(value: number) {
    if (lockAspect && items[0]) {
      const ratio = items[0].naturalSize.width / items[0].naturalSize.height;
      setHeight(value);
      setWidth(Math.round(value * ratio));
    } else {
      setHeight(value);
    }
  }

  async function processOne(item: SourceItem): Promise<ResultItem> {
    const img = await loadImage(item.sourceUrl);
    const targetWidth = allowResize ? width : item.naturalSize.width;
    const targetHeight = allowResize ? height : item.naturalSize.height;
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d')!;
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const useQuality = allowQuality && format !== 'image/png';
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), format, useQuality ? quality : undefined);
    });

    const name = `${stripExtension(item.file.name)}.${EXTENSION[format]}`;
    return { id: item.id, name, blob, previewUrl: URL.createObjectURL(blob), originalSize: item.file.size };
  }

  async function process() {
    if (items.length === 0) return;
    setStatus('processing');
    setProgress(0);
    try {
      const out: ResultItem[] = [];
      for (let i = 0; i < items.length; i++) {
        out.push(await processOne(items[i]));
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      setResults(out);
      out.forEach((r) => addEntry({ tool: toolName, toolSlug, fileName: r.name, sizeLabel: formatBytes(r.blob.size) }));
      setStatus('success');
    } catch {
      setErrorMsg('Could not process one or more images. Try a different file or format.');
      setStatus('error');
    }
  }

  async function downloadAll() {
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.name, r.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'converted-images.zip');
  }

  function reset() {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.sourceUrl);
    for (const r of resultsRef.current) URL.revokeObjectURL(r.previewUrl);
    setItems([]);
    setResults([]);
    setStatus('idle');
    setProgress(0);
  }

  return (
    <DocumentToolLayout toolName={toolName} tagline={tagline} description={description} path={path} icon={icon} breadcrumb={breadcrumb} toolSlug={toolSlug} article={article}>
      <Card>
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.length > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-navy-600 dark:text-ink-300">{results.length} images processed</p>
                <Button size="sm" icon={<Download size={14} />} onClick={downloadAll}>Download all (ZIP)</Button>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {results.map((r) => (
                <SoftCard key={r.id} className="flex items-center gap-3">
                  <img src={r.previewUrl} alt={r.name} className="h-14 w-14 rounded-lg object-cover border border-navy-100 dark:border-white/10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-navy-500 dark:text-ink-500">{formatBytes(r.originalSize)} → <span className="text-emerald-500 font-medium">{formatBytes(r.blob.size)}</span></p>
                  </div>
                  <button onClick={() => downloadBlob(r.blob, r.name)} aria-label={`Download ${r.name}`} className="p-2 rounded-lg text-navy-400 hover:text-electric-500 hover:bg-electric-500/10 shrink-0">
                    <Download size={16} />
                  </button>
                </SoftCard>
              ))}
            </div>
            <Button variant="ghost" onClick={reset}>Start over</Button>
          </div>
        ) : items.length === 0 ? (
          <>
            <FileDropzone accept="image/*" multiple={allowBatch} label={allowBatch ? 'Drop one or more images here' : 'Drop an image here'} hint="JPG, PNG, or WEBP" onFiles={handleFiles} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : undefined} />
            </div>
          </>
        ) : (
          <div className="grid sm:grid-cols-[200px_1fr] gap-6">
            <div className="space-y-2">
              <img src={items[0].sourceUrl} alt="Preview" className="w-full rounded-xl border border-navy-100 dark:border-white/10 object-cover aspect-square" />
              {items.length > 1 && <p className="text-xs text-center text-navy-500 dark:text-ink-500">+{items.length - 1} more file{items.length - 1 !== 1 ? 's' : ''}</p>}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-navy-500 dark:text-ink-500">
                {items.length === 1 ? `${items[0].file.name} · ${formatBytes(items[0].file.size)} · ${items[0].naturalSize.width}×${items[0].naturalSize.height}px` : `${items.length} images selected`}
              </p>

              {allowResize && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    Width (px)
                    <input type="number" value={width} onChange={(e) => onWidthChange(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                  </label>
                  <label className="text-sm">
                    Height (px)
                    <input type="number" value={height} onChange={(e) => onHeightChange(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
                  </label>
                  <label className="col-span-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} className="accent-electric-500" />
                    Lock aspect ratio
                  </label>
                  {items.length > 1 && <p className="col-span-2 text-xs text-navy-400 dark:text-ink-500">These dimensions apply to every image in this batch.</p>}
                </div>
              )}

              {availableFormats.length > 1 && (
                <div>
                  <p id="output-format-label" className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-1.5">Output format</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-labelledby="output-format-label">
                    {availableFormats.map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        aria-pressed={format === fmt}
                        className={`rounded-lg px-3.5 py-1.5 text-sm font-medium border transition-colors ${format === fmt ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}
                      >
                        {FORMAT_LABEL[fmt]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {allowQuality && format !== 'image/png' && (
                <label className="block text-sm">
                  Quality — {Math.round(quality * 100)}%
                  <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-1 w-full accent-electric-500" />
                </label>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={process}>{items.length > 1 ? `Process ${items.length} images` : 'Process image'}</Button>
                <Button variant="ghost" onClick={reset}>Choose different file{items.length > 1 ? 's' : ''}</Button>
              </div>
              <ProcessingIndicator status={status} progress={progress} message={status === 'error' ? errorMsg : status === 'processing' ? `Processing ${progress}%` : undefined} />
            </div>
          </div>
        )}
      </Card>
    </DocumentToolLayout>
  );
}
