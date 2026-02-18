/**
 * pdfSetup.ts — Shared PDF.js worker configuration
 *
 * pdfjs-dist requires a web worker for PDF parsing.
 * This module configures the worker source once,
 * shared by sepeParser.ts and sepeBulkParser.ts.
 *
 * Uses Vite's ?url import to resolve the worker file at build time.
 * Works in dev mode (localhost) and production (Vercel).
 * No CDN dependency — important for offline PWA support.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export { pdfjsLib };
