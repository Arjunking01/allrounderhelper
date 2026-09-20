import { FileImage } from 'lucide-react';
import { ImageTransformWorkspace } from '../components/ImageTransformWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('webp-converter')!;

const article = {
  intro: 'WEBP Converter converts JPG or PNG images to WEBP, or converts WEBP images back to JPG or PNG \u2014 one image or several at once, with an adjustable quality setting.',
  whyItMatters: 'WEBP files are usually smaller than equivalent JPG or PNG files at similar quality, which is useful for web use \u2014 but not every platform or older app accepts WEBP, so converting in either direction is often necessary.',
  howItWorks: [
    'Drop in one image or several at once \u2014 JPG, PNG, or WEBP, batch conversion is supported.',
    'Choose the target format.',
    'For JPG or WEBP output, adjust the quality slider (10\u2013100%, defaults to 85%) \u2014 hidden when converting to PNG, which is always lossless.',
    'Download each file individually, or "Download all" to get every result as one ZIP.',
  ],
  examples: [
    { title: 'Converting WEBP for compatibility', body: 'Convert a WEBP image downloaded from a website into JPG so it can be used in an app that doesn\u2019t support WEBP.' },
    { title: 'Batch-converting product photos', body: 'Drop in a folder\u2019s worth of JPG product photos and convert them all to WEBP at once for a faster-loading web page.' },
  ],
  mistakes: [
    'Assuming every platform accepts WEBP \u2014 some older tools and forms still only accept JPG or PNG.',
    'Not adjusting the quality slider when converting to WEBP for the web \u2014 lowering it usually gives a meaningfully smaller file with little visible difference.',
  ],
  tips: [
    'Convert to WEBP for web use where smaller file size matters; convert to JPG or PNG when compatibility with older software matters more.',
    'Converting several images at once? Drop them all in together instead of repeating the process one file at a time.',
  ],
  faqs: [
    { question: 'Is WEBP supported everywhere?', answer: 'Most modern browsers and platforms support WEBP, but some older or specialized software still expects JPG or PNG.' },
    { question: 'Does the conversion happen on a server?', answer: 'No \u2014 everything runs locally in your browser, so the image is never uploaded anywhere.' },
    { question: 'Will converting to WEBP always shrink the file?', answer: 'Usually, but not always \u2014 it depends on the original image content. Simple graphics sometimes compress better as PNG. The quality slider also affects final size directly.' },
  ],
  related: [
    { label: 'Image Format Converter', href: '/document-tools/image-format-converter' },
    { label: 'JPG \u2194 PNG Converter', href: '/document-tools/jpg-png-converter' },
  ],
};

export default function WebpConverterPage() {
  return (
    <ImageTransformWorkspace
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/webp-converter" icon={FileImage} breadcrumb={{ label: 'WEBP Converter' }} toolSlug={tool.slug} article={article}
      formatOptions={['image/webp', 'image/jpeg', 'image/png']}
      allowQuality
    />
  );
}
