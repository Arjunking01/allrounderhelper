import { useCallback, useId, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { clsx } from '@/lib/utils/clsx';

interface FileDropzoneProps {
  accept: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFiles: (files: File[]) => void;
}

export function FileDropzone({ accept, multiple = false, label = 'Drop files here', hint, onFiles }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFiles(multiple ? Array.from(fileList) : [fileList[0]]);
    },
    [multiple, onFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={clsx(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors',
        isDragging
          ? 'border-electric-500 bg-electric-500/5'
          : 'border-navy-200 dark:border-white/15 hover:border-electric-400'
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white">
        <UploadCloud size={22} />
      </div>
      <div>
        <p className="font-medium text-navy-800 dark:text-ink-100">{label}</p>
        <p className="text-sm text-navy-500 dark:text-ink-500 mt-0.5">
          or <span className="text-electric-500 font-medium">browse files</span>
          {hint && <span> · {hint}</span>}
        </p>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
