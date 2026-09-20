import { useEffect, useRef, useState } from 'react';
import { Crop } from 'lucide-react';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { DownloadCard } from '@/components/document/DownloadCard';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob, loadImage, stripExtension } from '../logic/fileUtils';

const tool = getDocumentToolBySlug('image-cropper')!;

const article = {
  intro: 'Image Cropper lets you drag a selection box directly on the image to keep just the area you need, then download the cropped result \u2014 all processed locally in your browser.',
  whyItMatters: 'Photos often include more than what\u2019s needed \u2014 background clutter, extra margin, or unrelated content. Cropping to just the relevant area makes the image cleaner, more focused, and often smaller in file size.',
  howItWorks: [
    'Select an image \u2014 the tool accepts any browser-supported image format.',
    'Drag directly on the image to draw a selection box around the area you want to keep.',
    'Re-drag as many times as you like to adjust the selection before committing \u2014 nothing is finalized until you click Crop.',
    'Click "Crop image" to generate the cropped result, then download it or choose another image to start over.',
  ],
  examples: [
    { title: 'Isolating a signature or stamp', body: 'Crop a scanned document down to just a signature or stamp needed for a separate form.' },
    { title: 'Removing a border or scan edge', body: 'Crop out the dark border or edge of a page that came from a flatbed scanner before submitting the file.' },
  ],
  mistakes: [
    'Cropping too tightly and cutting off part of the intended content \u2014 leave a small margin if unsure.',
    'Expecting a JPEG crop to be perfectly lossless \u2014 the cropped area is untouched pixel data, but saving back out as JPEG re-encodes at high quality (92%), which can introduce a very slight, usually imperceptible compression pass. Cropping a PNG has no such re-encoding step.',
  ],
  tips: [
    'Crop first, then resize or compress afterward if the cropped result still needs adjusting.',
    'If avoiding any re-compression matters (e.g. archival scans), start from a PNG rather than a JPEG \u2014 PNG output is fully lossless.',
  ],
  faqs: [
    { question: 'Can I crop to an exact pixel size?', answer: 'The selection box is dragged freely rather than typed as exact coordinates, so for a precise target dimension, crop roughly and then use Image Resizer afterward to hit an exact size.' },
    { question: 'Does cropping reduce image quality?', answer: 'The cropped pixels themselves are untouched \u2014 cropping doesn\u2019t blur or resample anything. For JPEG images, the output is re-encoded at 92% quality when saved, which can introduce a very slight compression pass; PNG output has no such step and stays fully lossless.' },
    { question: 'Can I undo a crop and start over?', answer: 'Yes, before downloading \u2014 you can re-drag a new selection box as many times as you like. After downloading, use "Choose another" to start fresh from the original file.' },
  ],
  related: [
    { label: 'Image Resizer', href: '/document-tools/image-resizer' },
    { label: 'Image Compressor', href: '/document-tools/image-compressor' },
  ],
};

interface Rect { x: number; y: number; w: number; h: number }

