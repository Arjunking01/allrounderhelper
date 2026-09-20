import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob } from '../logic/fileUtils';

const tool = getDocumentToolBySlug('qr-code-generator')!;

const article = {
  intro: 'QR Code Generator creates a downloadable QR code from any text or URL, with a live preview that updates as you type and adjustable size and colors.',
  whyItMatters: 'A QR code turns a link or piece of text into something that can be scanned instantly with a phone camera \u2014 useful for sharing a link on a poster, presentation, or printed handout without anyone needing to type it out.',
  howItWorks: [
    'Enter the text or URL you want to encode \u2014 the preview regenerates automatically as you type, no separate "generate" step needed.',
    'Adjust size (128\u2013512px) and foreground/background colors with the sliders and color pickers.',
    'Download the generated QR code as a PNG image.',
  ],
  examples: [
    { title: 'Sharing a project link', body: 'Generate a QR code linking to an online portfolio or project page to include on a printed poster or slide.' },
    { title: 'Sharing plain text, not a link', body: 'Type a short note or a piece of contact info directly \u2014 no "http://" needed \u2014 and the code will simply display that text when scanned, since this tool encodes exactly what you type rather than requiring a URL.' },
  ],
  mistakes: [
    'Using low-contrast colors between the code and background, which can make it hard for cameras to scan reliably.',
    'Picking a very small size (near 128px) for a code meant to be printed large \u2014 scale up before printing so it stays easy to scan from a distance.',
    'Expecting a "Wi-Fi details" or contact-info entry to auto-connect or import as a contact card \u2014 this tool encodes plain text as typed, not the special WIFI:/vCard formats phones look for to trigger those automatic actions.',
  ],
  tips: [
    'Test the generated code with a phone camera before printing or sharing it widely.',
    'Keep colors high-contrast \u2014 dark code on a light background scans most reliably.',
  ],
  faqs: [
    { question: 'Does the QR code expire?', answer: 'No \u2014 the code itself doesn\u2019t expire; it will keep working as long as the encoded link or text remains valid.' },
    { question: 'Is my data sent to a server to generate the code?', answer: 'No \u2014 the QR code is generated entirely in your browser from the text you enter, and updates live as you type.' },
    { question: 'Can I encode more than just a URL?', answer: 'Yes \u2014 any plain text works, including a short message or contact details typed out as text. Note this is a plain-text encoder, not a Wi-Fi or contact-card template \u2014 typing "Wi-Fi: myNetwork, password: 1234" produces a code that displays that text when scanned, not one that automatically connects a phone to Wi-Fi, since that requires a specific WIFI: syntax this tool doesn\'t generate for you.' },
  ],
  related: [
    { label: 'QR Code Scanner', href: '/document-tools/qr-code-scanner' },
    { label: 'Barcode Generator', href: '/document-tools/barcode-generator' },
  ],
};

export default function QrGeneratorPage() {
  const [text, setText] = useState('https://allrounderhelper.vercel.app');
  const [size, setSize] = useState(320);
  const [darkColor, setDarkColor] = useState('#0a0e1a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');
  const { addEntry } = useToolHistory();

  useEffect(() => {
    let cancelled = false;
    if (!text.trim()) {
      setDataUrl('');
      return;
    }
    QRCode.toDataURL(text, { width: size, margin: 2, color: { dark: darkColor, light: lightColor } })
      .then((url: string) => {
        if (cancelled) return;
        setDataUrl(url);
        setError('');
      })
      .catch(() => {
        if (!cancelled) setError('Could not generate a QR code for this input.');
      });
    return () => {
      cancelled = true;
    };
  }, [text, size, darkColor, lightColor]);

  async function download() {
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    downloadBlob(blob, 'qr-code.png');
    addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: 'qr-code.png', sizeLabel: formatBytes(blob.size) });
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/qr-code-generator" icon={QrCode} breadcrumb={{ label: 'QR Code Generator' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        <div className="grid sm:grid-cols-[1fr_260px] gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-navy-700 dark:text-ink-300">
              Text or URL
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20" />
            </label>
            <label className="block text-sm">
              Size — {size}px
              <input type="range" min={128} max={512} step={16} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-1 w-full accent-electric-500" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Foreground
                <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-navy-200 dark:border-white/10" />
              </label>
              <label className="text-sm">
                Background
                <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-navy-200 dark:border-white/10" />
              </label>
            </div>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <Button disabled={!dataUrl} onClick={download}>Download PNG</Button>
          </div>

          <div className="flex items-center justify-center rounded-2xl border border-navy-100 dark:border-white/10 p-6 bg-white">
            {dataUrl ? <img src={dataUrl} alt="Generated QR code" className="max-w-full" /> : <p className="text-sm text-navy-400">Enter text to preview</p>}
          </div>
        </div>
      </Card>
    </DocumentToolLayout>
  );
}
