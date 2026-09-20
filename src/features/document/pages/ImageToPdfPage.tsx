import { useEffect, useRef, useState } from 'react';
import { ImagePlus, ArrowUp, ArrowDown, X } from 'lucide-react';
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

const tool = getDocumentToolBySlug('image-to-pdf')!;

const article = {
  intro: 'Image to PDF combines one or more images into a single PDF document, in whatever order you arrange them \u2014 useful for turning photos or scans into one shareable file.',
  whyItMatters: 'Many forms and portals only accept a single PDF, not a folder of separate photos. Combining images into one PDF is often the fastest way to meet that requirement.',
  howItWorks: [
    'Select one or more images (JPG or PNG).',
    'Arrange them in the order you want them to appear.',
    'Convert to a single PDF and download.',
  ],
  examples: [
    { title: 'Submitting a photographed assignment', body: 'Photograph each handwritten page, then combine all the photos into one PDF for upload to a portal that only accepts a single file.' },
    { title: 'Combining mixed sources', body: 'Some pages photographed as JPG and others saved as PNG screenshots can be combined into the same PDF in one pass \u2014 the tool doesn\'t require every image to share the same format, just JPG or PNG individually.' },
  ],
  mistakes: [
    'Uploading blurry or poorly lit photos \u2014 the PDF is only as readable as the source images.',
    'Trying to add a WEBP or other unsupported format directly \u2014 convert it to JPG or PNG first with WEBP Converter, since only those two formats are accepted here.',
  ],
  tips: [
    'Crop or straighten photos beforehand with Image Cropper for a cleaner result.',
  ],
  faqs: [
    { question: 'What image formats are supported?', answer: 'JPG and PNG. If you have a WEBP or other format, convert it to JPG or PNG first with WEBP Converter or Image Format Converter.' },
    { question: 'Can I change the page order after adding images?', answer: 'Yes — rearrange images before converting so the PDF pages come out in the order you intend.' },
    { question: 'Is there a limit to how many images I can combine?', answer: 'You can add as many images as you need; very large batches will just take a little longer to process since everything runs in your browser.' },
  ],
  related: [
    { label: 'PDF to Image', href: '/document-tools/pdf-to-image' },
    { label: 'Image Cropper', href: '/document-tools/image-cropper' },
    { label: 'WEBP Converter', href: '/document-tools/webp-converter' },
  ],
};

interface ImageEntry {
  file: File;
  previewUrl: string;
}

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const { addEntry } = useToolHistory();
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => () => {
    for (const img of imagesRef.current) URL.revokeObjectURL(img.previewUrl);
  }, []);

  function addFiles(files: File[]) {
    const valid = files.filter((f) => f.type === 'image/jpeg' || f.type === 'image/png');
    if (valid.length < files.length) {
      setErrorMsg('Only JPG and PNG images are supported — other files were skipped.');
      setStatus('error');
    } else {
      setErrorMsg('');
      setStatus('idle');
    }
    setImages((prev) => [...prev, ...valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function convert() {
    if (images.length === 0) return;
    setStatus('processing');
    try {
      const doc = await PDFDocument.create();
      for (const { file } of images) {
        const bytes = await file.arrayBuffer();
        const isPng = file.type === 'image/png';
        const embedded = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const page = doc.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const name = 'images.pdf';
      setResult({ blob, name });
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: name, sizeLabel: formatBytes(blob.size) });
      setStatus('success');
    } catch {
      setErrorMsg('Could not convert these images. Only JPG and PNG are supported.');
      setStatus('error');
    }
  }

  function reset() {
    setImages([]);
    setResult(null);
    setStatus('idle');
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/image-to-pdf" icon={ImagePlus} breadcrumb={{ label: 'Image to PDF' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {result ? (
          <DownloadCard fileName={result.name} sizeLabel={formatBytes(result.blob.size)} onDownload={() => downloadBlob(result.blob, result.name)} onReset={reset} />
        ) : (
          <>
            <FileDropzone accept="image/jpeg,image/png" multiple label="Drop images here" hint="JPG or PNG" onFiles={addFiles} />

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {images.map((img, i) => (
                  <div key={img.previewUrl} className="relative rounded-xl border border-navy-100 dark:border-white/10 p-2">
                    <img src={img.previewUrl} alt={img.file.name} className="w-full aspect-square object-cover rounded-lg" />
                    <p className="text-center text-xs text-navy-500 dark:text-ink-500 mt-1">Page {i + 1}</p>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-navy-900/90 shadow disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move later" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-navy-900/90 shadow disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                      <button onClick={() => removeImage(i)} aria-label="Remove image" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-navy-900/90 shadow text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <Button disabled={images.length === 0} onClick={convert}>Convert to PDF</Button>
              {images.length > 0 && <Button variant="ghost" onClick={reset}>Clear</Button>}
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
