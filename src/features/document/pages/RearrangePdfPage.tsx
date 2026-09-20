import { ArrowUpDown } from 'lucide-react';
import { PdfPageWorkspace } from '../components/PdfPageWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('rearrange-pdf')!;

const article = {
  intro: 'Rearrange Pages lets you reorder the pages of a PDF using simple move-up and move-down arrow buttons on each page thumbnail, then export the result as a new document \u2014 no drag-and-drop needed, and everything runs locally in your browser.',
  whyItMatters: 'Scanned or exported documents don\u2019t always come out in the right order \u2014 a duplex scanner can interleave pages unexpectedly, or a document assembled from several sources can end up out of sequence. Fixing the order without specialized desktop software makes a document usable before you submit or share it.',
  howItWorks: [
    'Select a PDF file \u2014 every page renders as a thumbnail in a grid so you can see the current order at a glance.',
    'Use the up/down arrow buttons in the corner of each thumbnail to move that page earlier or later in the sequence, one position at a time.',
    'The first page\u2019s "move earlier" button and the last page\u2019s "move later" button are disabled, since there\u2019s nowhere further to move.',
    'Click "Save new order" to generate the reordered document, then download it.',
  ],
  examples: [
    { title: 'Reordering scanned pages', body: 'Fix a scan where pages came out of sequence \u2014 for example page 3 scanned before page 2 \u2014 before submitting the file.' },
    { title: 'Moving a cover page to the front', body: 'A merged document has its cover page buried in the middle \u2014 move it to the very front using the up-arrow button repeatedly.' },
  ],
  mistakes: [
    'Forgetting to double check the final order before exporting \u2014 review the full thumbnail sequence, not just the pages you moved, since moving one page shifts every page around it.',
    'Trying to move a page past the first or last position \u2014 the boundary arrow buttons are intentionally disabled rather than wrapping around.',
  ],
  tips: [
    'Combine with Rotate PDF first if some pages also need orientation fixed \u2014 rearrange after rotation is applied, since each tool exports a separate result.',
    'For a large page count, moving a page a long distance means clicking the arrow repeatedly \u2014 plan the target position before starting rather than moving one page at a time between many others.',
  ],
  faqs: [
    { question: 'Can I remove a page while reordering?', answer: 'This tool is for reordering only \u2014 use Delete Pages separately to remove pages, since the arrow controls here only move pages, they don\u2019t have a remove option.' },
    { question: 'Does the original file get changed?', answer: 'No \u2014 reordering exports a new PDF; your original upload stays untouched and is never modified in place.' },
    { question: 'Can I reorder a very large PDF?', answer: 'Yes, though documents with many pages take a little longer to process since everything runs in your browser rather than on a server, and each thumbnail has to be rendered individually.' },
    { question: 'Is there a drag-and-drop option?', answer: 'No \u2014 pages are reordered using the up/down arrow buttons on each thumbnail rather than dragging, which keeps the reordering precise on both desktop and touch devices.' },
  ],
  related: [
    { label: 'Rotate PDF', href: '/document-tools/rotate-pdf' },
    { label: 'Delete Pages', href: '/document-tools/delete-pdf-pages' },
  ],
};

export default function RearrangePdfPage() {
  return (
    <PdfPageWorkspace
      mode="rearrange"
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/rearrange-pdf" icon={ArrowUpDown} breadcrumb={{ label: 'Rearrange Pages' }} toolSlug={tool.slug} article={article}
    />
  );
}
