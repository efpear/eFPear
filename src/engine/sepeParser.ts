/**
 * sepeParser.ts — SEPE Ficha PDF Parser v4
 *
 * Parses "Ficha de Certificado de Profesionalidad" PDFs from SEPE.
 * Extracts: certificate metadata, modules (MF), formative units (UF),
 * hours, competence units (UC).
 *
 * v4 fixes:
 * - Text extraction preserves pdf.js reading order (no Y-sort reversal)
 * - Hours from H.CP column (AFTER MF code), not H.Q (before)
 * - Code pattern stripping before number extraction
 */

import type { Certificado, ModuloFormativo, Capacidad } from '../types';

// ============================================
// TYPES
// ============================================

export interface UnidadFormativa {
  codigo: string;
  titulo: string;
  horas: number;
}

export interface UnidadCompetencia {
  codigo: string;
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
  codigo: string;
  titulo: string;
  nivel: 1 | 2 | 3;
  familiaProfesional: string;
  areaProfesional: string;
  regulacion: string;
  competenciaGeneral: string;
  unidadesCompetencia: UnidadCompetencia[];
  modulos: ModuloSEPE[];
  practicasModulo: ModuloSEPE | null;
  horasTotales: number;
  horasFormativas: number;
  requisitosFormadores: RequisitosFormador[];
  espaciosFormativos: EspacioFormativo[];
  ocupaciones: string[];
  _parseWarnings: string[];
}

export interface ModuloSEPE {
  codigo: string;
  titulo: string;
  horas: number;
  nivel?: number;
  unidadesFormativas: UnidadFormativa[];
  esPracticas: boolean;
}

// ============================================
// PATTERNS
// ============================================

const PATTERNS = {
  certificadoCodigo: /\(([A-Z]{4}\d{4})\)/,
  nivel: /NIV[:\s.]*(\d)/i,
  moduloPracticas: /MP\d{4}/,
  regulacion: /\(RD\s+[\d/]+[^)]*\)/,
  horasTotales: /(?:horas?\s+totales?\s+certificado|[Dd]uraci[oó]n\s+horas?\s+totales)[:\s]*(\d+)/i,
  horasFormativas: /(?:horas?\s+m[oó]dulos?\s+formativos?|[Dd]uraci[oó]n\s+horas?\s+m[oó]dulos?)[:\s]*(\d+)/i,
  familia: /(?:Familia\s+profesional|FAMILIA\s+PROFESIONAL)[:\s]*([^\n]+)/i,
  area: /(?:[AÁ]rea\s+profesional|[AÁ]REA\s+PROFESIONAL)[:\s]*([^\n]+)/i,
  allCodes: /(?:MF\d{4}_\d|UF\d{4}|UC\d{4}_\d|MP\d{4}|CE\d+\.\d+)/g,
};

function stripCodes(text: string): string {
  return text.replace(PATTERNS.allCodes, ' ');
}

// ============================================
// PARSER CORE
// ============================================

export function parseFichaTexto(text: string): FichaSEPE {
  const warnings: string[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  const codigoMatch = fullText.match(PATTERNS.certificadoCodigo);
  const codigo = codigoMatch?.[1] || '';
  if (!codigo) warnings.push('No se pudo extraer el código del certificado');

  let titulo = '';
  if (codigoMatch) {
    const afterCode = fullText.substring((codigoMatch.index || 0) + codigoMatch[0].length);
    const tituloMatch = afterCode.match(/^\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,]+)/);
    titulo = tituloMatch?.[1]?.trim() || '';
  }

  const nivelMatch = fullText.match(PATTERNS.nivel);
  const nivel = (nivelMatch ? parseInt(nivelMatch[1]) : 0) as 1 | 2 | 3;
  if (!nivel) warnings.push('No se pudo extraer el nivel');

  const familiaMatch = fullText.match(PATTERNS.familia);
  const familiaProfesional = familiaMatch?.[1]?.trim() || '';
  const areaMatch = fullText.match(PATTERNS.area);
  const areaProfesional = areaMatch?.[1]?.trim() || '';

  const regulacionMatch = fullText.match(PATTERNS.regulacion);
  const regulacion = regulacionMatch?.[0] || '';

  const competenciaGeneral = extractCompetenciaGeneral(fullText);
  const unidadesCompetencia = extractUnidadesCompetencia(text);
  const { modulos, practicasModulo } = extractModulos(text, fullText);

  const horasTotalesMatch = fullText.match(PATTERNS.horasTotales);
  const horasFormativasMatch = fullText.match(PATTERNS.horasFormativas);
  const horasFromModulos = modulos.reduce((s, m) => s + m.horas, 0);
  const horasFromPracticas = practicasModulo?.horas || 0;
  const horasTotales = horasTotalesMatch ? parseInt(horasTotalesMatch[1]) : horasFromModulos + horasFromPracticas;
  const horasFormativas = horasFormativasMatch ? parseInt(horasFormativasMatch[1]) : horasFromModulos;

  const ocupaciones = extractOcupaciones(text);

  const zeroMods = modulos.filter(m => m.horas === 0);
  if (zeroMods.length > 0) {
    warnings.push(`Módulos sin horas: ${zeroMods.map(m => m.codigo).join(', ')}`);
  }

  console.log(`[sepeParser] ${codigo}: ${modulos.length} MF, ${horasFormativas}h formativas, ${horasTotales}h total`);
  modulos.forEach(m => console.log(`  ${m.codigo}: ${m.horas}h (${m.unidadesFormativas.length} UFs)`));
  if (practicasModulo) console.log(`  ${practicasModulo.codigo}: ${practicasModulo.horas}h prácticas`);
  if (warnings.length > 0) console.warn(`[sepeParser] Warnings:`, warnings);

  return {
    codigo, titulo, nivel, familiaProfesional, areaProfesional, regulacion,
    competenciaGeneral, unidadesCompetencia, modulos, practicasModulo,
    horasTotales, horasFormativas,
    requisitosFormadores: [], espaciosFormativos: [],
    ocupaciones, _parseWarnings: warnings,
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
    return text.substring(startIdx + start.length, endIdx).trim().replace(/^[:\s.]+/, '').trim();
  }
  return '';
}

