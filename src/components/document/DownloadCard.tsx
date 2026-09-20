import { motion } from 'framer-motion';
import { Download, RotateCcw, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DownloadCardProps {
  fileName: string;
  sizeLabel?: string;
  onDownload: () => void;
  onReset: () => void;
  previewUrl?: string;
}

export function DownloadCard({ fileName, sizeLabel, onDownload, onReset, previewUrl }: DownloadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
    >
      {previewUrl ? (
        <img src={previewUrl} alt={`Preview of ${fileName}`} className="h-16 w-16 rounded-xl object-cover border border-navy-100 dark:border-white/10 shrink-0" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
          <FileCheck2 size={24} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-navy-900 dark:text-ink-100 truncate">{fileName}</p>
        {sizeLabel && <p className="text-sm text-navy-500 dark:text-ink-500">{sizeLabel}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" icon={<Download size={14} />} onClick={onDownload}>Download</Button>
        <Button size="sm" variant="outline" icon={<RotateCcw size={14} />} onClick={onReset}>Start over</Button>
      </div>
    </motion.div>
  );
}