export default function ImageCropperPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [selection, setSelection] = useState<Rect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string; previewUrl: string } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { addEntry } = useToolHistory();
  const urlsRef = useRef({ imgUrl: '', resultUrl: '' });

  useEffect(() => () => {
    if (urlsRef.current.imgUrl) URL.revokeObjectURL(urlsRef.current.imgUrl);
    if (urlsRef.current.resultUrl) URL.revokeObjectURL(urlsRef.current.resultUrl);
  }, []);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErrorMsg('Please choose an image file.');
      setStatus('error');
      return;
    }
    const url = URL.createObjectURL(f);
    try {
      const img = await loadImage(url);
      if (urlsRef.current.imgUrl) URL.revokeObjectURL(urlsRef.current.imgUrl);
      urlsRef.current.imgUrl = url;
      setFile(f);
      setImgUrl(url);
      setNaturalSize({ width: img.width, height: img.height });
      setSelection(null);
    } catch {
      URL.revokeObjectURL(url);
      setErrorMsg('Could not read this image.');
      setStatus('error');
    }
  }

  function pointerPos(e: React.PointerEvent) {
    const rect = imgRef.current!.getBoundingClientRect();
    return { x: Math.min(Math.max(0, e.clientX - rect.left), rect.width), y: Math.min(Math.max(0, e.clientY - rect.top), rect.height) };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = pointerPos(e);
    setDragStart(pos);
    setSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart) return;
    const pos = pointerPos(e);
    setSelection({
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      w: Math.abs(pos.x - dragStart.x),
      h: Math.abs(pos.y - dragStart.y),
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragStart(null);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const width = e.currentTarget.width;
    const height = e.currentTarget.height;
    setDisplaySize({ width, height });
    // Seed a default, fully keyboard-editable selection so crop is usable without a pointer drag.
    setSelection((prev) => prev ?? { x: Math.round(width * 0.1), y: Math.round(height * 0.1), w: Math.round(width * 0.8), h: Math.round(height * 0.8) });
  }

  function updateSelectionField(field: keyof Rect, value: number) {
    setSelection((prev) => {
      const base = prev ?? { x: 0, y: 0, w: 0, h: 0 };
      const next = { ...base, [field]: Number.isFinite(value) ? value : 0 };
      next.x = Math.min(Math.max(0, next.x), displaySize.width);
      next.y = Math.min(Math.max(0, next.y), displaySize.height);
      next.w = Math.min(Math.max(0, next.w), displaySize.width - next.x);
      next.h = Math.min(Math.max(0, next.h), displaySize.height - next.y);
      return next;
    });
  }

  async function crop() {
    if (!file || !selection || selection.w < 4 || selection.h < 4) {
      setErrorMsg('Drag a selection box on the image first.');
      setStatus('error');
      return;
    }
    setStatus('processing');
    try {
      const img = await loadImage(imgUrl);
      const scaleX = naturalSize.width / displaySize.width;
      const scaleY = naturalSize.height / displaySize.height;
      const sx = selection.x * scaleX;
      const sy = selection.y * scaleY;
      const sw = selection.w * scaleX;
      const sh = selection.h * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), file.type.includes('png') ? 'image/png' : 'image/jpeg', 0.92);
      });

      const name = `${stripExtension(file.name)}-cropped.${file.type.includes('png') ? 'png' : 'jpg'}`;
      if (urlsRef.current.resultUrl) URL.revokeObjectURL(urlsRef.current.resultUrl);
      const previewUrl = URL.createObjectURL(blob);
      urlsRef.current.resultUrl = previewUrl;
      setResult({ blob, name, previewUrl });
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: name, sizeLabel: formatBytes(blob.size) });
      setStatus('success');
    } catch {
      setErrorMsg('Could not crop this image.');
      setStatus('error');
    }
  }

  function reset() {
    if (urlsRef.current.imgUrl) URL.revokeObjectURL(urlsRef.current.imgUrl);
    if (urlsRef.current.resultUrl) URL.revokeObjectURL(urlsRef.current.resultUrl);
    urlsRef.current = { imgUrl: '', resultUrl: '' };
    setFile(null);
    setImgUrl('');
    setSelection(null);
    setResult(null);
    setStatus('idle');
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/image-cropper" icon={Crop} breadcrumb={{ label: 'Image Cropper' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {result ? (
          <DownloadCard fileName={result.name} sizeLabel={formatBytes(result.blob.size)} previewUrl={result.previewUrl} onDownload={() => downloadBlob(result.blob, result.name)} onReset={reset} />
        ) : !file ? (
          <>
            <FileDropzone accept="image/*" label="Drop an image here" hint="Drag to select a crop area" onFiles={handleFile} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : undefined} />
            </div>
          </>
        ) : (
          <div>
            <p className="text-sm text-navy-500 dark:text-ink-500 mb-3">Drag on the image to select the area you want to keep, or use the X/Y/Width/Height fields below the image to set the crop area precisely from the keyboard.</p>
            <div
              className="relative inline-block touch-none select-none cursor-crosshair max-w-full"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <img
                ref={imgRef}
                src={imgUrl}
                alt="Crop source"
                onLoad={onImageLoad}
                className="max-w-full rounded-xl border border-navy-100 dark:border-white/10 block"
                draggable={false}
              />
              {selection && (
                <div
                  className="absolute border-2 border-electric-500 bg-electric-500/10"
                  style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}
                />
              )}
            </div>

            {displaySize.width > 0 && selection && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <label className="text-xs">
                  X (px)
                  <input type="number" min={0} max={displaySize.width} value={Math.round(selection.x)} onChange={(e) => updateSelectionField('x', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2.5 py-1.5 text-sm outline-none focus:border-electric-500" />
                </label>
                <label className="text-xs">
                  Y (px)
                  <input type="number" min={0} max={displaySize.height} value={Math.round(selection.y)} onChange={(e) => updateSelectionField('y', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2.5 py-1.5 text-sm outline-none focus:border-electric-500" />
                </label>
                <label className="text-xs">
                  Width (px)
                  <input type="number" min={0} max={displaySize.width} value={Math.round(selection.w)} onChange={(e) => updateSelectionField('w', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2.5 py-1.5 text-sm outline-none focus:border-electric-500" />
                </label>
                <label className="text-xs">
                  Height (px)
                  <input type="number" min={0} max={displaySize.height} value={Math.round(selection.h)} onChange={(e) => updateSelectionField('h', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2.5 py-1.5 text-sm outline-none focus:border-electric-500" />
                </label>
                <p className="col-span-2 sm:col-span-4 text-xs text-navy-400 dark:text-ink-500">Prefer typing over dragging? Adjust these values directly — they stay in sync with the selection box above.</p>
              </div>
            )}
            <div className="flex items-center gap-3 mt-5">
              <Button onClick={crop}>Crop image</Button>
              <Button variant="ghost" onClick={reset}>Choose another</Button>
            </div>
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : undefined} />
            </div>
          </div>
        )}
      </Card>
    </DocumentToolLayout>
  );
}