function extractUnidadesCompetencia(text: string): UnidadCompetencia[] {
  const ucs: UnidadCompetencia[] = [];
  const ucRegex = /(UC\d{4}_\d)\s*[:\s]\s*([^\n]+)/g;
  let match;
  while ((match = ucRegex.exec(text)) !== null) {
    const codigo = match[1];
    let descripcion = match[2].trim().replace(/\s+\d+\s*$/, '').trim();
    if (descripcion.endsWith('.')) descripcion = descripcion.slice(0, -1).trim();
    if (!ucs.find(u => u.codigo === codigo)) ucs.push({ codigo, descripcion });
  }
  return ucs;
}

function extractModulos(text: string, fullText: string): { modulos: ModuloSEPE[]; practicasModulo: ModuloSEPE | null } {
  const modulos: ModuloSEPE[] = [];
  let practicasModulo: ModuloSEPE | null = null;

  const mfCodes = [...new Set([...fullText.matchAll(/MF\d{4}_\d/g)].map(m => m[0]))];
  const mpMatch = fullText.match(/MP\d{4}/);

  for (const mfCode of mfCodes) {
    const modulo = extractModuloDetails(text, mfCode);
    if (modulo) modulos.push(modulo);
  }

  if (mpMatch) {
    const mpCode = mpMatch[0];
    const mpIdx = fullText.indexOf(mpCode);
    const afterMp = fullText.substring(mpIdx + mpCode.length);
    const cleanAfterMp = stripCodes(afterMp);
    const horasMatch = cleanAfterMp.match(/\b(\d{2,4})\b/);
    let horas = 0;
    if (horasMatch) {
      const c = parseInt(horasMatch[1]);
      if (c >= 20 && c <= 600) horas = c;
    }
    if (horas === 0) horas = 120;

    practicasModulo = {
      codigo: mpCode,
      titulo: 'Módulo de prácticas profesionales no laborales',
      horas, unidadesFormativas: [], esPracticas: true,
    };
  }

  return { modulos, practicasModulo };
}

