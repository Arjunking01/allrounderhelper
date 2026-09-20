import { FileOutput } from 'lucide-react';
import { PdfPageWorkspace } from '../components/PdfPageWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('extract-pdf-pages')!;

const article = {
  intro: 'Extract Pages pulls specific pages out of a PDF and combines just those into a brand-new document, without touching the rest of the file.',
  whyItMatters: 'Often you only need a handful of pages from a longer PDF \u2014 a couple of relevant pages from a textbook chapter or a subset of a scanned form \u2014 rather than the whole thing.',
  howItWorks: [
    'Select a PDF file \u2014 every page starts selected by default.',
    'Click any page you don\u2019t want to deselect it, leaving only the pages you want to keep marked.',
    'Export the selected pages as a new PDF, in their original page order.',
  ],
  examples: [
    { title: 'Pulling relevant pages', body: 'Open a 40-page lecture PDF, deselect everything except the 3 pages covering one topic, and export just those to share separately.' },
    { title: 'Removing most of a document', body: 'To strip a large PDF down to just a title page and a summary, deselect only those two and export \\u2014 since every page starts selected, keeping a small set means deselecting the majority rather than selecting from scratch.' },
  ],
  mistakes: [
    'Using Split PDF when you only need a few pages together \u2014 Extract Pages gives you one combined file instead of a ZIP of every page.',
    'Forgetting that every page starts selected \u2014 if you only want a couple of pages, you need to deselect the rest rather than click to select from a blank slate.',
  ],
  tips: [
    'Double-check page numbers against the original before extracting \u2014 page numbering can shift if the PDF has unnumbered cover pages.',
    'Since everything starts selected, extracting most of a document (removing just a few pages) is usually faster than extracting a small handful.',
  ],
  faqs: [
    { question: 'What\u2019s the difference between this and Split PDF?', answer: 'Split PDF breaks every page into its own file; Extract Pages lets you choose specific pages and combines just those into one new document.' },
    { question: 'Does the original PDF get modified?', answer: 'No \u2014 the original file stays untouched. Extract Pages creates a new document from your selection.' },
    { question: 'What order do the extracted pages come out in?', answer: 'Always their original order in the source document, regardless of the order you clicked them in \u2014 not a custom order based on your selection sequence.' },
  ],
  related: [
    { label: 'Split PDF', href: '/document-tools/split-pdf' },
    { label: 'Delete Pages', href: '/document-tools/delete-pdf-pages' },
    { label: 'Merge PDF', href: '/document-tools/merge-pdf' },
  ],
};

export default function ExtractPdfPagesPage() {
  return (
    <PdfPageWorkspace
      mode="extract"
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/extract-pdf-pages" icon={FileOutput} breadcrumb={{ label: 'Extract Pages' }} toolSlug={tool.slug} article={article}
    />
  );
}
