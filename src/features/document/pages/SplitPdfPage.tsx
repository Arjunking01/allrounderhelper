import { useState } from 'react';
import { Scissors } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { ProcessingIndicator } from '@/components/document/ProcessingIndicator';
import { DownloadCard } from '@/components/document/DownloadCard';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob, stripExtension } from '../logic/fileUtils';

const tool = getDocumentToolBySlug('split-pdf')!;

const article = {
  intro: 'Split PDF breaks a multi-page PDF into one PDF file per page, then bundles all of those single-page files together into one ZIP download \u2014 entirely processed in your browser, so the file is never uploaded anywhere.',
  whyItMatters: 'A single PDF often mixes content you want to handle separately \u2014 individual scanned assignment pages for separate submission, one form per person out of a batch scan, or chapters you want to file individually. Splitting turns that one file into as many standalone files as it has pages, so each page can be shared, renamed, or submitted on its own.',
  howItWorks: [
    'Drop or select a PDF file.',
    'The tool reads the page count and creates a brand-new single-page PDF for every page in the original, in order.',
    'All of the resulting page files are packaged together into a single ZIP and offered as one download \u2014 there\u2019s no option to download individual pages separately from the ZIP.',
    'Each file inside the ZIP is named after your original file plus a page number, e.g. `assignment-page-1.pdf`, `assignment-page-2.pdf`, and so on.',
  ],
  examples: [
    { title: 'Separating scanned pages', body: 'Split a 5-page scanned assignment into five individual PDFs so each page can be submitted or shared as its own file, instead of the whole scan.' },
    { title: 'Splitting a batch scan', body: 'If you scanned several single-page forms together as one PDF, split it into individual files first, then rename each one before distributing it.' },
  ],
  mistakes: [
    'Splitting when Extract Pages would be simpler \u2014 if you only need a handful of specific pages kept together in one file, Extract Pages avoids downloading a ZIP of every page.',
    'Expecting an individual-page download option \u2014 the tool always delivers all pages together as one ZIP; unzip it locally to get the separate PDF files.',
    'Splitting a scanned PDF that\u2019s actually a single flattened image spanning several pages \u2014 splitting still works page-by-page, but each resulting file will be exactly as large as a full page image, so very large scans can produce a sizeable ZIP.',
  ],
  tips: [
    'If you only need a subset of pages rather than every page separated, use Extract Pages instead \u2014 it keeps your chosen pages together in one file.',
    'Rename the ZIP\u2019s extracted files after unzipping if you need a more specific naming scheme than `filename-page-N.pdf`.',
    'Very large PDFs (hundreds of pages) will take a moment to process since a new PDF is generated for every single page \u2014 the processing indicator shows while this runs.',
  ],
  faqs: [
    { question: 'Are my files uploaded to a server?', answer: 'No \u2014 splitting happens entirely in your browser using local PDF-processing libraries; the file never leaves your device or gets uploaded anywhere.' },
    { question: 'What format do I get the pages in?', answer: 'Each page becomes its own standalone PDF file, and all of them are delivered together in a single ZIP download \u2014 there\u2019s no way to download just one page individually from this tool.' },
    { question: 'Can I split only some pages instead of every page?', answer: 'Not with this tool \u2014 Split PDF always creates one file per page for the entire document. Use Extract Pages if you want to pull out a specific subset of pages into one combined file.' },
  ],
  related: [
    { label: 'Merge PDF', href: '/document-tools/merge-pdf' },
    { label: 'Extract Pages', href: '/document-tools/extract-pdf-pages' },
  ],
};

export default function SplitPdfPage() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string; pageCount: number } | null>(null);
  const { addEntry } = useToolHistory();

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
      const src = await PDFDocument.load(bytes);
      const pageCount = src.getPageCount();
      const zip = new JSZip();
      const baseName = stripExtension(file.name);

      for (let i = 0; i < pageCount; i++) {
        const single = await PDFDocument.create();
        const [page] = await single.copyPages(src, [i]);
        single.addPage(page);
        const pageBytes = await single.save();
        zip.file(`${baseName}-page-${i + 1}.pdf`, pageBytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const name = `${baseName}-split.zip`;
      setResult({ blob: zipBlob, name, pageCount });
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: name, sizeLabel: formatBytes(zipBlob.size) });
      setStatus('success');
    } catch {
      setErrorMsg('Could not split this PDF. It may be encrypted or corrupted.');
      setStatus('error');
    }
  }

  function reset() {
    setResult(null);
    setStatus('idle');
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/split-pdf" icon={Scissors} breadcrumb={{ label: 'Split PDF' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-navy-600 dark:text-ink-300">
              Split into <span className="font-semibold">{result.pageCount}</span> individual page{result.pageCount !== 1 ? 's' : ''}, packaged as a ZIP.
            </p>
            <DownloadCard fileName={result.name} sizeLabel={formatBytes(result.blob.size)} onDownload={() => downloadBlob(result.blob, result.name)} onReset={reset} />
          </div>
        ) : (
          <>
            <FileDropzone accept="application/pdf" label="Drop a PDF here" hint="Splits into one PDF per page" onFiles={processFile} />
            <div className="mt-4">
              <ProcessingIndicator status={status} message={status === 'error' ? errorMsg : 'Splitting pages...'} />
            </div>
          </>
        )}
      </Card>
    </DocumentToolLayout>
  );
}
