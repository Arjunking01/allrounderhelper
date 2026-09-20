import { RefreshCw } from 'lucide-react';
import { ImageTransformWorkspace } from '../components/ImageTransformWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('image-format-converter')!;

const article = {
  intro: 'Image Format Converter switches one or more images between JPG, PNG, and WEBP formats directly in your browser, with an adjustable quality setting for JPG and WEBP output.',
  whyItMatters: 'Different platforms and forms expect different image formats \u2014 some require JPG, others PNG for transparency, others WEBP for smaller file sizes on the web. Converting avoids compatibility errors on upload, and being able to convert a whole batch at once saves doing it one file at a time.',
  howItWorks: [
    'Drop in one image or several at once \u2014 batch conversion is supported.',
    'Choose the target format \u2014 JPG, PNG, or WEBP.',
    'For JPG or WEBP output, adjust the quality slider (10\u2013100%, defaults to 85%) \u2014 it\u2019s hidden for PNG, which is always lossless regardless of the setting.',
    'Download each converted file individually, or use "Download all" to get every result as a single ZIP.',
  ],
  examples: [
    { title: 'Fixing an unsupported format', body: 'Convert a WEBP image to JPG for a form or platform that doesn\u2019t accept WEBP uploads.' },
    { title: 'Batch-converting a folder of screenshots', body: 'Drop in a dozen PNG screenshots, convert them all to JPG at once, and download the whole set as a ZIP instead of converting one by one.' },
  ],
  mistakes: [
    'Converting a PNG with transparency to JPG, which doesn\u2019t support transparency and will fill it with a solid background instead.',
    'Assuming the quality slider affects a PNG conversion \u2014 it only applies to JPG/WEBP output; PNG is always encoded losslessly.',
  ],
  tips: [
    'Keep transparent images in PNG or WEBP; use JPG for photos where transparency isn\u2019t needed and smaller size matters.',
    'Drop in multiple images at once if you need to convert a whole batch \u2014 no need to repeat the process per file.',
  ],
  faqs: [
    { question: 'Does converting reduce image quality?', answer: 'Converting to JPG or WEBP uses the quality slider (85% by default) \u2014 lower it for a smaller file, raise it for higher fidelity. PNG output is always lossless, unaffected by the slider.' },
    { question: 'Are my images uploaded anywhere?', answer: 'No — the conversion happens entirely in your browser. The image never leaves your device.' },
    { question: 'Can I convert multiple images at once?', answer: 'Yes \u2014 drop in several images together and each converts independently. Download them one at a time or all together as a ZIP.' },
  ],
  related: [
    { label: 'JPG \u2194 PNG Converter', href: '/document-tools/jpg-png-converter' },
    { label: 'WEBP Converter', href: '/document-tools/webp-converter' },
  ],
};

export default function ImageFormatConverterPage() {
  return (
    <ImageTransformWorkspace
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/image-format-converter" icon={RefreshCw} breadcrumb={{ label: 'Image Format Converter' }} toolSlug={tool.slug} article={article}
      formatOptions={['image/jpeg', 'image/png', 'image/webp']}
      allowQuality
    />
  );
}
