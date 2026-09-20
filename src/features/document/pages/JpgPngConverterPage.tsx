import { FileImage } from 'lucide-react';
import { ImageTransformWorkspace } from '../components/ImageTransformWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('jpg-png-converter')!;

const article = {
  intro: 'JPG \u2194 PNG Converter is a focused tool for switching one or more images between JPG and PNG formats, without needing to pick from a longer format list.',
  whyItMatters: 'JPG and PNG are the two most commonly required formats across forms and platforms. A dedicated one-click converter between just these two is faster than a general format picker when that\u2019s all you need.',
  howItWorks: [
    'Drop in one image or several at once \u2014 JPG or PNG.',
    'The tool converts each to the other format.',
    'For JPG output, adjust the quality slider (10\u2013100%, defaults to 85%) \u2014 not shown for PNG, which is always lossless.',
    'Download each result, or "Download all" as a single ZIP for a batch.',
  ],
  examples: [
    { title: 'PNG to JPG for smaller size', body: 'Convert a PNG screenshot to JPG to reduce file size before attaching it to an email.' },
    { title: 'JPG to PNG for editing', body: 'Converting a JPG to PNG before editing in another tool avoids compounding JPG\'s lossy compression across multiple save cycles \u2014 though it won\'t recover detail already lost in the original JPG, since PNG can only preserve what\'s there, not restore what isn\'t.' },
  ],
  mistakes: [
    'Converting a PNG with a transparent background to JPG \u2014 transparency will be replaced with a solid background since JPG doesn\u2019t support it.',
  ],
  tips: [
    'Use PNG when you need transparency or crisp text/line art; use JPG for photos where smaller size matters more than exact pixel fidelity.',
    'Converting a batch of images? Drop them all in at once instead of repeating the process one at a time.',
  ],
  faqs: [
    { question: 'Which format should I choose for a scanned document?', answer: 'JPG is usually fine for a scanned photo-like page; PNG is better if the scan includes fine text or line art you want to keep crisp.' },
    { question: 'Does converting PNG to JPG lose the transparent background?', answer: 'Yes \u2014 JPG doesn\u2019t support transparency, so any transparent areas are filled with a solid background.' },
    { question: 'Can I convert several images at once?', answer: 'Yes \u2014 drop in multiple JPG or PNG images together and each converts independently, downloadable individually or all together as a ZIP.' },
  ],
  related: [
    { label: 'Image Format Converter', href: '/document-tools/image-format-converter' },
    { label: 'WEBP Converter', href: '/document-tools/webp-converter' },
  ],
};

export default function JpgPngConverterPage() {
  return (
    <ImageTransformWorkspace
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/jpg-png-converter" icon={FileImage} breadcrumb={{ label: 'JPG ↔ PNG Converter' }} toolSlug={tool.slug} article={article}
      formatOptions={['image/jpeg', 'image/png']}
      allowQuality
    />
  );
}
