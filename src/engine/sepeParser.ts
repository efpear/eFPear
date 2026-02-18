/**
 * sepeParser.ts — SEPE Ficha PDF Parser
 *
 * Parses "Ficha de Certificado de Profesionalidad" PDFs from SEPE.
 * Extracts: certificate metadata, modules (MF), formative units (UF),
 * hours, competence units (UC), teacher requirements, and training spaces.
 *
 * Uses pdf.js (pdfjs-dist) for client-side PDF text extraction.
 * Deterministic: same PDF → same output.
 */

import type { Certificado, ModuloFormativo, Capacidad } from '../types';

// ============================================
// TYPES
// ============================================

export interface UnidadFormativa {
  codigo: string;       // UF2063
  titulo: string;
  horas: number;
}

export interface UnidadCompetencia {
  codigo: string;       // UC1254_3
  descripcion: string;
}

export interface RequisitosFormador {
  moduloCodigo: string;
  acreditacion: string[];
  experienciaConAcreditacion: string;
  experienciaSinAcreditacion: string;
}

export interface EspacioFormativo {
  nombre: string;
  superficie15: string;
  superficie25: string;
}

export interface FichaSEPE {
  // Core certificate data
  codigo: string;             // IMPE0211
  titulo: string;             // CARACTERIZACIÓN DE PERSONAJES
  nivel: 1 | 2 | 3;
  familiaProfesional: string;
  areaProfesional: string;
  regulacion: string;         // RD 620/2013...
  competenciaGeneral: string;

  // Structure
  unidadesCompetencia: UnidadCompetencia[];
  modulos: ModuloSEPE[];
  practicasModulo: ModuloSEPE | null;

  // Totals
  horasTotales: number;
  horasFormativas: number;

  // Requirements (optional - may not be parseable from all fichas)
  requisitosFormadores: RequisitosFormador[];
  espaciosFormativos: EspacioFormativo[];

  // Occupations
  ocupaciones: string[];

  // Parse metadata
  _parseWarnings: string[];
}

export interface ModuloSEPE {
  codigo: string;           // MF1254_3 or MP0435
  titulo: string;
  horas: number;
  nivel?: number;
  unidadesFormativas: UnidadFormativa[];
  esPracticas: boolean;
}

// ============================================
// REGEX PATTERNS
// ============================================

const PATTERNS = {
  // Certificate code: (IMPE0211), (HOTR0208), etc.
  certificadoCodigo: /\(([A-Z]{4}\d{4})\)/,

  // Level: NIV followed by 1, 2, or 3
  nivel: /NIV[:\s]*(\d)/i,

  // Module codes: MF1254_3, MF0066_2
  moduloFormativo: /MF\d{4}_\d/g,

  // Formative unit codes: UF2063
  unidadFormativa: /UF\d{4}/g,

  // Competence unit codes: UC1254_3
  unidadCompetencia: /UC\d{4}_\d/g,

  // Practices module: MP0435
  moduloPracticas: /MP\d{4}/,

  // RD reference
  regulacion: /\(RD\s+[\d/]+[^)]*\)/,

  // Hours patterns — multiple variants found in SEPE fichas
  horasTotales: /(?:horas?\s+totales?\s+certificado|duraci[oó]n\s+horas?\s+totales|total[:\s]+\d+\s*h)[:\s]*(\d+)/i,
  horasFormativas: /(?:horas?\s+m[oó]dulos?\s+formativos?|duraci[oó]n\s+horas?\s+m[oó]dulos?)[:\s]*(\d+)/i,

  // Family
  familia: /(?:Familia\s+profesional|FAMILIA\s+PROFESIONAL)[:\s]*([^\n]+)/i,
  area: /(?:[AÁ]rea\s+profesional|[AÁ]REA\s+PROFESIONAL)[:\s]*([^\n]+)/i,

  // Code pattern to strip from text before extracting numbers
  allCodes: /(?:MF\d{4}_\d|UF\d{4}|UC\d{4}_\d|MP\d{4}|CE\d+\.\d+)/g,
};

// ============================================
// HELPER: Strip code patterns from text
// ============================================

/**
 * Remove MF/UF/UC/MP/CE code patterns from text so their digits
 * don't get confused with hours or other numeric fields.
 */
function stripCodePatterns(text: string): string {
  return text.replace(PATTERNS.allCodes, ' ');
}

// ============================================
// PARSER CORE
// ============================================

