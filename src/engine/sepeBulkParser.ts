/**
 * sepeBulkParser.ts — Multi-ficha PDF splitter
 *
 * Takes a 900+ page PDF containing hundreds of SEPE fichas,
 * splits it into individual fichas, and parses each one.
 *
 * Uses pdfjs-dist (browser-side, GDPR compliant — zero server calls).
 */

import { pdfjsLib } from './pdfSetup';
import { parseFichaTexto } from './sepeParser';
import type { FichaSEPE } from './sepeParser';

// ============================================
// TYPES
// ============================================

export interface BulkParseProgress {
  phase: 'extracting' | 'splitting' | 'parsing' | 'done';
  current: number;
  total: number;
  message: string;
}

export interface BulkParseResult {
  fichas: FichaSEPE[];
  totalPages: number;
  skippedPages: number;
  parseErrors: Array<{ codigo: string; error: string }>;
  duration: number; // ms
}

export type ProgressCallback = (progress: BulkParseProgress) => void;

// ============================================
// CONSTANTS
// ============================================

// Pattern: "(AFDA0109)" at the start of a ficha
// Certificate code: 4 letters + 4 digits
const FICHA_START_RE = /\(([A-Z]{4}\d{4})\)\s+/;

// Pages to skip: index, intro, dividers, portada
// Divider pages have only the family name + illustration (very short text)
const MIN_TEXT_LENGTH = 80; // fichas always have more than this

// ============================================
// HELPER: Position-aware text extraction
// ============================================

/**
 * Extract text from a PDF page using position-aware joining.
 * Groups text items by Y-coordinate to reconstruct proper lines,
 * then sorts items within each line by X-coordinate.
 * Much better than naive .join(' ') for table-heavy SEPE fichas.
 */
function extractPageText(items: Array<{ str: string; transform: number[] }>): string {
  if (items.length === 0) return '';

  // Group by Y position (transform[5] is Y coordinate)
  // Items within 2px tolerance are on the same line
  const lineMap = new Map<number, Array<{ x: number; text: string }>>();

  for (const item of items) {
    if (!item.str.trim()) continue;

    const y = Math.round(item.transform[5]);
    const x = item.transform[4];

    // Find existing line within 2px tolerance
    let lineY = y;
    for (const existingY of lineMap.keys()) {
      if (Math.abs(existingY - y) <= 2) {
        lineY = existingY;
        break;
      }
    }

    if (!lineMap.has(lineY)) {
      lineMap.set(lineY, []);
    }
    lineMap.get(lineY)!.push({ x, text: item.str.trim() });
  }

  // Sort lines by Y (descending — PDF Y starts from bottom)
  const sortedLines = [...lineMap.entries()]
    .sort((a, b) => b[0] - a[0]);

  // Build text: sort items within each line by X, join with spaces
  const pageLines: string[] = [];
  for (const [, lineItems] of sortedLines) {
    lineItems.sort((a, b) => a.x - b.x);
    const lineText = lineItems.map(item => item.text).join(' ');
    pageLines.push(lineText);
  }

  return pageLines.join('\n');
}

// ============================================
// MAIN FUNCTION
// ============================================