function extractModuloDetails(text: string, mfCode: string): ModuloSEPE | null {
  const lines = text.split('\n');
  const mfLines: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(mfCode)) mfLines.push(i);
  }
  if (mfLines.length === 0) return null;

  let horas = 0;
  const startLine = mfLines[0];
  const contextLines = lines.slice(startLine, Math.min(startLine + 5, lines.length));

  for (const line of contextLines) {
    const mfIdx = line.indexOf(mfCode);
    const afterMF = mfIdx >= 0 ? line.substring(mfIdx + mfCode.length) : line;
    const cleanAfter = stripCodes(afterMF);
    const candidates = [...cleanAfter.matchAll(/\b(\d{2,3})\b/g)]
      .map(m => parseInt(m[1]))
      .filter(h => h >= 20 && h <= 500);
    if (candidates.length > 0) { horas = candidates[0]; break; }
  }

  if (horas === 0) {
    const widerContext = lines.slice(startLine, Math.min(startLine + 8, lines.length)).join(' ');
    const mfIdx = widerContext.indexOf(mfCode);
    const afterMF = mfIdx >= 0 ? widerContext.substring(mfIdx + mfCode.length) : widerContext;
    const cleanWider = stripCodes(afterMF);
    const horasPattern = cleanWider.match(/(\d{2,3})\s*(?:h\b|horas?\b)/i);
    if (horasPattern) {
      const c = parseInt(horasPattern[1]);
      if (c >= 20 && c <= 500) horas = c;
    }
  }

  const ufs: UnidadFormativa[] = [];
  const contextBlock = lines.slice(startLine, Math.min(startLine + 8, lines.length)).join(' ');
  const ufCodes = [...new Set([...contextBlock.matchAll(/UF\d{4}/g)].map(m => m[0]))];
  for (const ufCode of ufCodes) {
    const ufLine = lines.find(l => l.includes(ufCode)) || '';
    const ufIdx = ufLine.indexOf(ufCode);
    const afterUF = ufIdx >= 0 ? ufLine.substring(ufIdx + ufCode.length) : ufLine;
    const cleanUf = stripCodes(afterUF);
    const ufHorasMatch = cleanUf.match(/\b(\d{2,3})\b/);
    let ufHoras = 0;
    if (ufHorasMatch) { const c = parseInt(ufHorasMatch[1]); if (c >= 10 && c <= 300) ufHoras = c; }
    ufs.push({ codigo: ufCode, titulo: '', horas: ufHoras });
  }

  const nivelMatch = mfCode.match(/_(\d)$/);
  const nivel = nivelMatch ? parseInt(nivelMatch[1]) : undefined;

  return { codigo: mfCode, titulo: '', horas, nivel, unidadesFormativas: ufs, esPracticas: false };
}

function extractOcupaciones(text: string): string[] {
  const ocupaciones: string[] = [];
  const ocuRegex = /(\d{4}\.\d{4})\s+([^\n]+)/g;
  let match;
  while ((match = ocuRegex.exec(text)) !== null) {
    ocupaciones.push(`${match[1]} ${match[2].trim()}`);
  }
  return ocupaciones;
}

// ============================================
// CONVERSION: FichaSEPE -> Certificado
// ============================================

export function fichaACertificado(ficha: FichaSEPE): Certificado {
  const modulos: ModuloFormativo[] = ficha.modulos.map(m => ({
    codigo: m.codigo,
    titulo: m.titulo || `Módulo ${m.codigo}`,
    horas: m.horas,
    capacidades: [],
    contenidos: [],
  }));

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
// PDF TEXT EXTRACTION — v4 (reading-order preserving)
// ============================================

/**
 * Extract text from PDF using pdf.js, preserving reading order.
 *
 * pdf.js returns items in content-stream order (reading order for well-formed PDFs).
 * Instead of sorting by Y (which can reverse the entire page), we:
 * 1. Process items in pdf.js native order
 * 2. Detect line breaks when Y changes significantly (>5px gap)
 * 3. Sort items within each line by X for correct column order
 *
 * This correctly handles SEPE ficha tables where columns must be left-to-right
 * and rows must be top-to-bottom.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const { pdfjsLib } = await import('./pdfSetup');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const items = content.items as Array<{ str: string; transform: number[] }>;
    if (items.length === 0) { pages.push(''); continue; }

    // Process items in native order, group by Y proximity
    const pageLines: string[] = [];
    let currentLine: Array<{ x: number; text: string }> = [];
    let currentY: number | null = null;

    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];

      // If Y changed significantly, flush current line and start new one
      if (currentY !== null && Math.abs(y - currentY) > 5) {
        if (currentLine.length > 0) {
          currentLine.sort((a, b) => a.x - b.x);
          pageLines.push(currentLine.map(it => it.text).join(' '));
        }
        currentLine = [];
      }

      currentLine.push({ x, text: item.str.trim() });
      currentY = y;
    }

    // Flush last line
    if (currentLine.length > 0) {
      currentLine.sort((a, b) => a.x - b.x);
      pageLines.push(currentLine.map(it => it.text).join(' '));
    }

    pages.push(pageLines.join('\n'));
  }

  return pages.join('\n\n--- PAGE BREAK ---\n\n');
}

// ============================================
// FULL PIPELINE
// ============================================

export async function parseFichaPDF(file: File): Promise<FichaSEPE> {
  const text = await extractTextFromPDF(file);
  console.log('[sepeParser] Extracted text (first 800 chars):', text.substring(0, 800));
  return parseFichaTexto(text);
}