/**
 * Parse raw text extracted from a SEPE ficha PDF.
 * This function works on plain text — PDF extraction happens separately.
 */
export function parseFichaTexto(text: string): FichaSEPE {
  const warnings: string[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // 1. Certificate code
  const codigoMatch = fullText.match(PATTERNS.certificadoCodigo);
  const codigo = codigoMatch?.[1] || '';
  if (!codigo) warnings.push('No se pudo extraer el código del certificado');

  // 2. Title — typically right after the code on the same line
  let titulo = '';
  if (codigoMatch) {
    const afterCode = fullText.substring((codigoMatch.index || 0) + codigoMatch[0].length);
    // Title is usually up to the next parenthesis or newline marker
    const tituloMatch = afterCode.match(/^\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,]+)/);
    titulo = tituloMatch?.[1]?.trim() || '';
  }

  // 3. Level
  const nivelMatch = fullText.match(PATTERNS.nivel);
  const nivel = (nivelMatch ? parseInt(nivelMatch[1]) : 0) as 1 | 2 | 3;
  if (!nivel) warnings.push('No se pudo extraer el nivel');

  // 4. Family & Area
  const familiaMatch = fullText.match(PATTERNS.familia);
  const familiaProfesional = familiaMatch?.[1]?.trim() || '';

  const areaMatch = fullText.match(PATTERNS.area);
  const areaProfesional = areaMatch?.[1]?.trim() || '';

  // 5. Regulation
  const regulacionMatch = fullText.match(PATTERNS.regulacion);
  const regulacion = regulacionMatch?.[0] || '';

  // 6. Competencia general
  const competenciaGeneral = extractCompetenciaGeneral(fullText);

  // 7. UC units
  const unidadesCompetencia = extractUnidadesCompetencia(text);

  // 8. Modules with UFs
  const { modulos, practicasModulo } = extractModulos(text, fullText);

  // 9. Hours — try explicit patterns first, then sum from modules
  const horasTotalesMatch = fullText.match(PATTERNS.horasTotales);
  const horasFormativasMatch = fullText.match(PATTERNS.horasFormativas);
  const horasFromModulos = modulos.reduce((s, m) => s + m.horas, 0);
  const horasFromPracticas = practicasModulo?.horas || 0;
  const horasTotales = horasTotalesMatch ? parseInt(horasTotalesMatch[1]) : horasFromModulos + horasFromPracticas;
  const horasFormativas = horasFormativasMatch ? parseInt(horasFormativasMatch[1]) : horasFromModulos;

  // 10. Occupations
  const ocupaciones = extractOcupaciones(text);

  // 11. Requisitos formadores
  const requisitosFormadores = extractRequisitosFormadores(text);

  // 12. Espacios formativos
  const espaciosFormativos = extractEspacios(text);

  // Validation warnings
  if (horasFromModulos === 0 && modulos.length > 0) {
    warnings.push('No se pudieron extraer las horas de los módulos — revisa el PDF');
  }
  if (modulos.some(m => m.horas === 0)) {
    const zeroCodes = modulos.filter(m => m.horas === 0).map(m => m.codigo);
    warnings.push(`Módulos sin horas detectadas: ${zeroCodes.join(', ')}`);
  }

  return {
    codigo,
    titulo,
    nivel,
    familiaProfesional,
    areaProfesional,
    regulacion,
    competenciaGeneral,
    unidadesCompetencia,
    modulos,
    practicasModulo,
    horasTotales,
    horasFormativas,
    requisitosFormadores,
    espaciosFormativos,
    ocupaciones,
    _parseWarnings: warnings,
  };
}

// ============================================
// EXTRACTION HELPERS
// ============================================

function extractCompetenciaGeneral(text: string): string {
  const startMarkers = ['Competencia general', 'COMPETENCIA GENERAL'];
  const endMarkers = ['Unidades de competencia', 'UNIDADES DE COMPETENCIA', 'Entorno Profesional', 'ENTORNO PROFESIONAL'];

  for (const start of startMarkers) {
    const startIdx = text.indexOf(start);
    if (startIdx === -1) continue;

    let endIdx = text.length;
    for (const end of endMarkers) {
      const eIdx = text.indexOf(end, startIdx + start.length);
      if (eIdx !== -1 && eIdx < endIdx) endIdx = eIdx;
    }

    const raw = text.substring(startIdx + start.length, endIdx).trim();
    // Clean up: remove leading colons/dots and trim
    return raw.replace(/^[:\s.]+/, '').trim();
  }
  return '';
}

