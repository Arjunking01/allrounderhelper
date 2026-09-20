import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a hashed worker asset URL at build time.
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let initialized = false;

export function getPdfjs() {
  if (!initialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    initialized = true;
  }
  return pdfjsLib;
}
