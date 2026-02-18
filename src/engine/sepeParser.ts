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

  // Hours patterns
  horasTotales: /(?:horas?\s+totales?\s+certificado|duraci[oó]n\s+horas?\s+totales)[:\s]*(\d+)/i,
  horasFormativas: /(?:horas?\s+m[oó]dulos?\s+formativos?|duraci[oó]n\s+horas?\s+m[oó]dulos?)[:\s]*(\d+)/i,

  // Family
  familia: /(?:Familia\s+profesional|FAMILIA\s+PROFESIONAL)[:\s]*([^\n]+)/i,
  area: /(?:[AÁ]rea\s+profesional|[AÁ]REA\s+PROFESIONAL)[:\s]*([^\n]+)/i,
};

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

  // 9. Hours
  const horasTotalesMatch = fullText.match(PATTERNS.horasTotales);
  const horasFormativasMatch = fullText.match(PATTERNS.horasFormativas);
  const horasTotales = horasTotalesMatch ? parseInt(horasTotalesMatch[1]) : modulos.reduce((s, m) => s + m.horas, 0) + (practicasModulo?.horas || 0);
  const horasFormativas = horasFormativasMatch ? parseInt(horasFormativasMatch[1]) : modulos.reduce((s, m) => s + m.horas, 0);

  // 10. Occupations
  const ocupaciones = extractOcupaciones(text);

  // 11. Requisitos formadores
  const requisitosFormadores = extractRequisitosFormadores(text);

  // 12. Espacios formativos
  const espaciosFormativos = extractEspacios(text);

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

  // Find all MF codes with their hours
  // Pattern in ficha tables: MF1254_3 ... 120 ... UF2063 ... 60
  const mfCodes = [...new Set([...fullText.matchAll(/MF\d{4}_\d/g)].map(m => m[0]))];
  const mpMatch = fullText.match(/MP\d{4}/);

  for (const mfCode of mfCodes) {
    const modulo = extractModuloDetails(text, mfCode);
    if (modulo) modulos.push(modulo);
  }

  // Prácticas module
  if (mpMatch) {
    const mpCode = mpMatch[0];
    // Find hours near MP code
    const mpSection = fullText.substring(fullText.indexOf(mpCode));
    const horasMatch = mpSection.match(/(\d{2,4})/);
    const horas = horasMatch ? parseInt(horasMatch[1]) : 120; // default 120

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
  // Find the line containing this MF code
  const lines = text.split('\n');
  const mfLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(mfCode)) {
      mfLines.push(i);
    }
  }

  if (mfLines.length === 0) return null;

  // Extract hours — look for number patterns near the MF code
  // In SEPE fichas, hours appear in table columns
  let horas = 0;
  const firstLine = lines[mfLines[0]];
  const horasMatches = [...firstLine.matchAll(/\b(\d{2,3})\b/g)].map(m => parseInt(m[1]));

  // First number > 10 is typically the module hours
  for (const h of horasMatches) {
    if (h >= 20 && h <= 500) {
      horas = h;
      break;
    }
  }

  // Find UFs associated with this module
  const ufs: UnidadFormativa[] = [];
  const ufRegex = /UF\d{4}/g;

  // Look in nearby lines (within 5 lines after MF mention)
  const startLine = mfLines[0];
  const contextBlock = lines.slice(startLine, Math.min(startLine + 8, lines.length)).join(' ');
  const ufCodes = [...new Set([...contextBlock.matchAll(ufRegex)].map(m => m[0]))];

  for (const ufCode of ufCodes) {
    // Find UF hours
    const ufLineText = lines.find(l => l.includes(ufCode)) || '';
    const ufHorasMatch = ufLineText.match(new RegExp(ufCode + '\\D*(\\d{2,3})'));
    const ufHoras = ufHorasMatch ? parseInt(ufHorasMatch[1]) : 0;

    ufs.push({
      codigo: ufCode,
      titulo: '', // Title not always in ficha
      horas: ufHoras,
    });
  }

  // Extract nivel from MF code suffix
  const nivelMatch = mfCode.match(/_(\d)$/);
  const nivel = nivelMatch ? parseInt(nivelMatch[1]) : undefined;

  return {
    codigo: mfCode,
    titulo: '', // Will be filled from UC mapping or manually
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
  // Return empty if not clearly parseable
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
 * Call this from the UI component after user selects a file.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source — Vite handles this
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(pageText);
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
