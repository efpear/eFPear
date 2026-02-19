/**
 * planningParser.ts - Block A: Parse any SEPE document -> PlanningDataset
 * Updated: 2026-02-19 - Slice 6
 *
 * Wraps sepeParser.parseFichaTexto() and pdfjsLib to extract
 * MF + MO modules with hours from any SEPE PDF document.
 * Rule: MO/MP modules are detected and excluded from lectivas hours.
 */

import { pdfjsLib } from "./pdfSetup";
import { parseFichaTexto } from "./sepeParser";
import { sanitizeLiteralText } from "./sanitizeLiteralText";
import type { PlanningDataset, PlanningModule, ModuleTipo } from "../types/planning";

// ============================================================
// HELPERS
// ============================================================

/** Detect if a module code or title refers to a Modulo de Practicas */
function esPracticas(codigo: string, titulo: string): boolean {
  const codigoUpper = codigo.toUpperCase();
  const tituloLower = titulo.toLowerCase();
  return (
    /^MP\d{4}/.test(codigoUpper) ||
    /^MO\d{4}/.test(codigoUpper) ||
    tituloLower.includes("practicas profesionales") ||
    tituloLower.includes("modulo de practicas") ||
    tituloLower.includes("practicas no laborales") ||
    tituloLower.includes("formacion en centros de trabajo") ||
    tituloLower.includes("fct")
  );
}

function getTipo(codigo: string, titulo: string): ModuleTipo {
  if (esPracticas(codigo, titulo)) return "MO";
  return "MF";
}

// ============================================================
// PDF TEXT EXTRACTION
// ============================================================

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines: string[] = [];

  for (let p = 1; p <= Math.min(pdf.numPages, 60); p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; transform: number[] }>;

    const pageLines: string[] = [];
    let currentLine: Array<{ x: number; text: string }> = [];
    let currentY: number | null = null;

    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];

      if (currentY !== null && Math.abs(y - currentY) > 5) {
        if (currentLine.length > 0) {
          currentLine.sort((a, b) => a.x - b.x);
          pageLines.push(currentLine.map((it) => it.text).join(" "));
        }
        currentLine = [];
      }
      currentLine.push({ x, text: item.str.trim() });
      currentY = y;
    }
    if (currentLine.length > 0) {
      currentLine.sort((a, b) => a.x - b.x);
      pageLines.push(currentLine.map((it) => it.text).join(" "));
    }
    lines.push(...pageLines);
  }

  return lines.join("\n");
}

// ============================================================
// MAIN: Parse PDF -> PlanningDataset
// ============================================================

export async function parsePDFForPlanning(file: File): Promise<PlanningDataset> {
  const rawText = await extractTextFromPDF(file);
  const cleanText = sanitizeLiteralText(rawText);
  const ficha = parseFichaTexto(cleanText);

  const modules: PlanningModule[] = [];
  let idx = 0;

  for (const mod of ficha.modulos) {
    const tipo = getTipo(mod.codigo, mod.titulo);
    modules.push({
      id: `mod-${idx++}`,
      codigo: mod.codigo,
      titulo: sanitizeLiteralText(mod.titulo),
      horas: mod.horas,
      tipo,
      excluido: tipo === "MO" || tipo === "MP",
    });
  }

  if (ficha.practicasModulo) {
    modules.push({
      id: `mod-${idx++}`,
      codigo: ficha.practicasModulo.codigo,
      titulo: sanitizeLiteralText(ficha.practicasModulo.titulo),
      horas: ficha.practicasModulo.horas,
      tipo: "MO",
      excluido: true,
    });
  }

  const totalHorasLectivas = modules
    .filter((m) => !m.excluido)
    .reduce((sum, m) => sum + m.horas, 0);
  const totalHorasPracticas = modules
    .filter((m) => m.excluido)
    .reduce((sum, m) => sum + m.horas, 0);

  return {
    codigoCertificado: ficha.codigo,
    tituloCertificado: sanitizeLiteralText(ficha.titulo),
    modules,
    totalHorasLectivas,
    totalHorasPracticas,
    source: "pdf",
    warnings: ficha._parseWarnings,
  };
}

// ============================================================
// Build empty manual PlanningDataset
// ============================================================

export function createEmptyPlanningDataset(): PlanningDataset {
  return {
    codigoCertificado: "",
    tituloCertificado: "",
    modules: [],
    totalHorasLectivas: 0,
    totalHorasPracticas: 0,
    source: "manual",
    warnings: [],
  };
}

export function recalcTotals(dataset: PlanningDataset): PlanningDataset {
  const totalHorasLectivas = dataset.modules
    .filter((m) => !m.excluido)
    .reduce((sum, m) => sum + m.horas, 0);
  const totalHorasPracticas = dataset.modules
    .filter((m) => m.excluido)
    .reduce((sum, m) => sum + m.horas, 0);
  return { ...dataset, totalHorasLectivas, totalHorasPracticas };
}