export async function parseBulkPDF(
  file: File,
  onProgress?: ProgressCallback,
): Promise<BulkParseResult> {
  const t0 = performance.now();

  // 1. Load PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  onProgress?.({ phase: 'extracting', current: 0, total: totalPages, message: 'Extrayendo texto...' });

  // 2. Extract text from all pages (parallel batches to avoid memory spikes)
  const pageTexts: string[] = new Array(totalPages).fill('');
  const BATCH_SIZE = 50;

  for (let batch = 0; batch < totalPages; batch += BATCH_SIZE) {
    const end = Math.min(batch + BATCH_SIZE, totalPages);
    const promises: Promise<void>[] = [];

    for (let i = batch; i < end; i++) {
      promises.push(
        pdf.getPage(i + 1).then(async (page) => {
          const content = await page.getTextContent();
          // Position-aware text extraction for proper line reconstruction
          pageTexts[i] = extractPageText(
            content.items as Array<{ str: string; transform: number[] }>
          );
        })
      );
    }

    await Promise.all(promises);
    onProgress?.({ phase: 'extracting', current: end, total: totalPages, message: `Extrayendo texto... ${end}/${totalPages}` });
  }

  // 3. Split into fichas — detect boundaries
  onProgress?.({ phase: 'splitting', current: 0, total: totalPages, message: 'Detectando fichas...' });

  interface FichaChunk {
    codigo: string;
    startPage: number;
    pages: string[];
  }

  const chunks: FichaChunk[] = [];
  let currentChunk: FichaChunk | null = null;
  let skippedPages = 0;

  for (let i = 0; i < totalPages; i++) {
    const text = pageTexts[i];

    // Skip near-empty pages (dividers, portada, contraportada)
    if (text.length < MIN_TEXT_LENGTH) {
      skippedPages++;
      continue;
    }

    // Check if this page starts a new ficha
    const match = text.match(FICHA_START_RE);
    if (match) {
      // New ficha detected
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = {
        codigo: match[1],
        startPage: i + 1,
        pages: [text],
      };
    } else if (currentChunk) {
      // Continuation of current ficha
      currentChunk.pages.push(text);
    } else {
      // Before first ficha (index, intro pages)
      skippedPages++;
    }
  }

  // Push last chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  onProgress?.({ phase: 'splitting', current: chunks.length, total: chunks.length, message: `${chunks.length} fichas detectadas` });

  // 4. Parse each ficha
  const fichas: FichaSEPE[] = [];
  const parseErrors: Array<{ codigo: string; error: string }> = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const combinedText = chunk.pages.join('\n');
      const ficha = parseFichaTexto(combinedText);

      // If parser didn't extract the code, use the one from the boundary detection
      if (!ficha.codigo && chunk.codigo) {
        ficha.codigo = chunk.codigo;
      }

      fichas.push(ficha);
    } catch (err: any) {
      parseErrors.push({
        codigo: chunk.codigo,
        error: err.message || 'Parse error',
      });
    }

    if (i % 50 === 0 || i === chunks.length - 1) {
      onProgress?.({
        phase: 'parsing',
        current: i + 1,
        total: chunks.length,
        message: `Parseando fichas... ${i + 1}/${chunks.length}`,
      });
    }
  }

  const duration = performance.now() - t0;

  onProgress?.({
    phase: 'done',
    current: fichas.length,
    total: chunks.length,
    message: `${fichas.length} fichas parseadas en ${(duration / 1000).toFixed(1)}s`,
  });

  return {
    fichas,
    totalPages,
    skippedPages,
    parseErrors,
    duration,
  };
}

// ============================================
// CATALOG HELPERS
// ============================================

/** Group fichas by familia profesional */
export function agruparPorFamilia(fichas: FichaSEPE[]): Map<string, FichaSEPE[]> {
  const map = new Map<string, FichaSEPE[]>();
  for (const f of fichas) {
    const fam = f.familiaProfesional || 'Sin clasificar';
    if (!map.has(fam)) map.set(fam, []);
    map.get(fam)!.push(f);
  }
  // Sort each group by code
  for (const [, fichaList] of map) {
    fichaList.sort((a, b) => a.codigo.localeCompare(b.codigo));
  }
  return map;
}

/** Quick search by code or title fragment (case-insensitive) */
export function buscarFichas(fichas: FichaSEPE[], query: string): FichaSEPE[] {
  const q = query.toLowerCase().trim();
  if (!q) return fichas;
  return fichas.filter(f =>
    f.codigo.toLowerCase().includes(q) ||
    f.titulo.toLowerCase().includes(q) ||
    f.familiaProfesional.toLowerCase().includes(q)
  );
}
