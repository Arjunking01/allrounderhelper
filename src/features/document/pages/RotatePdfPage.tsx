import { RotateCw } from 'lucide-react';
import { PdfPageWorkspace } from '../components/PdfPageWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('rotate-pdf')!;

const article = {
  intro: 'Rotate PDF fixes pages that are sideways or upside down. Every page renders as a thumbnail with its own rotate button \u2014 click it to cycle that page 90\u00b0 at a time, then export the corrected document, all in your browser.',
  whyItMatters: 'Scanned documents are often rotated incorrectly depending on how the page was fed through a scanner or photographed, and it\u2019s common for only some pages to be affected. Fixing orientation page-by-page before sharing or submitting makes the document actually readable without forcing every page through the same rotation.',
  howItWorks: [
    'Select a PDF file \u2014 every page renders as a thumbnail in a grid.',
    'Click the rotate button in the corner of a page to turn it 90\u00b0 clockwise; click it again to reach 180\u00b0, again for 270\u00b0, and a fourth time to return to the original orientation.',
    'Rotate as many or as few pages as you need \u2014 there\u2019s no single "rotate whole document" switch, so if every page needs the same fix, click each page\u2019s rotate button the same number of times.',
    'Click "Apply rotation" to generate the corrected document, then download it.',
  ],
  examples: [
    { title: 'Fixing a scanned document', body: 'Rotate every page 90\u00b0 clockwise (one click each) when a whole document was scanned sideways, so it reads normally without tilting your screen.' },
    { title: 'Fixing one sideways page', body: 'In an otherwise correctly-scanned document, click the rotate button on just the one page that came out sideways, leaving the rest untouched.' },
  ],
  mistakes: [
    'Assuming there\u2019s a bulk "rotate whole document" option \u2014 there isn\u2019t; rotation is applied per page via each thumbnail\u2019s own rotate button, so a full-document fix means clicking through every page.',
    'Clicking the rotate button one time too many \u2014 each click adds 90\u00b0 and wraps back to 0\u00b0 after four clicks, so it\u2019s easy to overshoot past the angle you wanted.',
  ],
  tips: [
    'Check each page after rotating a mixed-orientation scan \u2014 different pages may need a different number of clicks, since rotation is set independently per page.',
    'The thumbnail preview updates immediately as you click, so you can confirm the orientation looks right before applying the rotation to the whole document.',
  ],
  faqs: [
    { question: 'Can I rotate just one page in a multi-page PDF?', answer: 'Yes \u2014 rotation is applied per page by default; click a specific page\u2019s rotate button and leave the rest alone.' },
    { question: 'Does rotating affect the PDF\u2019s text or quality?', answer: 'No \u2014 rotation only changes page orientation metadata; the page content itself is untouched.' },
    { question: 'How do I rotate a page 180\u00b0 or 270\u00b0?', answer: 'Click the rotate button multiple times \u2014 each click adds 90\u00b0, so two clicks gives 180\u00b0 and three clicks gives 270\u00b0. A fourth click returns the page to its original orientation.' },
    { question: 'Is there a way to rotate every page at once?', answer: 'Not as a single switch \u2014 you click each page\u2019s rotate button individually, which does mean more clicks for a full-document rotation but allows different pages to end up at different angles.' },
  ],
  related: [
    { label: 'Rearrange Pages', href: '/document-tools/rearrange-pdf' },
    { label: 'Delete Pages', href: '/document-tools/delete-pdf-pages' },
  ],
};

export default function RotatePdfPage() {
  return (
    <PdfPageWorkspace
      mode="rotate"
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/rotate-pdf" icon={RotateCw} breadcrumb={{ label: 'Rotate PDF' }} toolSlug={tool.slug} article={article}
    />
  );
}
