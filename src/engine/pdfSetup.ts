/**
 * pdfSetup.ts — Shared PDF.js worker configuration
 *
 * pdfjs-dist requires a web worker for PDF parsing.
 * This module configures the worker source once,
 * shared by sepeParser.ts and sepeBulkParser.ts.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker matching the installed pdfjs-dist version
// This is the most reliable approach for Vite + pdfjs-dist v5
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export { pdfjsLib };
