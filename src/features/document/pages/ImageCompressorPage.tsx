import { ImageIcon } from 'lucide-react';
import { ImageTransformWorkspace } from '../components/ImageTransformWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('image-compressor')!;

const article = {
  intro: 'Image Compressor shrinks JPG or WEBP file size using an adjustable quality slider, all processed in your browser with no upload. One image or several at once.',
  whyItMatters: 'Large image files slow down uploads and can exceed size limits on forms, portals, or email attachments. Compressing reduces size while keeping the image visually usable.',
  howItWorks: [
    'Drop in one image or several at once.',
    'Adjust the quality slider (defaults to 70%) to balance file size against visual quality.',
    'Preview the result and download the compressed image, or "Download all" as a ZIP for a batch.',
  ],
  examples: [
    { title: 'Meeting an upload size limit', body: 'Compress a large photo before uploading it to a portal that rejects files over a certain size.' },
    { title: 'Finding the right quality setting', body: 'Start around 70% and preview the result \u2014 a photo with lots of fine detail or text may start showing visible blur below 50%, while a simple photo can often drop to 40\u201350% with little visible difference. There\'s no universal "correct" number; it depends on the source image.' },
  ],
  mistakes: [
    'Compressing too aggressively for images with fine text or detail, which can become blurry or hard to read.',
    'Dropping in a PNG expecting it to stay a PNG \u2014 this tool only outputs JPG or WEBP, so a PNG input gets converted (and any transparency is lost) as part of compressing it. If you need to shrink a PNG while keeping it a lossless PNG, this isn\u2019t the right tool for that.',
  ],
  tips: [
    'Preview the compressed result before downloading \u2014 find the lowest file size that still looks acceptable for your use case.',
    'Compressing several images at once? Drop them all in together instead of repeating the process one file at a time.',
  ],
  faqs: [
    { question: 'Does compressing reduce image dimensions too?', answer: 'No \u2014 compression reduces file size by adjusting quality, not the pixel dimensions. Use Image Resizer to change dimensions.' },
    { question: 'Which format compresses best?', answer: 'JPG and WEBP typically shrink the most since they support lossy compression. This tool only offers JPG/WEBP output for that reason \u2014 PNG isn\u2019t a compression target here since its lossless nature limits how much a quality slider can help.' },
    { question: 'What happens if I compress a PNG?', answer: 'The output converts to JPG or WEBP \u2014 this tool doesn\u2019t produce compressed PNG output. If your PNG has transparency, that transparency will be lost in the conversion.' },
  ],
  related: [
    { label: 'Image Resizer', href: '/document-tools/image-resizer' },
    { label: 'Image Format Converter', href: '/document-tools/image-format-converter' },
  ],
};

export default function ImageCompressorPage() {
  return (
    <ImageTransformWorkspace
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/image-compressor" icon={ImageIcon} breadcrumb={{ label: 'Image Compressor' }} toolSlug={tool.slug} article={article}
      formatOptions={['image/jpeg', 'image/webp']}
      allowQuality
      defaultQuality={0.7}
    />
  );
}
