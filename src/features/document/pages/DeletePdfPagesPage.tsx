import { FileMinus } from 'lucide-react';
import { PdfPageWorkspace } from '../components/PdfPageWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('delete-pdf-pages')!;

const article = {
  intro: 'Delete Pages removes one or more unwanted pages from a PDF and gives you back a cleaned-up document with the rest intact \u2014 processed entirely in your browser, with a visual thumbnail of every page so you can confirm what you\u2019re removing.',
  whyItMatters: 'A PDF often has a blank page, a duplicate scan, or an irrelevant cover sheet mixed in. Removing just those pages is faster than rebuilding the document from scratch, and you don\u2019t need separate PDF-editing software to do it.',
  howItWorks: [
    'Select a PDF file \u2014 every page renders as a thumbnail so you can see exactly what you\u2019re working with.',
    'Click on the pages you want to remove; selected pages are visually marked.',
    'Click "Delete selected pages" to generate the resulting document.',
    'Download the cleaned-up PDF with the marked pages gone and every other page untouched and in its original order.',
  ],
  examples: [
    { title: 'Removing a blank scan', body: 'Delete a blank page that got scanned by accident before submitting the final document.' },
    { title: 'Removing a cover sheet', body: 'Strip out a fax cover sheet or scanner cover page before submitting a multi-page assignment.' },
  ],
  mistakes: [
    'Deleting the wrong page due to miscounting \u2014 double-check page numbers against the thumbnail preview before confirming, since page order isn\u2019t always obvious from a long document.',
    'Trying to delete every page \u2014 the tool requires at least one page to remain in the resulting document; you can\u2019t select all pages for deletion.',
  ],
  tips: [
    'If you need to keep only a small subset instead of removing a few pages, Extract Pages may be quicker \u2014 select what to keep instead of what to remove.',
    'Use the thumbnail preview to confirm content, not just page numbers \u2014 it\u2019s easy to miscount in a long or unpaginated scan.',
  ],
  faqs: [
    { question: 'Can I undo a deletion after downloading?', answer: 'No \u2014 re-upload your original file if you need to start over, since the tool works on the file you provide each time and doesn\u2019t keep a copy on any server.' },
    { question: 'Can I delete multiple pages at once?', answer: 'Yes \u2014 select as many pages as you need to remove before generating the cleaned-up document, all in a single pass.' },
    { question: 'Does deleting pages affect the quality of the rest?', answer: 'No \u2014 the remaining pages are copied over untouched; only the selected pages are removed from the document.' },
    { question: 'Can I delete every page in the PDF?', answer: 'No \u2014 the tool requires at least one page to remain, since a zero-page PDF isn\u2019t a valid document. Deselect at least one page before generating the result.' },
  ],
  related: [
    { label: 'Extract Pages', href: '/document-tools/extract-pdf-pages' },
    { label: 'Rearrange Pages', href: '/document-tools/rearrange-pdf' },
  ],
};

export default function DeletePdfPagesPage() {
  return (
    <PdfPageWorkspace
      mode="delete"
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/delete-pdf-pages" icon={FileMinus} breadcrumb={{ label: 'Delete Pages' }} toolSlug={tool.slug} article={article}
    />
  );
}
