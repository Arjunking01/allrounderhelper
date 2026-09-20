import {
  Combine, Scissors, Minimize2, RotateCw, ArrowUpDown, FileOutput, FileMinus,
  ImagePlus, ImageDown, FileType2, FileText, ScanText,
  ImageIcon, Crop, RefreshCw, FileImage, Layers, Info,
  QrCode, ScanLine, Barcode,
  type LucideIcon,
} from 'lucide-react';

export type DocumentCategory = 'pdf' | 'conversion' | 'image' | 'qr';

export interface DocumentToolMeta {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  category: DocumentCategory;
  /** True for tools that describe an architecture/roadmap rather than a fully working conversion today. */
  architectureOnly?: boolean;
}

export const documentTools: DocumentToolMeta[] = [
  // PDF
  { slug: 'merge-pdf', name: 'Merge PDF', shortName: 'Merge PDF', tagline: 'Combine multiple PDFs into one file.', description: 'Merge multiple PDF files into a single document, entirely in your browser — reorder files before combining.', icon: Combine, category: 'pdf' },
  { slug: 'split-pdf', name: 'Split PDF', shortName: 'Split PDF', tagline: 'Split a PDF into individual page files.', description: 'Split a PDF into separate single-page files, downloaded together as a ZIP.', icon: Scissors, category: 'pdf' },
  { slug: 'compress-pdf', name: 'Compress PDF', shortName: 'Compress PDF', tagline: 'Shrink PDF file size for easier sharing.', description: 'Reduce PDF file size by optimizing its internal structure, directly in your browser.', icon: Minimize2, category: 'pdf' },
  { slug: 'rotate-pdf', name: 'Rotate PDF', shortName: 'Rotate PDF', tagline: 'Rotate one or all pages in a PDF.', description: 'Rotate individual pages or an entire PDF document 90, 180, or 270 degrees.', icon: RotateCw, category: 'pdf' },
  { slug: 'rearrange-pdf', name: 'Rearrange Pages', shortName: 'Rearrange Pages', tagline: 'Reorder the pages of a PDF document.', description: 'Reorder PDF pages using simple move-up and move-down controls, then export the result.', icon: ArrowUpDown, category: 'pdf' },
  { slug: 'extract-pdf-pages', name: 'Extract Pages', shortName: 'Extract Pages', tagline: 'Pull out specific pages into a new PDF.', description: 'Select specific pages from a PDF and extract them into a brand-new document.', icon: FileOutput, category: 'pdf' },
  { slug: 'delete-pdf-pages', name: 'Delete Pages', shortName: 'Delete Pages', tagline: 'Remove unwanted pages from a PDF.', description: 'Remove one or more pages from a PDF and download the cleaned-up document.', icon: FileMinus, category: 'pdf' },

  // Conversion
  { slug: 'image-to-pdf', name: 'Image to PDF', shortName: 'Image → PDF', tagline: 'Combine images into a single PDF.', description: 'Convert one or more images into a single PDF document, in the order you choose.', icon: ImagePlus, category: 'conversion' },
  { slug: 'pdf-to-image', name: 'PDF to Image', shortName: 'PDF → Image', tagline: 'Export PDF pages as PNG images.', description: 'Render each page of a PDF as a high-quality PNG image, downloaded individually or as a ZIP.', icon: ImageDown, category: 'conversion' },
  { slug: 'word-to-pdf', name: 'Word to PDF', shortName: 'Word → PDF', tagline: 'Convert Word documents into PDF.', description: 'Convert a .docx file into a PDF document, entirely in your browser — text, headings, and basic formatting are preserved.', icon: FileType2, category: 'conversion' },
  { slug: 'pdf-to-text', name: 'PDF to Text', shortName: 'PDF → Text', tagline: 'Extract plain text from a PDF.', description: 'Extract all readable text from a PDF document and download it as a plain text file.', icon: FileText, category: 'conversion' },
  { slug: 'ocr-text-extraction', name: 'OCR Text Extraction', shortName: 'OCR', tagline: 'Extract text from scanned documents and images.', description: 'Optical character recognition for scanned PDFs and images, running fully on-device with no file upload.', icon: ScanText, category: 'conversion' },

  // Image
  { slug: 'image-compressor', name: 'Image Compressor', shortName: 'Compressor', tagline: 'Shrink image file size with adjustable quality.', description: 'Compress JPG, PNG, or WEBP images with an adjustable quality slider — all processing happens in your browser.', icon: ImageIcon, category: 'image' },
  { slug: 'image-resizer', name: 'Image Resizer', shortName: 'Resizer', tagline: 'Resize images to exact dimensions.', description: 'Resize an image to specific pixel dimensions, with an option to lock the aspect ratio.', icon: Layers, category: 'image' },
  { slug: 'image-cropper', name: 'Image Cropper', shortName: 'Cropper', tagline: 'Crop images to the exact area you need.', description: 'Crop an image by dragging a selection box directly on the canvas, then download the result.', icon: Crop, category: 'image' },
  { slug: 'image-format-converter', name: 'Image Format Converter', shortName: 'Format Converter', tagline: 'Convert between JPG, PNG, and WEBP.', description: 'Convert any image between JPG, PNG, and WEBP formats directly in your browser.', icon: RefreshCw, category: 'image' },
  { slug: 'jpg-png-converter', name: 'JPG ↔ PNG Converter', shortName: 'JPG ↔ PNG', tagline: 'Quickly switch between JPG and PNG.', description: 'A focused converter for switching images between JPG and PNG formats.', icon: FileImage, category: 'image' },
  { slug: 'webp-converter', name: 'WEBP Converter', shortName: 'WEBP Converter', tagline: 'Convert images to and from WEBP.', description: 'Convert JPG or PNG images to WEBP, or convert WEBP images back to JPG or PNG.', icon: FileImage, category: 'image' },
  { slug: 'image-metadata-viewer', name: 'Image Metadata Viewer', shortName: 'Metadata Viewer', tagline: 'Inspect EXIF and file metadata in images.', description: 'View EXIF metadata — camera settings, dimensions, and more — embedded in an image file.', icon: Info, category: 'image' },

  // QR
  { slug: 'qr-code-generator', name: 'QR Code Generator', shortName: 'QR Generator', tagline: 'Create custom QR codes for links and text.', description: 'Generate a downloadable QR code from any text or URL, with adjustable size and colors.', icon: QrCode, category: 'qr' },
  { slug: 'qr-code-scanner', name: 'QR Code Scanner', shortName: 'QR Scanner', tagline: 'Scan QR codes using your camera or an image.', description: 'Scan a QR code using your device camera or by uploading an image.', icon: ScanLine, category: 'qr' },
  { slug: 'barcode-generator', name: 'Barcode Generator', shortName: 'Barcode Generator', tagline: 'Generate CODE128 barcodes instantly.', description: 'Generate a downloadable CODE128 barcode from any text or number.', icon: Barcode, category: 'qr' },
];

export const categoryLabels: Record<DocumentCategory, string> = {
  pdf: 'PDF Tools',
  conversion: 'PDF Conversion',
  image: 'Image Tools',
  qr: 'QR & Barcode Tools',
};

export function getDocumentToolBySlug(slug: string): DocumentToolMeta | undefined {
  return documentTools.find((t) => t.slug === slug);
}
