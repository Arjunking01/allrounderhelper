import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, File as FileIcon, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { clsx } from '@/lib/utils/clsx';
import { validateFile, type Attachment } from '../logic/attachmentTypes';
import { extractAttachmentText, renderScannedPdfPages } from '../logic/attachmentTextExtraction';

/** Reads an image file as a base64 data URL — this (not the cheap blob: previewUrl, which
 *  is session-local and can never be sent over the network) is what actually gets sent to a
 *  vision-capable provider. Rejects on read failure so the caller can mark the attachment
 *  'error' instead of silently leaving dataUrl undefined and appearing to work. */
function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function iconFor(type: string) {
  if (type.startsWith('image/')) return ImageIcon;
  if (type === 'application/pdf' || type.includes('word')) return FileText;
  return FileIcon;
}

export function AttachmentBar({ attachments, onChange }: { attachments: Attachment[]; onChange: Dispatch<SetStateAction<Attachment[]>> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { showToast } = useToast();
  // PHASE 1.7 — ids removed while their background extraction/rasterization is still running.
  // The existing functional-update pattern below already prevents a finished extraction from
  // resurrecting a removed attachment (onChange((current) => current.map(...)) is a no-op if
  // the id is gone) — this ref is purely so that in-flight work for a removed id can check
  // `shouldAbort` between pages and stop doing wasted work, not to prevent a correctness bug.
  const removedIdsRef = useRef<Set<string>>(new Set());

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const documentsToExtract: { id: string; file: File }[] = [];
    const imagesToRead: { id: string; file: File }[] = [];
    const next: Attachment[] = [...attachments];
    for (const file of list) {
      const err = validateFile(file);
      if (err) {
        showToast(err, 'error');
        continue;
      }
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith('image/');
      next.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
        // Both images and documents start as "reading": images still need their base64
        // dataUrl (the thing actually sent to a vision provider) read in the background,
        // and documents need text extraction. Neither is genuinely "ready" until that
        // background read/extraction resolves — marking images ready immediately (as this
        // used to do) let the UI claim an attachment was usable before it had any sendable
        // content at all.
        status: 'reading',
      });
      if (isImage) imagesToRead.push({ id, file });
      else documentsToExtract.push({ id, file });
    }
    onChange(next);

    // Read image bytes to a base64 data URL in the background so a large image doesn't
    // block the UI. Each file resolves independently via a functional update, same pattern
    // as document text extraction below, so a slower file resolving after the user has
    // added/removed others won't clobber those changes.
    for (const { id, file } of imagesToRead) {
      readImageAsDataUrl(file)
        .then((dataUrl) => {
          onChange((current) => current.map((a) => (a.id === id ? { ...a, dataUrl, status: 'ready' } : a)));
        })
        .catch(() => {
          onChange((current) => current.map((a) => (a.id === id ? { ...a, status: 'error', extractionReason: 'failed' } : a)));
        });
    }

    // Extract text in the background so attaching a large PDF doesn't block the UI.
    // Each file resolves independently via a functional update, so a slower file
    // resolving after the user has added/removed others won't clobber those changes.
    for (const { id, file } of documentsToExtract) {
      const shouldAbort = () => removedIdsRef.current.has(id);
      extractAttachmentText(file, shouldAbort).then(async ({ text, reason }) => {
        // A PDF with no extractable text layer is the common shape of a scanned/photographed
        // document — rather than stopping at an honest "no text found" error, try rasterizing
        // its pages so a vision-capable provider can look at them instead (see
        // renderScannedPdfPages). Only attempted for PDFs specifically: DOCX/TXT/MD files with
        // no text genuinely have nothing to fall back to.
        if (shouldAbort()) return; // removed while text extraction was still running
        if (!text && reason === 'empty' && file.type === 'application/pdf') {
          const { images, truncated } = await renderScannedPdfPages(file, shouldAbort);
          if (images.length > 0) {
            onChange((current) =>
              current.map((a) => (a.id === id ? { ...a, pageImages: images, pageImagesTruncated: truncated, hadRasterizedPages: true, status: 'ready' } : a))
            );
            return;
          }
        }
        onChange((current) => current.map((a) => (a.id === id ? { ...a, text, extractionReason: reason, status: text ? 'ready' : 'error' } : a)));
      });
    }
  }

  function remove(id: string) {
    removedIdsRef.current.add(id); // let any still-running extraction/rasterization for this id stop early
    const target = attachments.find((a) => a.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a) => {
            const Icon = iconFor(a.type);
            return (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-2 pr-1 py-1 text-xs">
                {a.previewUrl ? (
                  <img src={a.previewUrl} alt={a.name} className="h-6 w-6 rounded object-cover" />
                ) : a.pageImages?.length ? (
                  // Scanned PDF successfully rasterized into page images — distinct from the
                  // plain FileText icon so the user can tell this went through the image
                  // fallback path (and, if truncated, that only part of the document was used).
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        a.pageImagesTruncated
                          ? `Converted the first ${a.pageImages!.length} page(s) of this scanned PDF to images for the AI to view — the rest of the document wasn't included.`
                          : `Converted ${a.pageImages!.length} scanned page(s) to images for the AI to view.`,
                        'info'
                      )
                    }
                    title="Scanned PDF — converted to page images for a vision-capable AI"
                    aria-label="Scanned PDF converted to page images — tap for details"
                    className="flex shrink-0"
                  >
                    <ImageIcon size={14} className="text-electric-500" />
                  </button>
                ) : a.status === 'reading' ? (
                  <Loader2 size={14} className="text-navy-400 animate-spin" aria-label="Reading file" />
                ) : a.status === 'error' ? (
                  // A hover `title` alone is invisible on touch devices — nothing to hover.
                  // Making this a tappable button surfaces the same guidance as a toast, so a
                  // phone user actually learns *why* the file failed and what to do about it,
                  // not just that something went wrong.
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        a.extractionReason === 'empty'
                          ? 'No text found — if this is a scanned/photographed PDF, try the OCR Text Extraction tool first, then attach the text result.'
                          : "Couldn't read this file — it may be corrupted or password-protected.",
                        'error'
                      )
                    }
                    title={
                      a.extractionReason === 'empty'
                        ? "No text found — if this is a scanned/photographed PDF, try the OCR Text Extraction tool first, then attach the .txt result"
                        : "Couldn't read this file — it may be corrupted or password-protected"
                    }
                    aria-label={
                      a.extractionReason === 'empty'
                        ? "No text found in this file — tap for guidance on scanned PDFs"
                        : "Couldn't read this file — tap for details"
                    }
                    className="flex shrink-0"
                  >
                    <AlertCircle size={14} className="text-amber-500" />
                  </button>
                ) : (
                  <Icon size={14} className="text-navy-400" />
                )}
                <span className="max-w-[120px] truncate">{a.name}</span>
                <span className="text-navy-400">{(a.size / 1024).toFixed(0)}KB</span>
                <button onClick={() => remove(a.id)} aria-label={`Remove ${a.name}`} className="p-0.5 rounded hover:bg-red-500/10 text-navy-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={clsx('inline-flex', dragging && 'ring-2 ring-electric-500 rounded-lg')}
      >
        <button onClick={() => inputRef.current?.click()} aria-label="Attach file" className="flex items-center gap-1.5 text-xs text-navy-500 dark:text-ink-400 hover:text-electric-500 px-2.5 py-2.5 sm:py-1.5 min-h-9 sm:min-h-0">
          <Paperclip size={14} /> Attach
        </button>
        <input ref={inputRef} type="file" multiple tabIndex={-1} className="sr-only" onChange={(e) => e.target.files && addFiles(e.target.files)} accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.md,.docx" />
      </div>
    </div>
  );
}
