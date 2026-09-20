import { useEffect, useRef, useState } from 'react';
import { ScanLine, Camera, CameraOff, Copy } from 'lucide-react';
import jsQR from 'jsqr';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { FileDropzone } from '@/components/document/FileDropzone';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory } from '@/hooks/useToolHistory';
import { useToast } from '@/components/ToastProvider';
import { loadImage } from '../logic/fileUtils';
import { copyToClipboard } from '@/lib/clipboard';

const tool = getDocumentToolBySlug('qr-code-scanner')!;

const article = {
  intro: 'QR Code Scanner reads a QR code using your device camera or an uploaded image, and shows you the text or link it contains.',
  whyItMatters: 'Not every device has a built-in QR scanner in its camera app. This gives a quick way to decode a QR code from a photo, screenshot, or live camera view without installing a separate app.',
  howItWorks: [
    'Allow camera access, or upload an image containing a QR code.',
    'The tool detects and decodes the QR code.',
    'View the decoded text or link, and open it if it\u2019s a URL.',
  ],
  examples: [
    { title: 'Scanning from a screenshot', body: 'Upload a screenshot of a QR code shared in a chat to read its contents without printing or pointing a camera at a screen.' },
    { title: 'Checking a link before opening it', body: 'Scanning a QR code from a poster or handout shows the decoded URL as text before you open it, so you can glance at the actual destination rather than tapping a code and being taken somewhere immediately.' },
  ],
  mistakes: [
    'Uploading a blurry or low-resolution image -- the code needs to be clearly visible for accurate detection.',
    'Denying camera access and then expecting live scanning to work -- if permission is declined, upload an image of the code instead.',
  ],
  tips: [
    'If scanning live, hold the camera steady and ensure the whole code is in frame and well lit.',
  ],
  faqs: [
    { question: 'Is my camera feed sent anywhere?', answer: 'No \u2014 scanning happens locally in your browser; nothing is uploaded to a server.' },
    { question: 'Can I scan a barcode instead of a QR code?', answer: 'No -- this scanner is built specifically to decode QR codes and does not read traditional linear barcodes. Barcode Generator on this site creates barcodes but does not scan them.' },
    { question: 'What if the code won\u2019t scan?', answer: 'Make sure the whole code is in frame, well lit, and not blurry \u2014 low-resolution or partially cropped images are the most common cause of failed detection.' },
  ],
  related: [
    { label: 'QR Code Generator', href: '/document-tools/qr-code-generator' },
    { label: 'Barcode Generator', href: '/document-tools/barcode-generator' },
  ],
};

export default function QrScannerPage() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // Reused across every scan frame instead of created per-frame — the live camera loop can
  // run this at up to 60fps, and allocating a full-resolution canvas + ImageData buffer that
  // often would be real, avoidable GC pressure for however long scanning is active.
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { addEntry } = useToolHistory();
  const { showToast } = useToast();

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      scanLoop();
    } catch {
      setError('Could not access the camera. Check browser permissions, or upload an image instead.');
    }
  }

  function scanLoop() {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    if (!scanCanvasRef.current) scanCanvasRef.current = document.createElement('canvas');
    const canvas = scanCanvasRef.current;
    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      setResult(code.data);
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: code.data.slice(0, 40), sizeLabel: 'Scanned' });
      stopCamera();
      return;
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  async function handleFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setError('');
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        setResult(code.data);
        addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: code.data.slice(0, 40), sizeLabel: 'Scanned' });
      } else {
        setError('No QR code detected in this image. Try a clearer or closer photo.');
      }
    } catch {
      setError('Could not read this image file.');
    }
  }

  async function copyResult() {
    const ok = await copyToClipboard(result);
    if (!ok) { showToast('Could not copy result'); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/qr-code-scanner" icon={ScanLine} breadcrumb={{ label: 'QR Code Scanner' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        {result ? (
          <SoftCard className="space-y-3">
            <p className="text-sm text-navy-500 dark:text-ink-500">Scanned content</p>
            <p className="font-medium break-all">{result}</p>
            <div className="flex gap-2">
              <Button size="sm" icon={<Copy size={14} />} onClick={copyResult}>{copied ? 'Copied!' : 'Copy'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setResult('')}>Scan another</Button>
            </div>
          </SoftCard>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {!cameraActive ? (
                <Button icon={<Camera size={16} />} onClick={startCamera}>Use camera</Button>
              ) : (
                <Button variant="outline" icon={<CameraOff size={16} />} onClick={stopCamera}>Stop camera</Button>
              )}
            </div>

            {cameraActive && (
              <video ref={videoRef} className="w-full max-w-sm rounded-2xl border border-navy-100 dark:border-white/10" muted playsInline />
            )}

            <FileDropzone accept="image/*" label="Or drop a QR code image here" onFiles={handleFile} />
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </Card>
    </DocumentToolLayout>
  );
}