function extractUnidadesCompetencia(text: string): UnidadCompetencia[] {
  const ucs: UnidadCompetencia[] = [];
  const ucRegex = /(UC\d{4}_\d)\s*[:\s]\s*([^\n]+)/g;
  let match;

  while ((match = ucRegex.exec(text)) !== null) {
    const codigo = match[1];
    let descripcion = match[2].trim();
    // Clean trailing artifacts
    descripcion = descripcion.replace(/\s+\d+\s*$/, '').trim();
    if (descripcion.endsWith('.')) descripcion = descripcion.slice(0, -1).trim();

    // Avoid duplicates
    if (!ucs.find(u => u.codigo === codigo)) {
      ucs.push({ codigo, descripcion });
    }
  }

  return ucs;
}

function extractModulos(text: string, fullText: string): { modulos: ModuloSEPE[]; practicasModulo: ModuloSEPE | null } {
  const modulos: ModuloSEPE[] = [];
  let practicasModulo: ModuloSEPE | null = null;

  // Find all unique MF codes
  const mfCodes = [...new Set([...fullText.matchAll(/MF\d{4}_\d/g)].map(m => m[0]))];
  const mpMatch = fullText.match(/MP\d{4}/);

  for (const mfCode of mfCodes) {
    const modulo = extractModuloDetails(text, mfCode);
    if (modulo) modulos.push(modulo);
  }

  // Prácticas module
  if (mpMatch) {
    const mpCode = mpMatch[0];
    // Find hours AFTER the MP code text — critical: don't match digits in "MP0435" itself
    const mpIdx = fullText.indexOf(mpCode);
    const afterMp = fullText.substring(mpIdx + mpCode.length);
    // Strip any remaining code patterns
    const cleanAfterMp = stripCodePatterns(afterMp);
    // Look for standalone hours number
    const horasMatch = cleanAfterMp.match(/\b(\d{2,4})\b/);
    let horas = 0;
    if (horasMatch) {
      const candidate = parseInt(horasMatch[1]);
      if (candidate >= 20 && candidate <= 600) {
        horas = candidate;
      }
    }
    // If no hours found, use 120 as reasonable default for prácticas
    if (horas === 0) horas = 120;

    practicasModulo = {
      codigo: mpCode,
      titulo: 'Módulo de prácticas profesionales no laborales',
      horas,
      unidadesFormativas: [],
      esPracticas: true,
    };
  }

  return { modulos, practicasModulo };
}

function extractModuloDetails(text: string, mfCode: string): ModuloSEPE | null {
  const lines = text.split('\n');
  const mfLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(mfCode)) {
      mfLines.push(i);
    }
  }

  if (mfLines.length === 0) return null;

  // Extract hours from context around the MF code
  // KEY FIX: strip all code patterns (MF/UF/UC/MP/CE) before looking for numbers
  let horas = 0;
  const startLine = mfLines[0];
  const contextLines = lines.slice(startLine, Math.min(startLine + 5, lines.length));

  for (const line of contextLines) {
    // Remove all code patterns so their digits don't interfere
    const cleanLine = stripCodePatterns(line);

    // Look for standalone numbers that could be hours (20-500)
    const candidates = [...cleanLine.matchAll(/\b(\d{2,3})\b/g)]
      .map(m => parseInt(m[1]))
      .filter(h => h >= 20 && h <= 500);

    if (candidates.length > 0) {
      horas = candidates[0];
      break;
    }
  }

  // Fallback: try looking for "Xh" or "X horas" patterns in wider context
  if (horas === 0) {
    const widerContext = lines.slice(startLine, Math.min(startLine + 8, lines.length)).join(' ');
    const cleanWider = stripCodePatterns(widerContext);
    const horasPattern = cleanWider.match(/(\d{2,3})\s*(?:h\b|horas?\b)/i);
    if (horasPattern) {
      const candidate = parseInt(horasPattern[1]);
      if (candidate >= 20 && candidate <= 500) {
        horas = candidate;
      }
    }
  }

  // Find UFs associated with this module
  const ufs: UnidadFormativa[] = [];
  const ufRegex = /UF\d{4}/g;
  const contextBlock = lines.slice(startLine, Math.min(startLine + 8, lines.length)).join(' ');
  const ufCodes = [...new Set([...contextBlock.matchAll(ufRegex)].map(m => m[0]))];

  for (const ufCode of ufCodes) {
    const ufLineText = lines.find(l => l.includes(ufCode)) || '';
    // Clean codes before extracting UF hours
    const cleanUfLine = stripCodePatterns(ufLineText);
    const ufHorasMatch = cleanUfLine.match(/\b(\d{2,3})\b/);
    let ufHoras = 0;
    if (ufHorasMatch) {
      const candidate = parseInt(ufHorasMatch[1]);
      if (candidate >= 10 && candidate <= 300) {
        ufHoras = candidate;
      }
    }

    ufs.push({
      codigo: ufCode,
      titulo: '',
      horas: ufHoras,
    });
  }

  // Extract nivel from MF code suffix
  const nivelMatch = mfCode.match(/_(\d)$/);
  const nivel = nivelMatch ? parseInt(nivelMatch[1]) : undefined;

  return {
    codigo: mfCode,
    titulo: '',
    horas,
    nivel,
    unidadesFormativas: ufs,
    esPracticas: false,
  };
}

