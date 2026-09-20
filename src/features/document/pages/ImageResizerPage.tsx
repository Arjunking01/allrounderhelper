import { Layers } from 'lucide-react';
import { ImageTransformWorkspace } from '../components/ImageTransformWorkspace';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';

const tool = getDocumentToolBySlug('image-resizer')!;

const article = {
  intro: 'Image Resizer changes an image to specific pixel dimensions, with an option to lock the aspect ratio so it doesn\u2019t stretch or distort.',
  whyItMatters: 'Many forms, profile photos, and upload fields require an image within specific dimensions. Resizing beforehand avoids upload errors or an image being auto-cropped in an unexpected way.',
  howItWorks: [
    'Select an image.',
    'Enter target width and height, or lock the aspect ratio and set one dimension.',
    'Download the resized image.',
  ],
  examples: [
    { title: 'Meeting a profile photo requirement', body: 'Resize a photo to exact pixel dimensions required by an application form or ID upload.' },
    { title: 'Downscaling a large photo camera shot', body: 'A phone photo at 4000\u00d73000 pixels is far larger than most forms need \u2014 resizing down to something like 1200\u00d7900 with aspect ratio locked keeps the proportions correct while cutting the file size and dimensions to something a form will actually accept.' },
  ],
  mistakes: [
    'Unlocking the aspect ratio and typing dimensions that don\'t match the original proportions, which stretches or squashes the image.',
    'Enlarging a small image well beyond its original resolution expecting sharp results \u2014 resizing can\'t add detail that wasn\'t captured in the original photo.',
  ],
  tips: [
    'Keep the aspect ratio locked unless the target field explicitly requires a different proportion.',
  ],
  faqs: [
    { question: 'Will resizing reduce image quality?', answer: 'Making an image smaller generally preserves quality well; enlarging a small image beyond its original size can make it look blurry.' },
    { question: 'What happens if I unlock the aspect ratio?', answer: 'You can set width and height independently, but mismatched proportions will stretch or squash the image \u2014 keep it locked unless a specific size is required.' },
    { question: 'Is there a maximum size I can resize to?', answer: 'You can enter any target dimensions, though enlarging far beyond the original resolution will look increasingly soft since no new detail is being added.' },
  ],
  related: [
    { label: 'Image Cropper', href: '/document-tools/image-cropper' },
    { label: 'Image Compressor', href: '/document-tools/image-compressor' },
  ],
};

export default function ImageResizerPage() {
  return (
    <ImageTransformWorkspace
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/image-resizer" icon={Layers} breadcrumb={{ label: 'Image Resizer' }} toolSlug={tool.slug} article={article}
      formatOptions="same-as-source"
      allowResize
      allowQuality
      defaultQuality={0.92}
    />
  );
}
