import { useEffect, useRef, useState } from 'react';
import { Barcode as BarcodeIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { DocumentToolLayout } from '@/components/DocumentToolLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getDocumentToolBySlug } from '@/data/documentToolsRegistry';
import { useToolHistory, formatBytes } from '@/hooks/useToolHistory';
import { downloadBlob } from '../logic/fileUtils';

const tool = getDocumentToolBySlug('barcode-generator')!;

const article = {
  intro: 'Barcode Generator creates a downloadable CODE128 barcode from any text or number. The barcode preview updates live as you type, and downloads as a PNG image ready to print or embed.',
  whyItMatters: 'CODE128 barcodes are widely used for inventory, tickets, and ID labeling. Generating one directly from text or a number is faster than relying on specialized barcode software for a single label, and the live preview lets you catch invalid input immediately instead of after generating a file.',
  howItWorks: [
    'Type the text or number to encode into the input field \u2014 it starts pre-filled with a sample value so you can see the format immediately.',
    'The barcode preview regenerates automatically as you type, with the encoded value displayed underneath the bars.',
    'If a value can\u2019t be encoded as CODE128, an error message appears and the download button is disabled until you fix it.',
    'Click "Download PNG" to save the barcode image once the preview looks right.',
  ],
  examples: [
    { title: 'Labeling items for a project', body: 'Generate a barcode for each item in a small inventory or project catalog, encoding an ID number for each one.' },
    { title: 'Creating a ticket/entry code', body: 'Encode a unique alphanumeric code for each ticket or pass in a student event, then print the resulting barcodes for scanning at entry.' },
  ],
  mistakes: [
    'Using special characters not well-supported by CODE128 scanners \u2014 stick to standard alphanumeric text and numbers for reliable scanning.',
    'Expecting color or size customization \u2014 this tool generates a fixed black-on-white barcode at a standard size; if you need a different style, edit the downloaded PNG afterward in an image editor.',
  ],
  tips: [
    'Test a generated barcode with an actual scanner or scanning app before printing many copies.',
    'Keep the encoded text reasonably short \u2014 the preview updates live, so you can watch the barcode get wider as you type and judge readability before downloading.',
  ],
  faqs: [
    { question: 'What barcode format does this generate?', answer: 'CODE128, a widely supported format for text and numeric data.' },
    { question: 'Can I use this for retail product barcodes?', answer: 'CODE128 works for most inventory and internal labeling needs, but retail products typically require a specific format like UPC/EAN issued by a barcode registrar.' },
    { question: 'Is there a length limit for the encoded text?', answer: 'Very long text can make the barcode wide and harder for handheld scanners to read reliably \u2014 short IDs or codes scan most consistently.' },
    { question: 'Can I change the barcode\u2019s color or size?', answer: 'Not directly in this tool \u2014 it generates a fixed black-on-white PNG at a standard size. If you need different styling, edit the downloaded image afterward.' },
  ],
  related: [
    { label: 'QR Code Generator', href: '/document-tools/qr-code-generator' },
    { label: 'QR Code Scanner', href: '/document-tools/qr-code-scanner' },
  ],
};

export default function BarcodeGeneratorPage() {
  const [value, setValue] = useState('123456789012');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addEntry } = useToolHistory();

  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      JsBarcode(canvasRef.current, value || ' ', { format: 'CODE128', width: 2, height: 100, displayValue: true, background: '#ffffff', lineColor: '#0a0e1a' });
      setError('');
    } catch {
      setError('This value can\'t be encoded as a CODE128 barcode.');
    }
  }, [value]);

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, 'barcode.png');
      addEntry({ tool: tool.name, toolSlug: tool.slug, fileName: 'barcode.png', sizeLabel: formatBytes(blob.size) });
    });
  }

  return (
    <DocumentToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/document-tools/barcode-generator" icon={BarcodeIcon} breadcrumb={{ label: 'Barcode Generator' }} toolSlug={tool.slug} article={article}
    >
      <Card>
        <label className="block text-sm font-medium text-navy-700 dark:text-ink-300 mb-4">
          Text or number to encode
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="flex items-center justify-center rounded-2xl border border-navy-100 dark:border-white/10 p-6 bg-white mb-5">
          <canvas ref={canvasRef} />
        </div>

        <Button onClick={download} disabled={!!error}>Download PNG</Button>
      </Card>
    </DocumentToolLayout>
  );
}