function extractOcupaciones(text: string): string[] {
  const ocupaciones: string[] = [];
  // Look for occupation codes (4-digit patterns like 5812.1021)
  const ocuRegex = /(\d{4}\.\d{4})\s+([^\n]+)/g;
  let match;

  while ((match = ocuRegex.exec(text)) !== null) {
    ocupaciones.push(`${match[1]} ${match[2].trim()}`);
  }

  return ocupaciones;
}

function extractRequisitosFormadores(text: string): RequisitosFormador[] {
  // Basic extraction — this section varies a lot between fichas
  return [];
}

function extractEspacios(text: string): EspacioFormativo[] {
  // Basic extraction — format varies
  return [];
}

// ============================================
// CONVERSION: FichaSEPE → Certificado (for engines)
// ============================================

/**
 * Convert parsed SEPE ficha to the Certificado type used by engines.
 * Note: Without the BOE Annex, capacidades/criterios/contenidos will be empty.
 * The engines will still work for calendar and distribution calculations.
 */
export function fichaACertificado(ficha: FichaSEPE): Certificado {
  const modulos: ModuloFormativo[] = ficha.modulos.map(m => ({
    codigo: m.codigo,
    titulo: m.titulo || `Módulo ${m.codigo}`,
    horas: m.horas,
    capacidades: [],
    contenidos: [],
  }));

  // Add prácticas module if present
  if (ficha.practicasModulo) {
    modulos.push({
      codigo: ficha.practicasModulo.codigo,
      titulo: ficha.practicasModulo.titulo,
      horas: ficha.practicasModulo.horas,
      capacidades: [],
      contenidos: [],
    });
  }

  return {
    codigo: ficha.codigo,
    nombre: ficha.titulo || `Certificado ${ficha.codigo}`,
    nivel: ficha.nivel || 2,
    modulos,
  };
}

// ============================================
// PDF TEXT EXTRACTION (browser-side, uses pdfjs-dist)
// ============================================

/**
 * Extract text from a PDF file using pdf.js.
 * Uses position-aware text joining for better table/layout extraction.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const { pdfjsLib } = await import('./pdfSetup');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Position-aware text joining:
    // Group items by Y-coordinate to reconstruct lines,
    // then join items within each line with spaces.
    const items = content.items as Array<{
      str: string;
      transform: number[];
      hasEOL?: boolean;
    }>;

    if (items.length === 0) {
      pages.push('');
      continue;
    }

    // Group by Y position (transform[5] is the Y coordinate)
    // Items with similar Y (within 2px) are on the same line
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

    // Sort lines by Y (descending, since PDF Y starts from bottom)
    const sortedLines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0]);

    // Build page text: sort items within each line by X, join with spaces
    const pageLines: string[] = [];
    for (const [, lineItems] of sortedLines) {
      lineItems.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map(item => item.text).join(' ');
      pageLines.push(lineText);
    }

    pages.push(pageLines.join('\n'));
  }

  return pages.join('\n\n--- PAGE BREAK ---\n\n');
}

// ============================================
// FULL PIPELINE: File → FichaSEPE
// ============================================

/**
 * Main entry point: takes a PDF File, returns parsed FichaSEPE.
 */
export async function parseFichaPDF(file: File): Promise<FichaSEPE> {
  const text = await extractTextFromPDF(file);
  return parseFichaTexto(text);
}
